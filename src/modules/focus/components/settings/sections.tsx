"use client";

import { useEffect, useState } from "react";
import { Check, LockSimple, Play } from "@phosphor-icons/react";
import { Field, NumberField, Select } from "@/core/ui/fields";
import { Switch } from "@/core/ui/Switch";
import { Segmented } from "@/core/ui/Segmented";
import { Button } from "@/core/ui/Button";
import { ProBadge } from "@/core/ui/ProBadge";
import { useCan } from "@/core/billing/entitlements";
import { useGate } from "@/core/billing/useGate";
import { usePrefs } from "@/core/prefs";
import { notificationPermission, requestNotifications } from "@/core/lib/notify";
import { cn } from "@/core/lib/cn";
import { useT } from "@/core/i18n";
import { useFocusSettings } from "../../store/settings";
import { ALARMS, AMBIENTS, playAlarm, previewAmbient, unlockAudio } from "../../audio/synth";
import { FaceList } from "../FacePicker";
import { Group, SectionTitle } from "./SettingsDialog";
import type { AlarmId, AmbientId } from "../../types";

function useSettings() {
  const doc = useFocusSettings((s) => s.doc);
  const set = useFocusSettings((s) => s.set);
  return [doc, set] as const;
}

export function TimerSection() {
  const t = useT();
  const [s, set] = useSettings();
  const setDuration = (key: keyof typeof s.durations, v: number) => set({ durations: { ...s.durations, [key]: v } });
  return (
    <>
      <SectionTitle eyebrow={t("Timer")} title={t("Rhythm")}>
        {t("The classic is 25 minutes on, 5 off, and a longer break after four rounds. Tune it to how long you can actually stay with something.")}
      </SectionTitle>
      <Group title={t("Lengths")}>
        <Field label={t("Focus")}>
          <NumberField label={t("Focus minutes")} value={s.durations.focus} onChange={(v) => setDuration("focus", v)} min={1} max={240} suffix="min" />
        </Field>
        <Field label={t("Short break")}>
          <NumberField label={t("Short break minutes")} value={s.durations.short} onChange={(v) => setDuration("short", v)} min={1} max={60} suffix="min" />
        </Field>
        <Field label={t("Long break")}>
          <NumberField label={t("Long break minutes")} value={s.durations.long} onChange={(v) => setDuration("long", v)} min={1} max={120} suffix="min" />
        </Field>
        <Field label={t("Long break every")} hint={t("Number of focus sessions before a long break.")}>
          <NumberField label={t("Long break interval")} value={s.longBreakInterval} onChange={(v) => set({ longBreakInterval: v })} min={1} max={12} />
        </Field>
      </Group>
      <Group title={t("Flow")}>
        <Field label={t("Start breaks automatically")}>
          <Switch label={t("Start breaks automatically")} checked={s.autoStartBreaks} onChange={(v) => set({ autoStartBreaks: v })} />
        </Field>
        <Field label={t("Start focus automatically")} hint={t("After a break ends.")}>
          <Switch label={t("Start focus automatically")} checked={s.autoStartFocus} onChange={(v) => set({ autoStartFocus: v })} />
        </Field>
        <Field
          label={t("Daily goal")}
          hint={t(
            "Shown as a ring in the top bar; 0 hides it. Habits form fastest around a small target you can hit on most days, so start with one session and raise it once it feels easy (Lally et al. 2010).",
          )}
        >
          <NumberField
            label={t("Daily goal minutes")}
            value={s.goalMinutes}
            onChange={(v) => set({ goalMinutes: v })}
            min={0}
            max={480}
            step={5}
            suffix="min"
          />
        </Field>
      </Group>
    </>
  );
}

export function TasksSection() {
  const t = useT();
  const [s, set] = useSettings();
  return (
    <>
      <SectionTitle eyebrow={t("Tasks")} title={t("Task behaviour")} />
      <Group>
        <Field label={t("Tick off tasks automatically")} hint={t("When completed sessions reach the estimate.")}>
          <Switch label={t("Tick off tasks automatically")} checked={s.autoCheckTasks} onChange={(v) => set({ autoCheckTasks: v })} />
        </Field>
        <Field label={t("Move to the next task")} hint={t("When the active task is ticked off.")}>
          <Switch label={t("Move to the next task")} checked={s.autoSwitchTasks} onChange={(v) => set({ autoSwitchTasks: v })} />
        </Field>
      </Group>
    </>
  );
}

function Range({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <input
      type="range"
      min={0}
      max={100}
      value={Math.round(value * 100)}
      aria-label={label}
      onChange={(e) => onChange(Number(e.target.value) / 100)}
      className="h-1.5 w-36 cursor-pointer appearance-none rounded-full bg-ink/15 accent-[var(--c-ink)]"
    />
  );
}

export function SoundSection() {
  const t = useT();
  const [s, set] = useSettings();
  const canSounds = useCan("sounds.all");
  const gate = useGate();

  const pickAlarm = (id: AlarmId) => {
    const def = ALARMS.find((a) => a.id === id)!;
    const apply = () => {
      set({ alarm: id });
      unlockAudio();
      playAlarm(id, s.alarmVolume, 1);
    };
    if (def.pro) gate("sounds.all", apply);
    else apply();
  };

  const pickAmbient = (id: AmbientId) => {
    const def = AMBIENTS.find((a) => a.id === id)!;
    const apply = () => {
      set({ ambient: id });
      unlockAudio();
      if (id !== "none") previewAmbient(id, s.ambientVolume);
    };
    if (def.pro) gate("sounds.all", apply);
    else apply();
  };

  return (
    <>
      <SectionTitle eyebrow={t("Sound")} title={t("Alarms & ambience")}>
        {t("Everything is synthesised in your browser, so nothing needs to download.")}
      </SectionTitle>
      <Group title={t("Alarm")}>
        <div className="grid grid-cols-2 gap-2 py-4 sm:grid-cols-3">
          {ALARMS.map((a) => {
            const active = s.alarm === a.id;
            const locked = a.pro && !canSounds;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => pickAlarm(a.id)}
                className={cn(
                  "flex h-12 items-center justify-between rounded-2xl px-4 text-left text-sm font-medium transition-colors",
                  active ? "bg-ink text-page" : "bg-fill hover:bg-ink/10",
                )}
              >
                {t(a.name)}
                {active ? (
                  <Check size={15} weight="bold" />
                ) : locked ? (
                  <LockSimple size={13} weight="bold" className="text-ink-3" />
                ) : (
                  <Play size={13} weight="fill" className="opacity-40" />
                )}
              </button>
            );
          })}
        </div>
        <Field label={t("Volume")}>
          <Range label={t("Alarm volume")} value={s.alarmVolume} onChange={(v) => set({ alarmVolume: v })} />
        </Field>
        <Field label={t("Repeat")}>
          <NumberField label={t("Alarm repeat")} value={s.alarmRepeat} onChange={(v) => set({ alarmRepeat: v })} min={1} max={5} suffix="×" />
        </Field>
      </Group>
      <Group title={t("Ambient sound while focusing")}>
        <div className="grid grid-cols-2 gap-2 py-4 sm:grid-cols-4">
          {AMBIENTS.map((a) => {
            const active = s.ambient === a.id;
            const locked = a.pro && !canSounds;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => pickAmbient(a.id)}
                className={cn(
                  "flex h-12 items-center justify-between gap-2 rounded-2xl px-4 text-left text-[13px] font-medium transition-colors",
                  active ? "bg-ink text-page" : "bg-fill hover:bg-ink/10",
                )}
              >
                {t(a.name)}
                {active ? <Check size={14} weight="bold" /> : locked ? <LockSimple size={12} weight="bold" className="shrink-0 text-ink-3" /> : null}
              </button>
            );
          })}
        </div>
        <Field label={t("Volume")}>
          <Range label={t("Ambient volume")} value={s.ambientVolume} onChange={(v) => set({ ambientVolume: v })} />
        </Field>
        <Field label={t("Keep playing during breaks")}>
          <Switch label={t("Ambient during breaks")} checked={s.ambientInBreaks} onChange={(v) => set({ ambientInBreaks: v })} />
        </Field>
      </Group>
    </>
  );
}

export function DisplaySection() {
  const t = useT();
  const [s, set] = useSettings();
  const prefs = usePrefs((p) => p.doc);
  const setPrefs = usePrefs((p) => p.set);
  return (
    <>
      <SectionTitle eyebrow={t("Faces")} title={t("How time looks")}>
        {t("Faces marked “no ticker” never count seconds. To hide the timer completely, press H or use the eye button above it.")}
      </SectionTitle>
      <Group title={t("Face")}>
        <div className="py-2">
          <FaceList />
        </div>
      </Group>
      <Group title={t("Details")}>
        <Field label={t("Show seconds")} hint={t("Digits face only.")}>
          <Switch label={t("Show seconds")} checked={s.showSeconds} onChange={(v) => set({ showSeconds: v })} />
        </Field>
        <Field label={t("Time in tab title")}>
          <Switch label={t("Time in tab title")} checked={s.timeInTitle} onChange={(v) => set({ timeInTitle: v })} />
        </Field>
        <Field label={t("Clock format")}>
          <Segmented
            size="sm"
            ariaLabel={t("Clock format")}
            value={prefs.hourFormat}
            onChange={(v) => setPrefs({ hourFormat: v })}
            options={[
              { value: "24h", label: "24h" },
              { value: "12h", label: "12h" },
            ]}
          />
        </Field>
        <Field label={t("Week starts on")}>
          <Segmented
            size="sm"
            ariaLabel={t("Week starts on")}
            value={String(prefs.weekStart) as "1" | "0"}
            onChange={(v) => setPrefs({ weekStart: v === "1" ? 1 : 0 })}
            options={[
              { value: "1", label: t("Monday") },
              { value: "0", label: t("Sunday") },
            ]}
          />
        </Field>
      </Group>
    </>
  );
}

export function NotificationsSection() {
  const t = useT();
  const [s, set] = useSettings();
  const [perm, setPerm] = useState<string>("default");
  useEffect(() => setPerm(notificationPermission()), []);

  return (
    <>
      <SectionTitle eyebrow={t("Alerts")} title={t("Notifications")}>
        {t("Desktop notifications reach you when Steen is in a background tab.")}
      </SectionTitle>
      <Group>
        <Field
          label={t("Desktop notifications")}
          hint={
            perm === "denied"
              ? t("Blocked in your browser's site settings.")
              : perm === "unsupported"
                ? t("Not supported in this browser.")
                : perm === "granted"
                  ? t("Allowed.")
                  : t("Your browser will ask for permission.")
          }
        >
          <Switch
            label={t("Desktop notifications")}
            checked={s.notifications && perm === "granted"}
            disabled={perm === "denied" || perm === "unsupported"}
            onChange={async (v) => {
              if (v) {
                const ok = await requestNotifications();
                setPerm(notificationPermission());
                set({ notifications: ok });
              } else set({ notifications: false });
            }}
          />
        </Field>
        <Field label={t("Heads-up before the end")} hint={t("A quiet notification a few minutes before a session ends.")}>
          <Select value={s.reminderMinutes} onChange={(e) => set({ reminderMinutes: Number(e.target.value) })}>
            <option value={0}>{t("Off")}</option>
            {[1, 2, 3, 5, 10].map((m) => (
              <option key={m} value={m}>
                {t("{m} min before", { m })}
              </option>
            ))}
          </Select>
        </Field>
      </Group>
      <div className="mt-6">
        <Button
          variant="outline"
          size="sm"
          icon={<Play size={13} weight="fill" />}
          onClick={() => {
            unlockAudio();
            playAlarm(s.alarm, s.alarmVolume, 1);
          }}
        >
          {t("Test alarm sound")}
        </Button>
      </div>
    </>
  );
}
