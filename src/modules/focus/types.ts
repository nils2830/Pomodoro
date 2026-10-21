import type { BaseRecord } from "@/core/data/record";

export type TimerMode = "focus" | "short" | "long";

export interface Activity extends BaseRecord {
  name: string;
  /** Categorical palette slot, 0-7. Assigned at creation, never by rank. */
  color: number;
  order: number;
  archived: boolean;
}

export interface Project extends BaseRecord {
  name: string;
  color: number;
  archived: boolean;
}

export interface Task extends BaseRecord {
  title: string;
  note: string;
  est: number;
  act: number;
  done: boolean;
  order: number;
  projectId: string | null;
  activityId: string | null;
}

export interface TemplateTask {
  title: string;
  note: string;
  est: number;
  projectId: string | null;
  activityId: string | null;
}

export interface Template extends BaseRecord {
  name: string;
  tasks: TemplateTask[];
}

export type FaceId = "digits" | "ring" | "clock" | "dial" | "sun" | "tide" | "dots" | "words";
export type AlarmId = "bell" | "digital" | "chime" | "wood" | "kitchen" | "birds";
export type AmbientId = "none" | "tick-slow" | "tick-fast" | "brown" | "pink" | "white" | "rain" | "ocean";

export interface FocusSettings {
  durations: Record<TimerMode, number>; // minutes
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  autoCheckTasks: boolean;
  autoSwitchTasks: boolean;
  alarm: AlarmId;
  alarmVolume: number; // 0..1
  alarmRepeat: number;
  ambient: AmbientId;
  ambientVolume: number;
  ambientInBreaks: boolean;
  face: FaceId;
  hideTimer: boolean;
  showSeconds: boolean;
  theme: string;
  /** Landscape behind the timer page, or "none" for the theme colour. */
  background: string;
  /** Extra shade over the landscape, 0..0.7. */
  backgroundDim: number;
  dimWhenRunning: boolean;
  timeInTitle: boolean;
  notifications: boolean;
  reminderMinutes: number; // 0 = off
  dailyGoalMinutes: number;
  /** When the focus warm-up runs: before a new sit-down, before every focus session, or never. */
  warmupWhen: "sitdown" | "always" | "off";
  /** Whole warm-up length, 30-180 s. */
  warmupSeconds: number;
  warmupEyesClosed: boolean;
  /** Ask for the first small step before the warm-up. */
  warmupFirstStep: boolean;
  warmupTone: boolean;
}
