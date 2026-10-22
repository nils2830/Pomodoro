"use client";

import { useMemo, useState } from "react";
import { Broom, ArrowCounterClockwise, DotsThree, FloppyDisk, Plus, Stack, Trash } from "@phosphor-icons/react";
import { Popover, MenuItem, MenuSeparator } from "@/core/ui/Popover";
import { IconButton } from "@/core/ui/Button";
import { ProBadge } from "@/core/ui/ProBadge";
import { confirmAction } from "@/core/ui/store";
import { useGate } from "@/core/billing/useGate";
import { useCan } from "@/core/billing/entitlements";
import { usePrefs } from "@/core/prefs";
import { formatHours, formatTimeOfDay } from "@/core/lib/time";
import { useNow } from "@/core/lib/useNow";
import { cn } from "@/core/lib/cn";
import { useT } from "@/core/i18n";
import { useTasks } from "../store/data";
import { useTimer } from "../store/timer";
import { useFocusSettings } from "../store/settings";
import { useProjectList, useTaskList } from "../hooks";
import { remainingOf } from "../engine/logic";
import { estimateRemaining } from "../engine/estimate";
import { TaskItem } from "./TaskItem";
import { TaskEditor } from "./TaskEditor";
import { TemplatesDialog } from "./TemplatesDialog";

export function TaskPanel({ addRequest }: { addRequest: number }) {
  const t = useT();
  const tasks = useTaskList();
  const projects = useProjectList();
  const activeTaskId = useTimer((s) => s.activeTaskId);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [lastAddRequest, setLastAddRequest] = useState(addRequest);
  const [templates, setTemplates] = useState<"save" | "load" | null>(null);
  const [drag, setDrag] = useState<{ id: string; over: string | null; pos: "before" | "after" } | null>(null);
  const gate = useGate();
  const canTemplates = useCan("templates");

  // Keyboard shortcut "N" bumps addRequest.
  if (addRequest !== lastAddRequest) {
    setLastAddRequest(addRequest);
    setEditing("new");
  }

  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const remaining = tasks.filter((t) => !t.done);

  const reorder = (dragId: string, overId: string, pos: "before" | "after") => {
    if (dragId === overId) return;
    const ids = tasks.map((t) => t.id).filter((id) => id !== dragId);
    const idx = ids.indexOf(overId) + (pos === "after" ? 1 : 0);
    ids.splice(idx, 0, dragId);
    const store = useTasks.getState();
    ids.forEach((id, i) => {
      if (store.items[id].order !== i + 1) store.update(id, { order: i + 1 });
    });
  };

  return (
    <section data-tour="tasks" aria-label={t("Tasks")} className="flex flex-col">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-baseline gap-3">
          <h2 className="display text-[26px] leading-none">{t("Tasks")}</h2>
          {tasks.length > 0 && <span className="text-[13px] text-ink-3">{t("{count} open", { count: remaining.length })}</span>}
        </div>
        <Popover
          align="end"
          trigger={(props) => (
            <IconButton label={t("Task options")} {...props}>
              <DotsThree size={22} weight="bold" />
            </IconButton>
          )}
        >
          {(close) => (
            <>
              <MenuItem
                icon={<Broom size={16} weight="bold" />}
                onClick={() => {
                  close();
                  useTasks.getState().removeWhere((t) => t.done);
                }}
              >
                {t("Clear finished tasks")}
              </MenuItem>
              <MenuItem
                icon={<ArrowCounterClockwise size={16} weight="bold" />}
                onClick={() => {
                  close();
                  tasks.forEach((t) => t.act && useTasks.getState().update(t.id, { act: 0 }));
                }}
              >
                {t("Reset session counts")}
              </MenuItem>
              <MenuSeparator />
              <MenuItem
                icon={<FloppyDisk size={16} weight="bold" />}
                trailing={!canTemplates ? <ProBadge /> : undefined}
                disabled={tasks.length === 0}
                onClick={() => {
                  close();
                  gate("templates", () => setTemplates("save"));
                }}
              >
                {t("Save as template")}
              </MenuItem>
              <MenuItem
                icon={<Stack size={16} weight="bold" />}
                trailing={!canTemplates ? <ProBadge /> : undefined}
                onClick={() => {
                  close();
                  gate("templates", () => setTemplates("load"));
                }}
              >
                {t("Add from template")}
              </MenuItem>
              <MenuSeparator />
              <MenuItem
                icon={<Trash size={16} weight="bold" />}
                tone="danger"
                disabled={tasks.length === 0}
                onClick={async () => {
                  close();
                  if (
                    await confirmAction({
                      title: t("Clear all tasks?"),
                      body: t("Your logged time stays in Insights."),
                      confirmLabel: t("Clear all"),
                      tone: "danger",
                    })
                  ) {
                    useTasks.getState().removeWhere(() => true);
                    useTimer.getState().setActiveTask(null);
                  }
                }}
              >
                {t("Clear all tasks")}
              </MenuItem>
            </>
          )}
        </Popover>
      </div>

      <div className="h-px bg-line" />

      <ul className="mt-2 flex flex-col gap-1" onDragEnd={() => setDrag(null)}>
        {tasks.map((task) =>
          editing === task.id ? (
            <li key={task.id} className="py-1">
              <TaskEditor task={task} onDone={() => setEditing(null)} />
            </li>
          ) : (
            <TaskItem
              key={task.id}
              task={task}
              project={task.projectId ? projectById.get(task.projectId) : undefined}
              active={task.id === activeTaskId}
              onEdit={() => setEditing(task.id)}
              dropHint={drag && drag.over === task.id && drag.id !== task.id ? drag.pos : null}
              dragProps={{
                draggable: true,
                onDragStart: (e) => {
                  e.dataTransfer.effectAllowed = "move";
                  setDrag({ id: task.id, over: null, pos: "before" });
                },
                onDragOver: (e) => {
                  if (!drag) return;
                  e.preventDefault();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pos = e.clientY > rect.top + rect.height / 2 ? "after" : "before";
                  if (drag.over !== task.id || drag.pos !== pos) setDrag({ ...drag, over: task.id, pos });
                },
                onDrop: (e) => {
                  e.preventDefault();
                  if (drag) reorder(drag.id, task.id, drag.pos);
                  setDrag(null);
                },
              }}
            />
          ),
        )}
      </ul>

      <div className="mt-2">
        {editing === "new" ? (
          <TaskEditor onDone={() => setEditing(null)} />
        ) : (
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-[18px] border-2 border-dashed border-ink/25 text-[15px] font-semibold text-ink-2 transition-colors hover:border-ink/50 hover:bg-fill hover:text-ink"
          >
            <Plus size={18} weight="bold" />
            {t("Add task")}
          </button>
        )}
      </div>

      <FinishEstimate />

      <TemplatesDialog open={templates !== null} mode={templates ?? "load"} onClose={() => setTemplates(null)} />
    </section>
  );
}

function FinishEstimate() {
  const t = useT();
  const tasks = useTaskList();
  const timer = useTimer();
  const settings = useFocusSettings((s) => s.doc);
  const hourFormat = usePrefs((s) => s.doc.hourFormat);
  const now = useNow(30_000);
  const open = tasks.filter((t) => !t.done);
  const est = open.reduce((s, t) => s + t.est, 0);
  const act = open.reduce((s, t) => s + Math.min(t.act, t.est), 0);
  const left = open.reduce((s, t) => s + Math.max(0, t.est - t.act), 0);
  if (tasks.length === 0) return null;
  const ms = estimateRemaining({
    sessions: left,
    durations: settings.durations,
    longBreakInterval: settings.longBreakInterval,
    cycle: timer.cycle,
    mode: timer.mode,
    currentRemainingMs: timer.flow && timer.mode === "focus" ? settings.durations.focus * 60_000 : remainingOf(timer, now),
  });
  return (
    <div className={cn("mt-4 flex items-center justify-center gap-5 rounded-[18px] bg-fill px-4 py-3.5 text-[14px] text-ink-2")}>
      <span>
        {t("Sessions")} <b className="tnum font-semibold text-ink">{act}</b>/<span className="tnum">{est}</span>
      </span>
      <span className="h-4 w-px bg-line" />
      <span>
        {left === 0 ? (
          t("All caught up")
        ) : (
          <>
            {t("Done by")} <b className="tnum font-semibold text-ink">{formatTimeOfDay(now + ms, hourFormat)}</b>{" "}
            <span className="tnum">({formatHours(ms)})</span>
          </>
        )}
      </span>
    </div>
  );
}
