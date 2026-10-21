import type { Entry } from "@/core/data/entries";
import type { TimerMode } from "../types";

export interface FinishedEvent {
  mode: TimerMode;
  flow: boolean;
  completed: boolean;
  entry: Entry | null;
  next: TimerMode;
}

type Listener = (e: FinishedEvent) => void;
const listeners = new Set<Listener>();

export const timerEvents = {
  on(fn: Listener): () => void {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  emit(e: FinishedEvent) {
    listeners.forEach((fn) => fn(e));
  },
};
