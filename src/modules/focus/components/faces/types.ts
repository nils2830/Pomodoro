import type { HourFormat } from "@/core/lib/time";
import type { TimerMode } from "../../types";
import type { TimerStatus } from "../../engine/logic";

export interface FaceProps {
  mode: TimerMode;
  flow: boolean;
  status: TimerStatus;
  now: number;
  plannedMs: number;
  elapsedMs: number;
  remainingMs: number;
  /** 0..1 for countdowns, 0 for flow. */
  progress: number;
  startedAt: number | null;
  endsAt: number | null;
  hourFormat: HourFormat;
  showSeconds: boolean;
  size: "stage" | "zen" | "mini";
}
