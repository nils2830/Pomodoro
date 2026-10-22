"use client";

import { useState } from "react";
import { Dialog } from "@/core/ui/Dialog";
import { Button } from "@/core/ui/Button";
import { NumberField, Select, TextInput } from "@/core/ui/fields";
import { toast } from "@/core/ui/store";
import { useEntries, type Entry } from "@/core/data/entries";
import { dayKey, parseDayKey } from "@/core/lib/date";
import { MINUTE } from "@/core/lib/time";
import { useActivityList } from "@/modules/focus/hooks";
import { useTimer } from "@/modules/focus/store/timer";
import { useT } from "@/core/i18n";

const timeValue = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

/** Log time done away from the timer, or correct an existing session. */
export function EntryDialog({ open, onClose, entry }: { open: boolean; onClose: () => void; entry?: Entry | null }) {
  const t = useT();
  const activities = useActivityList();
  const defaultActivity = useTimer((s) => s.activityId);
  const start = entry?.startedAt ?? Date.now() - 60 * MINUTE;
  const [day, setDay] = useState(dayKey(start));
  const [time, setTime] = useState(timeValue(start));
  const [minutes, setMinutes] = useState(entry ? Math.round(entry.durationMs / MINUTE) : 45);
  const [activityId, setActivityId] = useState(entry?.activityId ?? defaultActivity);
  const [what, setWhat] = useState(entry?.taskTitle ?? "");

  const save = () => {
    const [h, m] = time.split(":").map(Number);
    const d = parseDayKey(day);
    d.setHours(h, m, 0, 0);
    const startedAt = d.getTime();
    const durationMs = minutes * MINUTE;
    if (startedAt + durationMs > Date.now() + MINUTE) {
      toast({ message: t("That would end in the future."), tone: "error" });
      return;
    }
    const data = { startedAt, endedAt: startedAt + durationMs, durationMs, activityId, taskTitle: what.trim() || null };
    if (entry) useEntries.getState().update(entry.id, data);
    else
      useEntries.getState().create({
        ...data,
        module: "focus",
        kind: "focus",
        mode: "manual",
        plannedMs: null,
        completed: true,
        pauses: 0,
        taskId: null,
        projectId: null,
        source: "manual",
      });
    toast({ message: entry ? t("Session updated.") : t("Time logged."), tone: "success" });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      eyebrow={entry ? t("Edit session") : t("Log time")}
      title={entry ? t("Adjust this session") : t("Add time you spent")}
      size="sm"
    >
      <form
        className="mt-3 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="eyebrow mb-2 block text-ink-3">{t("Day")}</span>
            <TextInput type="date" value={day} max={dayKey(Date.now())} onChange={(e) => setDay(e.target.value)} required />
          </label>
          <label className="block">
            <span className="eyebrow mb-2 block text-ink-3">{t("Started")}</span>
            <TextInput type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
          </label>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="eyebrow mb-2 block text-ink-3">{t("Length")}</span>
            <NumberField label={t("Minutes")} value={minutes} onChange={setMinutes} min={1} max={600} step={5} suffix="min" />
          </div>
          <label className="block min-w-[160px] flex-1">
            <span className="eyebrow mb-2 block text-ink-3">{t("Activity")}</span>
            <Select value={activityId} onChange={(e) => setActivityId(e.target.value)} wrapperClassName="w-full">
              {activities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </label>
        </div>
        <label className="block">
          <span className="eyebrow mb-2 block text-ink-3">{t("What (optional)")}</span>
          <TextInput value={what} onChange={(e) => setWhat(e.target.value)} placeholder={t("e.g. Library session, reading group")} />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            {t("Cancel")}
          </Button>
          <Button variant="primary" type="submit">
            {entry ? t("Save") : t("Log it")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
