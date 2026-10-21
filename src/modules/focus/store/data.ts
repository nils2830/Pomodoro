"use client";

import { createCollection } from "@/core/data/collection";
import type { Activity, Project, Task, Template } from "../types";

export const DEFAULT_ACTIVITY_ID = "act-study";

export const useActivities = createCollection<Activity>("focus.activities", {
  seed: () => [
    { id: "act-study", name: "Study", color: 0, order: 0, archived: false },
    { id: "act-work", name: "Work", color: 1, order: 1, archived: false },
    { id: "act-reading", name: "Reading", color: 2, order: 2, archived: false },
  ],
});

export const useTasks = createCollection<Task>("focus.tasks");
export const useProjects = createCollection<Project>("focus.projects");
export const useTemplates = createCollection<Template>("focus.templates");

/** Next free palette slot, so colours follow the entity, not its rank. */
export function nextColorSlot(used: number[]): number {
  for (let i = 0; i < 8; i++) if (!used.includes(i)) return i;
  return used.length % 8;
}
