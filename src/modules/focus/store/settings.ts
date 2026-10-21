"use client";

import { createDocument } from "@/core/data/document";
import type { FocusSettings } from "../types";

export const DEFAULT_FOCUS_SETTINGS: FocusSettings = {
  durations: { focus: 25, short: 5, long: 15 },
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  autoCheckTasks: false,
  autoSwitchTasks: true,
  alarm: "bell",
  alarmVolume: 0.6,
  alarmRepeat: 1,
  ambient: "none",
  ambientVolume: 0.35,
  ambientInBreaks: false,
  face: "digits",
  hideTimer: false,
  showSeconds: true,
  theme: "ember",
  dimWhenRunning: false,
  timeInTitle: true,
  notifications: true,
  reminderMinutes: 0,
  dailyGoalMinutes: 120,
};

export const useFocusSettings = createDocument<FocusSettings>("focus.settings", DEFAULT_FOCUS_SETTINGS);
