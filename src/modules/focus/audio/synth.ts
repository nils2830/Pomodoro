"use client";

import type { AlarmId, AmbientId } from "../types";

/**
 * Every sound in Steen is synthesised with the Web Audio API:
 * no audio files to ship, license or load.
 */

let ctx: AudioContext | null = null;

function ac(): AudioContext {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Call from a user gesture so later alarms are allowed to play. */
export function unlockAudio(): void {
  try {
    ac();
  } catch {
    // Audio unsupported; stay silent.
  }
}

// ───────────────────────── Alarms ─────────────────────────

type Voice = (c: AudioContext, out: AudioNode, t: number) => number;

function env(c: AudioContext, t: number, peak: number, attack: number, decay: number): GainNode {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  return g;
}

function tone(c: AudioContext, out: AudioNode, type: OscillatorType, freq: number, t: number, peak: number, attack: number, decay: number) {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  const g = env(c, t, peak, attack, decay);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + attack + decay + 0.05);
  return o;
}

const bell: Voice = (c, out, t) => {
  const f0 = 587.33;
  const partials: [number, number][] = [
    [1, 0.5],
    [2, 0.22],
    [2.76, 0.18],
    [5.4, 0.08],
    [8.93, 0.035],
  ];
  for (const [ratio, amp] of partials) tone(c, out, "sine", f0 * ratio, t, amp, 0.004, 2.6 / Math.sqrt(ratio));
  return 1.9;
};

const digital: Voice = (c, out, t) => {
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 3200;
  lp.connect(out);
  for (let group = 0; group < 2; group++) {
    for (let i = 0; i < 4; i++) {
      const start = t + group * 0.75 + i * 0.12;
      tone(c, lp, "square", 1760, start, 0.09, 0.003, 0.07);
    }
  }
  return 1.6;
};

const chime: Voice = (c, out, t) => {
  [659.25, 783.99, 987.77, 1318.51].forEach((f, i) => {
    tone(c, out, "sine", f, t + i * 0.14, 0.28, 0.006, 1.8);
    tone(c, out, "triangle", f * 2, t + i * 0.14, 0.04, 0.004, 0.6);
  });
  return 2.2;
};

const wood: Voice = (c, out, t) => {
  [0, 0.2, 0.4].forEach((d) => {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(1150, t + d);
    o.frequency.exponentialRampToValueAtTime(720, t + d + 0.04);
    const g = env(c, t + d, 0.55, 0.002, 0.13);
    o.connect(g).connect(out);
    o.start(t + d);
    o.stop(t + d + 0.2);
  });
  return 0.9;
};

const kitchen: Voice = (c, out, t) => {
  const carrier = c.createOscillator();
  carrier.type = "sine";
  carrier.frequency.value = 2480;
  const amp = c.createGain();
  amp.gain.value = 0;
  const lfo = c.createOscillator();
  lfo.type = "square";
  lfo.frequency.value = 26;
  const depth = c.createGain();
  depth.gain.value = 0.5;
  const master = c.createGain();
  master.gain.setValueAtTime(0.0001, t);
  master.gain.exponentialRampToValueAtTime(0.16, t + 0.02);
  master.gain.setValueAtTime(0.16, t + 1.4);
  master.gain.exponentialRampToValueAtTime(0.0001, t + 1.7);
  lfo.connect(depth).connect(amp.gain);
  carrier.connect(amp).connect(master).connect(out);
  carrier.start(t);
  lfo.start(t);
  carrier.stop(t + 1.75);
  lfo.stop(t + 1.75);
  return 2;
};

const birds: Voice = (c, out, t) => {
  const pattern = [0, 0.16, 0.5, 0.62, 0.74, 1.15];
  pattern.forEach((d, i) => {
    const o = c.createOscillator();
    o.type = "sine";
    const s = t + d;
    const base = 2600 + (i % 3) * 300;
    o.frequency.setValueAtTime(base, s);
    o.frequency.exponentialRampToValueAtTime(base * 1.6, s + 0.05);
    o.frequency.exponentialRampToValueAtTime(base * 1.15, s + 0.1);
    const g = env(c, s, 0.16, 0.01, 0.1);
    o.connect(g).connect(out);
    o.start(s);
    o.stop(s + 0.16);
  });
  return 1.5;
};

export const ALARMS: { id: AlarmId; name: string; pro: boolean; voice: Voice }[] = [
  { id: "bell", name: "Bell", pro: false, voice: bell },
  { id: "digital", name: "Digital", pro: false, voice: digital },
  { id: "chime", name: "Chime", pro: true, voice: chime },
  { id: "wood", name: "Woodblock", pro: true, voice: wood },
  { id: "kitchen", name: "Kitchen", pro: true, voice: kitchen },
  { id: "birds", name: "Birdsong", pro: true, voice: birds },
];

export function playAlarm(id: AlarmId, volume: number, repeat = 1): void {
  if (volume <= 0) return;
  try {
    const c = ac();
    const voice = (ALARMS.find((a) => a.id === id) ?? ALARMS[0]).voice;
    const out = c.createGain();
    out.gain.value = volume;
    out.connect(c.destination);
    let t = c.currentTime + 0.05;
    for (let i = 0; i < Math.max(1, repeat); i++) t += voice(c, out, t) + 0.25;
  } catch {
    // ignore
  }
}

/**
 * The warm-up's "open your eyes" cue: one low, soft singing-bowl tone with a
 * slow attack, so it reaches closed eyes without startling.
 */
export function playSoftTone(volume = 0.35): void {
  if (volume <= 0) return;
  try {
    const c = ac();
    const out = c.createGain();
    out.gain.value = volume;
    out.connect(c.destination);
    const t = c.currentTime + 0.05;
    const f0 = 293.66;
    for (const [ratio, amp] of [
      [1, 0.32],
      [2.01, 0.09],
      [2.98, 0.04],
    ] as const) {
      tone(c, out, "sine", f0 * ratio, t, amp, 0.18, 3.2 / ratio);
    }
  } catch {
    // ignore
  }
}

// ───────────────────────── Ambient ─────────────────────────

const bufferCache = new Map<string, AudioBuffer>();

function noiseBuffer(c: AudioContext, color: "white" | "pink" | "brown", seconds = 4): AudioBuffer {
  const key = `${color}-${seconds}`;
  const cached = bufferCache.get(key);
  if (cached) return cached;
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  let b0 = 0,
    b1 = 0,
    b2 = 0,
    b3 = 0,
    b4 = 0,
    b5 = 0,
    b6 = 0,
    last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (color === "white") d[i] = w * 0.5;
    else if (color === "pink") {
      // Paul Kellet's refined pink noise filter.
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    } else {
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.2;
    }
  }
  // Crossfade the loop seam.
  const fade = Math.floor(c.sampleRate * 0.05);
  for (let i = 0; i < fade; i++) {
    const k = i / fade;
    d[i] = d[i] * k + d[len - fade + i] * (1 - k);
  }
  bufferCache.set(key, buf);
  return buf;
}

function tickBuffer(c: AudioContext, period: number, tock: boolean): AudioBuffer {
  const key = `tick-${period}-${tock}`;
  const cached = bufferCache.get(key);
  if (cached) return cached;
  const beats = tock ? 2 : 1;
  const len = Math.floor(c.sampleRate * period * beats);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let b = 0; b < beats; b++) {
    const start = Math.floor(b * period * c.sampleRate);
    const freq = b === 0 ? 3200 : 2500;
    const clickLen = Math.floor(c.sampleRate * 0.012);
    for (let i = 0; i < clickLen; i++) {
      const tt = i / c.sampleRate;
      const decay = Math.exp(-tt * 520);
      d[start + i] = (Math.sin(2 * Math.PI * freq * tt) * 0.6 + (Math.random() * 2 - 1) * 0.4) * decay * 0.8;
    }
  }
  bufferCache.set(key, buf);
  return buf;
}

function dropsBuffer(c: AudioContext): AudioBuffer {
  const key = "drops";
  const cached = bufferCache.get(key);
  if (cached) return cached;
  const len = Math.floor(c.sampleRate * 5);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  const drops = 140;
  for (let n = 0; n < drops; n++) {
    const start = Math.floor(Math.random() * (len - 2000));
    const amp = 0.15 + Math.random() * 0.5;
    const dl = Math.floor(c.sampleRate * (0.004 + Math.random() * 0.01));
    for (let i = 0; i < dl; i++) d[start + i] += (Math.random() * 2 - 1) * amp * Math.exp(-i / (dl / 4));
  }
  bufferCache.set(key, buf);
  return buf;
}

interface AmbientGraph {
  id: AmbientId;
  gain: GainNode;
  sources: AudioScheduledSourceNode[];
}

let ambient: AmbientGraph | null = null;

function loop(c: AudioContext, buffer: AudioBuffer): AudioBufferSourceNode {
  const s = c.createBufferSource();
  s.buffer = buffer;
  s.loop = true;
  return s;
}

function buildAmbient(c: AudioContext, id: AmbientId, out: GainNode): AudioScheduledSourceNode[] {
  switch (id) {
    case "tick-slow": {
      const s = loop(c, tickBuffer(c, 1, true));
      s.connect(out);
      return [s];
    }
    case "tick-fast": {
      const s = loop(c, tickBuffer(c, 0.5, false));
      s.connect(out);
      return [s];
    }
    case "white":
    case "pink":
    case "brown": {
      const s = loop(c, noiseBuffer(c, id));
      s.connect(out);
      return [s];
    }
    case "rain": {
      const bed = loop(c, noiseBuffer(c, "pink"));
      const hp = c.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 500;
      const lp = c.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 7000;
      const bedGain = c.createGain();
      bedGain.gain.value = 0.7;
      bed.connect(hp).connect(lp).connect(bedGain).connect(out);
      const drops = loop(c, dropsBuffer(c));
      const bp = c.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 2600;
      bp.Q.value = 0.8;
      drops.connect(bp).connect(out);
      return [bed, drops];
    }
    case "ocean": {
      const s = loop(c, noiseBuffer(c, "brown", 6));
      const lp = c.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1100;
      const swell = c.createGain();
      swell.gain.value = 0.55;
      const lfo = c.createOscillator();
      lfo.frequency.value = 0.09;
      const depth = c.createGain();
      depth.gain.value = 0.45;
      lfo.connect(depth).connect(swell.gain);
      s.connect(lp).connect(swell).connect(out);
      return [s, lfo];
    }
    default:
      return [];
  }
}

export const AMBIENTS: { id: AmbientId; name: string; pro: boolean }[] = [
  { id: "none", name: "None", pro: false },
  { id: "tick-slow", name: "Clock tick", pro: false },
  { id: "tick-fast", name: "Fast tick", pro: false },
  { id: "brown", name: "Brown noise", pro: true },
  { id: "pink", name: "Pink noise", pro: true },
  { id: "white", name: "White noise", pro: true },
  { id: "rain", name: "Rain", pro: true },
  { id: "ocean", name: "Ocean", pro: true },
];

export function playAmbient(id: AmbientId, volume: number): void {
  if (id === "none") return stopAmbient();
  try {
    const c = ac();
    if (ambient?.id === id) {
      ambient.gain.gain.setTargetAtTime(volume, c.currentTime, 0.2);
      return;
    }
    stopAmbient();
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, c.currentTime);
    gain.gain.setTargetAtTime(volume, c.currentTime, 0.4);
    gain.connect(c.destination);
    const sources = buildAmbient(c, id, gain);
    sources.forEach((s) => s.start());
    ambient = { id, gain, sources };
  } catch {
    ambient = null;
  }
}

export function stopAmbient(): void {
  if (!ambient || !ctx) return;
  const { gain, sources } = ambient;
  const t = ctx.currentTime;
  gain.gain.cancelScheduledValues(t);
  gain.gain.setTargetAtTime(0.0001, t, 0.15);
  sources.forEach((s) => {
    try {
      s.stop(t + 0.6);
    } catch {
      // already stopped
    }
  });
  ambient = null;
}

let previewTimer: number | undefined;
let previewUntil = 0;

/** Plays an ambient sound for a few seconds (settings preview). */
export function previewAmbient(id: AmbientId, volume: number): void {
  previewUntil = Date.now() + 3500;
  playAmbient(id, volume);
  window.clearTimeout(previewTimer);
  previewTimer = window.setTimeout(() => {
    previewUntil = 0;
    if (ambient?.id === id) stopAmbient();
  }, 3500);
}

/** While a preview plays, the timer engine leaves ambient sound alone. */
export function isPreviewing(): boolean {
  return Date.now() < previewUntil;
}

export function currentAmbient(): AmbientId | null {
  return ambient?.id ?? null;
}
