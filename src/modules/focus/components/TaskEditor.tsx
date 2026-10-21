"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash } from "@phosphor-icons/react";
import { Button } from "@/core/ui/Button";
import { NumberField, Select } from "@/core/ui/fields";
import { ProBadge } from "@/core/ui/ProBadge";
import { useCan } from "@/core/billing/entitlements";
import { useUI } from "@/core/ui/store";
import type { Task } from "../types";
import { useTasks } from "../store/data";
import { useTimer } from "../store/timer";
import { useActivityList, useProjectList, useTaskList } from "../hooks";

export function TaskEditor({ task, onDone }: { task?: Task; onDone: () => void }) {
  const tasks = useTaskList();
  const activities = useActivityList();
  const projects = useProjectList();
  const canProjects = useCan("projects");
  const openUpgrade = useUI((s) => s.openUpgrade);
  const defaultActivity = useTimer((s) => s.activityId);

  const [title, setTitle] = useState(task?.title ?? "");
  const [est, setEst] = useState(task?.est ?? 1);
  const [act, setAct] = useState(task?.act ?? 0);
  const [note, setNote] = useState(task?.note ?? "");
  const [showNote, setShowNote] = useState(Boolean(task?.note));
  const [activityId, setActivityId] = useState<string | null>(task ? task.activityId : defaultActivity);
  const [projectId, setProjectId] = useState<string | null>(task?.projectId ?? null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => input.current?.focus(), []);

  const save = () => {
    const clean = title.trim();
    if (!clean) return;
    const data = { title: clean, est, note: note.trim(), activityId, projectId };
    if (task) useTasks.getState().update(task.id, { ...data, act });
    else {
      const order = tasks.reduce((m, t) => Math.max(m, t.order), 0) + 1;
      const created = useTasks.getState().create({ ...data, act: 0, done: false, order });
      if (!useTimer.getState().activeTaskId) useTimer.getState().setActiveTask(created.id);
    }
    onDone();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      onKeyDown={(e) => e.key === "Escape" && onDone()}
      className="neutral animate-rise overflow-hidden rounded-[22px] bg-raised text-ink shadow-[0_20px_50px_-20px_rgb(0_0_0/0.45)]"
    >
      <div className="space-y-5 p-5">
        <input
          ref={input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What are you working on?"
          aria-label="Task title"
          className="display w-full bg-transparent text-[22px] leading-tight outline-none placeholder:text-ink-3/70"
        />

        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <div>
            <div className="eyebrow mb-2 text-ink-3">{task ? "Done / estimated" : "Est. sessions"}</div>
            <div className="flex items-center gap-2">
              {task && (
                <>
                  <NumberField label="Completed sessions" value={act} onChange={setAct} min={0} max={99} />
                  <span className="text-ink-3">/</span>
                </>
              )}
              <NumberField label="Estimated sessions" value={est} onChange={setEst} min={1} max={99} />
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="eyebrow mb-2 block text-ink-3">Activity</span>
            <Select value={activityId ?? ""} onChange={(e) => setActivityId(e.target.value || null)} wrapperClassName="w-full">
              <option value="">Use current</option>
              {activities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="eyebrow mb-2 flex items-center gap-1.5 text-ink-3">Project {!canProjects && <ProBadge />}</span>
            {canProjects ? (
              <Select value={projectId ?? ""} onChange={(e) => setProjectId(e.target.value || null)} wrapperClassName="w-full">
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            ) : (
              <button
                type="button"
                onClick={() => openUpgrade("projects")}
                className="h-10 w-full rounded-full bg-fill px-4 text-left text-sm font-medium text-ink-3 hover:bg-ink/10"
              >
                Group by project
              </button>
            )}
          </label>
        </div>

        {showNote ? (
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Notes, links, the next small step…"
            rows={3}
            autoFocus={!task?.note}
            className="w-full resize-none rounded-2xl bg-fill px-4 py-3 text-[14px] leading-relaxed outline-none placeholder:text-ink-3"
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowNote(true)}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-3 underline-offset-4 hover:text-ink hover:underline"
          >
            <Plus size={13} weight="bold" /> Add note
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 bg-fill px-4 py-3">
        {task && (
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash size={15} weight="bold" />}
            onClick={() => {
              useTasks.getState().remove(task.id);
              if (useTimer.getState().activeTaskId === task.id) useTimer.getState().setActiveTask(null);
              onDone();
            }}
          >
            Delete
          </Button>
        )}
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" size="sm" onClick={onDone}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={!title.trim()} className="px-5">
            Save
          </Button>
        </div>
      </div>
    </form>
  );
}
