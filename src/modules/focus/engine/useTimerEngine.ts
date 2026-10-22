"use client";

import { useEffect } from "react";
import { formatClock, formatDuration, MINUTE } from "@/core/lib/time";
import { notify } from "@/core/lib/notify";
import { toast } from "@/core/ui/store";
import { t as tr } from "@/core/i18n";
import { useTimer } from "../store/timer";
import { useFocusSettings } from "../store/settings";
import { useActivities } from "../store/data";
import { elapsedOf, endsAtOf, remainingOf } from "./logic";
import { timerEvents } from "./events";
import { currentAmbient, isPreviewing, playAlarm, playAmbient, stopAmbient } from "../audio/synth";
import { MODE_LABEL } from "../labels";

/**
 * The heartbeat of the focus module, mounted once in the app shell so the
 * timer keeps running while you browse other pages. Completion is checked
 * against wall-clock time, so background-tab throttling can't drift it.
 */
export function useTimerEngine() {
  // Tick: completion, reminder, title, ambient sound.
  useEffect(() => {
    const baseTitle = document.title.includes("Steen") ? "Steen" : document.title;

    const tick = () => {
      const t = useTimer.getState();
      const s = useFocusSettings.getState().doc;
      const now = Date.now();
      const isFlow = t.flow && t.mode === "focus";

      if (t.status === "running" && !isFlow) {
        const endsAt = endsAtOf(t);
        if (endsAt != null && now >= endsAt) {
          t.finish(true, endsAt);
          return;
        }
        const remaining = remainingOf(t, now);
        if (s.reminderMinutes > 0 && !t.reminderFired && remaining <= s.reminderMinutes * MINUTE && t.plannedMs > s.reminderMinutes * MINUTE) {
          useTimer.setState({ reminderFired: true });
          if (s.notifications) notify(tr("{minutes} min left", { minutes: s.reminderMinutes }), tr("{mode} ends soon.", { mode: tr(MODE_LABEL[t.mode]) }));
        }
      }

      // Tab title.
      if (t.status === "idle" || !s.timeInTitle) {
        document.title = baseTitle;
      } else if (s.hideTimer) {
        document.title = `${t.status === "paused" ? tr("Paused") : t.mode === "focus" ? tr("In focus") : tr("On a break")} · ${baseTitle}`;
      } else {
        const clock = isFlow ? formatClock(elapsedOf(t, now)) : formatClock(remainingOf(t, now));
        document.title = `${t.status === "paused" ? "❚❚ " : ""}${clock} · ${isFlow ? tr("Flow") : tr(MODE_LABEL[t.mode])}`;
      }

      // Ambient sound follows the running state.
      if (!isPreviewing()) {
        const wanted = t.status === "running" && (t.mode === "focus" || s.ambientInBreaks) ? s.ambient : "none";
        const playing = currentAmbient();
        if (wanted === "none" && playing) stopAmbient();
        else if (wanted !== "none") playAmbient(wanted, s.ambientVolume);
      }
    };

    tick();
    const id = window.setInterval(tick, 250);
    const onVisible = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      document.title = baseTitle;
      stopAmbient();
    };
  }, []);

  // Durations changed in settings: apply to an idle timer.
  useEffect(() => {
    useTimer.getState().syncDurations();
    return useFocusSettings.subscribe((s, prev) => {
      if (s.doc.durations !== prev.doc.durations) useTimer.getState().syncDurations();
    });
  }, []);

  // Segment finished: alarm, notification, toast.
  useEffect(() => {
    return timerEvents.on((e) => {
      const s = useFocusSettings.getState().doc;
      if (e.completed) playAlarm(s.alarm, s.alarmVolume, s.alarmRepeat);

      const activity = e.entry?.activityId ? useActivities.getState().items[e.entry.activityId] : null;
      if (e.mode === "focus") {
        if (e.entry) {
          const vars = { duration: formatDuration(e.entry.durationMs), activity: activity?.name ?? "" };
          toast({
            message: e.completed
              ? activity
                ? tr("Logged {duration} of {activity}.", vars)
                : tr("Logged {duration}.", vars)
              : activity
                ? tr("Saved {duration} of {activity} (interrupted).", vars)
                : tr("Saved {duration} (interrupted).", vars),
            tone: "success",
          });
        }
        if (e.completed && s.notifications)
          notify(e.flow ? tr("Nice flow.") : tr("Focus complete"), e.next === "long" ? tr("Time for a long break.") : tr("Time for a short break."));
      } else if (e.completed && s.notifications) {
        notify(tr("Break's over"), tr("Ready when you are."));
      }
    });
  }, []);
}
