"use client";

import { useState } from "react";
import { Archive, Plus, Trash } from "@phosphor-icons/react";
import { Button } from "@/core/ui/Button";
import { TextInput } from "@/core/ui/fields";
import { ProBadge } from "@/core/ui/ProBadge";
import { Popover } from "@/core/ui/Popover";
import { confirmAction } from "@/core/ui/store";
import { useCan, useLimits } from "@/core/billing/entitlements";
import { useGate } from "@/core/billing/useGate";
import { SERIES_NAMES } from "@/core/theme/themes";
import { cn } from "@/core/lib/cn";
import { useT } from "@/core/i18n";
import { useActivities, useProjects, nextColorSlot } from "../../store/data";
import { useTimer } from "../../store/timer";
import { useActivityList, useProjectList } from "../../hooks";
import { Group, SectionTitle } from "./SettingsDialog";

function ColorPicker({ value, onChange }: { value: number; onChange: (c: number) => void }) {
  const t = useT();
  return (
    <Popover
      align="start"
      panelClassName="min-w-0 p-2"
      trigger={(props) => (
        <button
          type="button"
          {...props}
          aria-label={t("Colour: {name}", { name: t(SERIES_NAMES[value]) })}
          className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-fill"
        >
          <span className="size-4 rounded-full" style={{ background: `var(--series-${value + 1})` }} />
        </button>
      )}
    >
      {(close) => (
        <div className="grid grid-cols-4 gap-1">
          {SERIES_NAMES.map((name, i) => (
            <button
              key={name}
              type="button"
              aria-label={t(name)}
              title={t(name)}
              onClick={() => {
                onChange(i);
                close();
              }}
              className={cn("grid size-9 place-items-center rounded-full hover:bg-fill", i === value && "bg-fill")}
            >
              <span className="size-5 rounded-full" style={{ background: `var(--series-${i + 1})` }} />
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}

function NameInput({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  const t = useT();
  const [draft, setDraft] = useState(value);
  return (
    <input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => (draft.trim() ? draft.trim() !== value && onCommit(draft.trim()) : setDraft(value))}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      aria-label={t("Name")}
      className="h-9 min-w-0 flex-1 rounded-xl bg-transparent px-2 text-[15px] font-medium outline-none hover:bg-fill focus:bg-fill"
    />
  );
}

export function ActivitiesSection() {
  const t = useT();
  const activities = useActivityList();
  const projects = useProjectList();
  const limits = useLimits();
  const canProjects = useCan("projects");
  const gate = useGate();
  const [name, setName] = useState("");
  const [projectName, setProjectName] = useState("");

  const addActivity = () => {
    const clean = name.trim();
    if (!clean) return;
    const add = () => {
      useActivities.getState().create({
        name: clean,
        color: nextColorSlot(activities.map((a) => a.color)),
        order: activities.length,
        archived: false,
      });
      setName("");
    };
    if (activities.length >= limits.activities) gate("activities.unlimited", add);
    else add();
  };

  const addProject = () => {
    const clean = projectName.trim();
    if (!clean) return;
    gate("projects", () => {
      useProjects.getState().create({ name: clean, color: nextColorSlot(projects.map((p) => p.color)), archived: false });
      setProjectName("");
    });
  };

  return (
    <>
      <SectionTitle eyebrow={t("Activities")} title={t("What you spend time on")}>
        {t("Every focus session is logged to an activity. Insights uses them to show how often you sit down for each kind of work.")}
        {Number.isFinite(limits.activities) && ` ${t("Free includes {n}.", { n: limits.activities })}`}
      </SectionTitle>
      <Group>
        {activities.map((a) => (
          <div key={a.id} className="flex items-center gap-2 py-2">
            <ColorPicker value={a.color} onChange={(c) => useActivities.getState().update(a.id, { color: c })} />
            <NameInput value={a.name} onCommit={(v) => useActivities.getState().update(a.id, { name: v })} />
            <button
              type="button"
              aria-label={t("Archive {name}", { name: a.name })}
              title={t("Archive (keeps its history)")}
              disabled={activities.length <= 1}
              onClick={async () => {
                const ok = await confirmAction({
                  title: t("Archive “{name}”?", { name: a.name }),
                  body: t("It disappears from pickers, but its logged time stays in Insights."),
                  confirmLabel: t("Archive"),
                });
                if (!ok) return;
                useActivities.getState().update(a.id, { archived: true });
                if (useTimer.getState().activityId === a.id) useTimer.getState().setActivity(activities.find((x) => x.id !== a.id)!.id);
              }}
              className="grid size-9 place-items-center rounded-full text-ink-3 hover:bg-fill hover:text-ink disabled:opacity-30"
            >
              <Archive size={16} weight="bold" />
            </button>
          </div>
        ))}
        <form
          className="flex items-center gap-2 py-3"
          onSubmit={(e) => {
            e.preventDefault();
            addActivity();
          }}
        >
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("New activity, e.g. Coding, Language, Music")}
            className="h-10"
            aria-label={t("New activity")}
          />
          <Button type="submit" variant="primary" size="md" icon={<Plus size={14} weight="bold" />} disabled={!name.trim()}>
            {t("Add")}
          </Button>
        </form>
      </Group>

      <div className="mt-10">
        <SectionTitle eyebrow={t("Projects")} title={t("Group tasks")}>
          {t("Attach tasks to a project, like a course or a deadline.")} {!canProjects && <ProBadge className="ml-1 align-middle" />}
        </SectionTitle>
        <Group>
          {projects.map((p) => (
            <div key={p.id} className="flex items-center gap-2 py-2">
              <ColorPicker value={p.color} onChange={(c) => useProjects.getState().update(p.id, { color: c })} />
              <NameInput value={p.name} onCommit={(v) => useProjects.getState().update(p.id, { name: v })} />
              <button
                type="button"
                aria-label={t("Delete {name}", { name: p.name })}
                onClick={() => useProjects.getState().remove(p.id)}
                className="grid size-9 place-items-center rounded-full text-ink-3 hover:bg-fill hover:text-bad"
              >
                <Trash size={16} weight="bold" />
              </button>
            </div>
          ))}
          <form
            className="flex items-center gap-2 py-3"
            onSubmit={(e) => {
              e.preventDefault();
              addProject();
            }}
          >
            <TextInput
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder={t("New project, e.g. Thesis")}
              className="h-10"
              aria-label={t("New project")}
            />
            <Button type="submit" variant="primary" icon={<Plus size={14} weight="bold" />} disabled={!projectName.trim()}>
              {t("Add")}
            </Button>
          </form>
        </Group>
      </div>
    </>
  );
}
