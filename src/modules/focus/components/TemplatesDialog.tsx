"use client";

import { useState } from "react";
import { Trash, DownloadSimple } from "@phosphor-icons/react";
import { Dialog } from "@/core/ui/Dialog";
import { Button } from "@/core/ui/Button";
import { TextInput } from "@/core/ui/fields";
import { toast } from "@/core/ui/store";
import { useT } from "@/core/i18n";
import { useTasks, useTemplates } from "../store/data";
import { useTaskList, useTemplateList } from "../hooks";

export function TemplatesDialog({ open, onClose, mode }: { open: boolean; onClose: () => void; mode: "save" | "load" }) {
  const tasks = useTaskList();
  const templates = useTemplateList();
  const [name, setName] = useState("");
  const tr = useT();

  const save = () => {
    const clean = name.trim();
    if (!clean || tasks.length === 0) return;
    useTemplates.getState().create({
      name: clean,
      tasks: tasks.map((t) => ({ title: t.title, note: t.note, est: t.est, projectId: t.projectId, activityId: t.activityId })),
    });
    toast({ message: tr("Saved “{name}” with {count} tasks.", { name: clean, count: tasks.length }), tone: "success" });
    setName("");
    onClose();
  };

  const load = (id: string) => {
    const tpl = useTemplates.getState().items[id];
    if (!tpl) return;
    let order = tasks.reduce((m, t) => Math.max(m, t.order), 0);
    useTasks.getState().createMany(tpl.tasks.map((t) => ({ ...t, act: 0, done: false, order: ++order })));
    toast({ message: tr("Added {count} tasks from “{name}”.", { count: tpl.tasks.length, name: tpl.name }), tone: "success" });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} eyebrow={tr("Templates")} title={mode === "save" ? tr("Save as template") : tr("Add from template")} size="sm">
      {mode === "save" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="mt-2 space-y-4"
        >
          <p className="text-[14px] text-ink-2">
            {tr("Saves the {count} tasks in your list, with estimates and notes, so you can load them on another day.", { count: tasks.length })}
          </p>
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={tr("e.g. Exam week, Monday routine")}
            autoFocus
            aria-label={tr("Template name")}
          />
          <div className="flex justify-end">
            <Button variant="primary" type="submit" disabled={!name.trim() || tasks.length === 0}>
              {tr("Save template")}
            </Button>
          </div>
        </form>
      ) : templates.length === 0 ? (
        <p className="mt-2 text-[14px] text-ink-2">{tr("No templates yet. Build a task list, then use “Save as template” from the tasks menu.")}</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {templates.map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{t.name}</div>
                <div className="text-[13px] text-ink-3">
                  {tr("{tasks} tasks · {sessions} sessions", { tasks: t.tasks.length, sessions: t.tasks.reduce((s, x) => s + x.est, 0) })}
                </div>
              </div>
              <Button size="sm" variant="soft" icon={<DownloadSimple size={14} weight="bold" />} onClick={() => load(t.id)}>
                {tr("Add")}
              </Button>
              <button
                type="button"
                aria-label={tr("Delete {name}", { name: t.name })}
                onClick={() => useTemplates.getState().remove(t.id)}
                className="grid size-8 place-items-center rounded-full text-ink-3 hover:bg-fill hover:text-bad"
              >
                <Trash size={15} weight="bold" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
