"use client";

import { useMemo, useState } from "react";
import { PencilSimple, Trash, Infinity as InfinityIcon, HandPointing, Lightning } from "@phosphor-icons/react";
import { useEntries, type Entry } from "@/core/data/entries";
import { usePrefs } from "@/core/prefs";
import { dayKey } from "@/core/lib/date";
import { formatDuration, formatTimeOfDay } from "@/core/lib/time";
import { toast } from "@/core/ui/store";
import { Button } from "@/core/ui/Button";
import { useActivityList } from "@/modules/focus/hooks";
import { useLocale, useT } from "@/core/i18n";
import { formatDayLabel } from "../dates";
import { EntryDialog } from "./EntryDialog";

function Kind({ e }: { e: Entry }) {
  const t = useT();
  if (e.source === "manual")
    return (
      <span className="inline-flex items-center gap-1 text-ink-3">
        <HandPointing size={13} weight="bold" />
        {t("Logged")}
      </span>
    );
  if (e.mode === "flow")
    return (
      <span className="inline-flex items-center gap-1 text-ink-3">
        <InfinityIcon size={13} weight="bold" />
        {t("Flow")}
      </span>
    );
  if (!e.completed)
    return (
      <span className="inline-flex items-center gap-1 text-ink-3">
        <Lightning size={13} weight="bold" />
        {t("Cut short")}
      </span>
    );
  return null;
}

export function SessionLog({ focus }: { focus: Entry[] }) {
  const t = useT();
  const locale = useLocale();
  const activities = useActivityList(true);
  const hourFormat = usePrefs((s) => s.doc.hourFormat);
  const [limit, setLimit] = useState(40);
  const [editing, setEditing] = useState<Entry | null>(null);
  const byId = useMemo(() => new Map(activities.map((a) => [a.id, a])), [activities]);

  const days = useMemo(() => {
    const sorted = [...focus].sort((a, b) => b.startedAt - a.startedAt).slice(0, limit);
    const groups: { key: string; ts: number; total: number; items: Entry[] }[] = [];
    for (const e of sorted) {
      const key = dayKey(e.startedAt);
      let g = groups[groups.length - 1];
      if (!g || g.key !== key) {
        g = { key, ts: e.startedAt, total: 0, items: [] };
        groups.push(g);
      }
      g.items.push(e);
    }
    for (const g of groups) g.total = focus.filter((e) => dayKey(e.startedAt) === g.key).reduce((s, e) => s + e.durationMs, 0);
    return groups;
  }, [focus, limit]);

  if (focus.length === 0) return <p className="text-[14px] text-ink-3">{t("No sessions in this period.")}</p>;

  const remove = (e: Entry) => {
    useEntries.getState().remove(e.id);
    toast({
      message: t("Session deleted."),
      action: { label: t("Undo"), onClick: () => useEntries.getState().update(e.id, { deletedAt: null }) },
    });
  };

  return (
    <div>
      {days.map((g) => (
        <div key={g.key} className="mb-6">
          <div className="flex items-baseline justify-between border-b border-line pb-2">
            <span className="text-[14px] font-semibold">{formatDayLabel(locale, g.ts)}</span>
            <span className="text-[13px] text-ink-3 tabular-nums">{formatDuration(g.total)}</span>
          </div>
          <ul>
            {g.items.map((e) => {
              const a = e.activityId ? byId.get(e.activityId) : undefined;
              return (
                <li
                  key={e.id}
                  className="group grid grid-cols-[92px_1fr_auto] items-center gap-3 border-b border-line/70 py-2.5 text-[14px] sm:grid-cols-[120px_160px_1fr_auto_auto]"
                >
                  <span className="text-ink-2 tabular-nums">
                    {formatTimeOfDay(e.startedAt, hourFormat)}–{formatTimeOfDay(e.endedAt, hourFormat)}
                  </span>
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: a ? `var(--series-${a.color + 1})` : "var(--c-ink-3)" }} />
                    <span className="truncate">{a?.name ?? t("Unassigned")}</span>
                  </span>
                  <span className="hidden min-w-0 truncate text-ink-2 sm:block">
                    {e.taskTitle ?? ""} <Kind e={e} />
                  </span>
                  <span className="text-right font-semibold tabular-nums">{formatDuration(e.durationMs)}</span>
                  <span className="hidden gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 sm:flex">
                    <button
                      type="button"
                      aria-label={t("Edit session")}
                      onClick={() => setEditing(e)}
                      className="grid size-7 place-items-center rounded-full text-ink-3 hover:bg-fill hover:text-ink"
                    >
                      <PencilSimple size={14} weight="bold" />
                    </button>
                    <button
                      type="button"
                      aria-label={t("Delete session")}
                      onClick={() => remove(e)}
                      className="grid size-7 place-items-center rounded-full text-ink-3 hover:bg-fill hover:text-bad"
                    >
                      <Trash size={14} weight="bold" />
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {focus.length > limit && (
        <Button variant="outline" size="sm" onClick={() => setLimit((l) => l + 60)}>
          {t("Show more")}
        </Button>
      )}
      {editing && <EntryDialog key={editing.id} open onClose={() => setEditing(null)} entry={editing} />}
    </div>
  );
}
