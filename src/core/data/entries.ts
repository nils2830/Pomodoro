"use client";

import { createCollection } from "./collection";
import type { BaseRecord } from "./record";

/**
 * A timeline entry: one block of time spent on something.
 * This is the shared currency across modules. Focus writes focus and break
 * entries today; wellness and fitness modules will write their own kinds,
 * and Insights reads them all.
 */
export type EntryKind = "focus" | "break";
export type EntrySource = "timer" | "manual" | "sample";

export interface Entry extends BaseRecord {
  module: string;
  kind: EntryKind;
  /** Which timer flavour produced it (focus, short, long, flow, manual). */
  mode: string;
  startedAt: number;
  endedAt: number;
  /** Active time, pauses excluded. */
  durationMs: number;
  plannedMs: number | null;
  completed: boolean;
  pauses: number;
  activityId: string | null;
  taskId: string | null;
  taskTitle: string | null;
  projectId: string | null;
  source: EntrySource;
  note?: string;
  /** Length of the warm-up that led into this focus session, if any. */
  warmupMs?: number | null;
  /** Times the person noted they got distracted during the session; absent when not logged. */
  distractions?: number | null;
  /** Roughly how many minutes those distractions took. */
  distractedMin?: number | null;
}

export const useEntries = createCollection<Entry>("entries");
