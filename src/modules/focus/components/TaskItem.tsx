"use client";

import { Check, DotsSixVertical, PencilSimple } from "@phosphor-icons/react";
import { cn } from "@/core/lib/cn";
import type { Project, Task } from "../types";
import { useTasks } from "../store/data";
import { useTimer } from "../store/timer";

export function TaskItem({
  task,
  project,
  active,
  onEdit,
  dragProps,
  dropHint,
}: {
  task: Task;
  project?: Project;
  active: boolean;
  onEdit: () => void;
  dragProps: React.HTMLAttributes<HTMLLIElement> & { draggable: boolean };
  dropHint: "before" | "after" | null;
}) {
  const setActive = useTimer((s) => s.setActiveTask);
  return (
    <li
      {...dragProps}
      className={cn(
        "group relative flex cursor-pointer items-start gap-3 rounded-[18px] py-3 pr-2 pl-3 transition-colors",
        active ? "bg-ink/14" : "hover:bg-fill",
      )}
      onClick={() => setActive(active ? null : task.id)}
    >
      {dropHint && <span className={cn("absolute inset-x-3 h-0.5 rounded-full bg-ink", dropHint === "before" ? "-top-px" : "-bottom-px")} />}
      {active && <span className="absolute top-3 bottom-3 left-0 w-1 rounded-full bg-ink" />}
      <span className="mt-1 hidden cursor-grab text-ink-3 opacity-0 transition-opacity group-hover:opacity-100 sm:block" aria-hidden>
        <DotsSixVertical size={16} weight="bold" />
      </span>
      <button
        type="button"
        role="checkbox"
        aria-checked={task.done}
        aria-label={task.done ? "Mark as not done" : "Mark as done"}
        onClick={(e) => {
          e.stopPropagation();
          useTasks.getState().update(task.id, { done: !task.done });
        }}
        className={cn(
          "mt-0.5 grid size-[22px] shrink-0 place-items-center rounded-full border-2 transition-all",
          task.done ? "border-ink bg-ink text-page" : "border-ink/35 hover:border-ink",
        )}
      >
        {task.done && <Check size={12} weight="bold" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className={cn("text-[15px] leading-snug font-medium break-words", task.done && "text-ink-3 line-through decoration-ink/40")}>{task.title}</div>
        {task.note && <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-ink-2">{task.note}</p>}
        {project && (
          <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-fill px-2 py-0.5 text-[11.5px] font-medium text-ink-2">
            <span className="size-1.5 rounded-full" style={{ background: `var(--series-${project.color + 1})` }} />
            {project.name}
          </span>
        )}
      </div>
      <span className="mt-0.5 font-mono text-[13px] whitespace-nowrap text-ink-3 tabular-nums">
        <span className="text-ink">{task.act}</span>/{task.est}
      </span>
      <button
        type="button"
        aria-label={`Edit ${task.title}`}
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="-my-1 grid size-8 shrink-0 place-items-center rounded-full text-ink-3 hover:bg-fill hover:text-ink"
      >
        <PencilSimple size={16} weight="bold" />
      </button>
    </li>
  );
}
