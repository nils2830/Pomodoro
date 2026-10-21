import type { ComponentType } from "react";
import type { FaceId } from "../../types";
import type { FaceProps } from "./types";
import { Digits } from "./Digits";
import { Ring } from "./Ring";
import { WallClock } from "./WallClock";
import { Dial } from "./Dial";
import { Sun } from "./Sun";
import { Tide } from "./Tide";
import { Dots } from "./Dots";
import { Words } from "./Words";

export interface FaceDef {
  id: FaceId;
  name: string;
  description: string;
  pro: boolean;
  /** Ticks every second (only the digits do). */
  ticker: boolean;
  /** Works for open-ended flow sessions. */
  flow: boolean;
  Component: ComponentType<FaceProps>;
}

export const FACES: FaceDef[] = [
  { id: "digits", name: "Digits", description: "The classic countdown.", pro: false, ticker: true, flow: true, Component: Digits },
  { id: "ring", name: "Ring", description: "A ring that empties. Shows when it ends.", pro: false, ticker: false, flow: false, Component: Ring },
  {
    id: "clock",
    name: "Wall clock",
    description: "The real time, with your session on the dial.",
    pro: false,
    ticker: false,
    flow: true,
    Component: WallClock,
  },
  { id: "dial", name: "Dial", description: "A shrinking wedge, like a kitchen timer.", pro: true, ticker: false, flow: false, Component: Dial },
  { id: "sun", name: "Sun arc", description: "Sunrise to sunset across the session.", pro: true, ticker: false, flow: false, Component: Sun },
  { id: "tide", name: "Tide", description: "A vessel that slowly drains.", pro: true, ticker: false, flow: false, Component: Tide },
  { id: "dots", name: "Dot grid", description: "One dot per minute. Changes once a minute.", pro: true, ticker: false, flow: false, Component: Dots },
  { id: "words", name: "Words", description: "Plain language: settling in, about halfway…", pro: true, ticker: false, flow: true, Component: Words },
];

export function getFace(id: FaceId): FaceDef {
  return FACES.find((f) => f.id === id) ?? FACES[0];
}

export type { FaceProps };
