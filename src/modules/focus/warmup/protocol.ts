/**
 * The focus warm-up: a short steady-gaze ritual before a session.
 *
 * What the evidence supports (and the copy stays inside it):
 * - No trial has tested 30 s to 3 min of on-screen dot fixation before work.
 *   That range comes from popular advice (Huberman Lab "focus toolkit").
 * - The closest studied practice is trataka: 1-3 min gaze bouts, each
 *   followed by an eyes-closed phase. Small studies, mostly from one group,
 *   found better Stroop and Corsi scores afterwards (Raghavendra & Singh
 *   2016; Swathi et al. 2021). Talwadkar et al. 2014 built gaze up from
 *   10 s to 1-2 min with rest between bouts to spare the eyes.
 * - Single short mindfulness sessions have small, inconsistent effects on
 *   attention (Gill et al. 2020), so the app never promises a focus boost.
 * - Naming the first step (an implementation intention) has the strongest
 *   evidence for getting started (Gollwitzer & Sheeran 2006).
 * - Comfort: screen work already lowers blink rate (Rosenfield 2011), so
 *   blinking is always allowed and each bout ends with the eyes closed.
 */

export type WarmupWhen = "sitdown" | "always" | "off";
export type WarmupPhaseId = "settle" | "fixate" | "close" | "open";

export const WARMUP_PRESETS = [
  { seconds: 30, label: "30 s", name: "Quick", note: "A short reset. About 15 s on the dot." },
  { seconds: 60, label: "1 min", name: "Short", note: "About 35 s on the dot." },
  { seconds: 90, label: "90 s", name: "Standard", note: "About a minute on the dot. Recommended." },
  { seconds: 120, label: "2 min", name: "Settled", note: "About 75 s on the dot." },
  { seconds: 180, label: "3 min", name: "Full", note: "About 2 min on the dot, close to one round in the trataka studies." },
] as const;

export const WARMUP_DEFAULT_SECONDS = 90;
export const WARMUP_MIN_SECONDS = 30;
export const WARMUP_MAX_SECONDS = 180;
/** A new sit-down starts when no focus session ended within this window. */
export const SITDOWN_GAP_MS = 20 * 60_000;
/** Share of the gaze-and-close time spent with the eyes closed. */
const CLOSE_SHARE = 0.25;
const OPEN_MS = 5_000;

export interface WarmupPhase {
  id: WarmupPhaseId;
  startMs: number;
  endMs: number;
}

export interface WarmupPlan {
  totalMs: number;
  phases: WarmupPhase[];
}

export function clampWarmupSeconds(seconds: number): number {
  if (!Number.isFinite(seconds)) return WARMUP_DEFAULT_SECONDS;
  return Math.min(WARMUP_MAX_SECONDS, Math.max(WARMUP_MIN_SECONDS, Math.round(seconds)));
}

/**
 * Splits a warm-up into phases. The length is the whole ritual:
 * settle (5-10 s), the gaze, eyes closed (a quarter of what's left), open (5 s).
 */
export function planWarmup(seconds: number, eyesClosed: boolean): WarmupPlan {
  const totalMs = clampWarmupSeconds(seconds) * 1000;
  const settle = totalMs <= 45_000 ? 5_000 : 10_000;
  const rest = totalMs - settle - OPEN_MS;
  const close = eyesClosed ? Math.round((rest * CLOSE_SHARE) / 1000) * 1000 : 0;
  const fixate = rest - close;
  const lengths: [WarmupPhaseId, number][] = [
    ["settle", settle],
    ["fixate", fixate],
    ["close", close],
    ["open", OPEN_MS],
  ];
  const phases: WarmupPhase[] = [];
  let at = 0;
  for (const [id, ms] of lengths) {
    if (ms <= 0) continue;
    phases.push({ id, startMs: at, endMs: at + ms });
    at += ms;
  }
  return { totalMs, phases };
}

/** The phase at a point in the warm-up; past the end it stays on the last one. */
export function phaseAt(plan: WarmupPlan, elapsedMs: number): WarmupPhase {
  return plan.phases.find((p) => elapsedMs < p.endMs) ?? plan.phases[plan.phases.length - 1];
}

export function phaseLength(plan: WarmupPlan, id: WarmupPhaseId): number {
  const p = plan.phases.find((x) => x.id === id);
  return p ? p.endMs - p.startMs : 0;
}

/**
 * Whether starting focus now should begin with a warm-up.
 * "sitdown" warms up only when no focus session ended in the last 20 minutes,
 * so back-to-back rounds after a break go straight in.
 */
export function needsWarmup(when: WarmupWhen, lastFocusEndedAt: number | null, now: number): boolean {
  if (when === "off") return false;
  if (when === "always") return true;
  return lastFocusEndedAt == null || now - lastFocusEndedAt > SITDOWN_GAP_MS;
}

export const PHASE_COPY: Record<WarmupPhaseId, { text: string; hint: string }> = {
  settle: {
    text: "Sit back, about an arm's length from the screen.",
    hint: "Let your shoulders drop. Blink whenever you like.",
  },
  fixate: {
    text: "Rest your eyes softly on the dot.",
    hint: "Blink when you need to. When your gaze or your mind drifts, just come back.",
  },
  close: {
    text: "Close your eyes.",
    hint: "If an afterglow of the dot appears, let it rest there and fade. A soft tone will tell you when to open.",
  },
  open: {
    text: "Open your eyes. Blink a few times.",
    hint: "Glance at something far away, then begin.",
  },
};

/** Shown once during longer gazes, so the normal fading of a fixed dot isn't alarming. */
export const FIXATE_TIP = "If the edges fade or shimmer, that's normal. Stay with the dot.";
export const FIXATE_TIP_AT_MS = 15_000;

export const WARMUP_EXPLAINER =
  "Inspired by trataka, a yogic practice of steady gazing, and by focused-attention meditation. Small studies, mostly from one research group, found people did somewhat better on attention and memory tests after longer gazing sessions. No study has tested a short on-screen dot before work, so treat it as a calm settling ritual, not a proven focus boost. Naming your first step is the part with the strongest research behind it.";

export const WARMUP_SAFETY =
  "Blink whenever you like. Stop if your eyes sting or water, or if you feel dizzy or get a headache. With dry eyes, migraine with aura or photosensitive epilepsy, keep it short or turn it off.";

export const WARMUP_REFERENCES = [
  {
    citation: "Raghavendra & Singh (2016). Immediate effect of yogic visual concentration on cognitive performance. J Tradit Complement Med 6(1).",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4738033/",
    supports: "One trataka session (gaze, then eyes closed) improved Stroop scores against a control session. 30 men.",
  },
  {
    citation: "Swathi, Bhat & Saoji (2021). Effect of trataka on the performance in the Corsi-block tapping task. Front Psychol 12.",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8718544/",
    supports: "Trataka improved spatial working memory; eye exercises alone did not. 41 adults, no separate control group.",
  },
  {
    citation: "Talwadkar, Jagannathan & Raghuram (2014). Effect of trataka on cognitive functions in the elderly. Int J Yoga 7(2).",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4097909/",
    supports: "Gaze bouts built up from 10 s to 1-2 min with rest between them, the basis for the 30 s to 3 min range here.",
  },
  {
    citation: "Gill et al. (2020). Mindfulness induction and cognition: a systematic review and meta-analysis. Conscious Cogn 84.",
    url: "https://doi.org/10.1016/j.concog.2020.102991",
    supports: "Single short sessions have small, inconsistent effects on cognition. Why Steen makes no promises.",
  },
  {
    citation: "Gollwitzer & Sheeran (2006). Implementation intentions and goal achievement: a meta-analysis. Adv Exp Soc Psychol 38.",
    url: "https://doi.org/10.1016/S0065-2601(06)38002-1",
    supports: "If-then plans reliably help people get started. The basis for the first-step prompt.",
  },
  {
    citation: "Rosenfield (2011). Computer vision syndrome: a review of ocular causes and potential treatments. Ophthalmic Physiol Opt 31(5).",
    url: "https://doi.org/10.1111/j.1475-1313.2011.00834.x",
    supports: "Screen work lowers blink rate and dries the eyes, so blinking is encouraged and the gaze ends with the eyes closed.",
  },
] as const;

/** The short "why this works" shown on the first-step screen. Plain claims, each with its source. */
export const WARMUP_EVIDENCE = [
  {
    title: "Naming your first step",
    body: "Deciding exactly what you'll do first (\u201cwhen the timer starts, I'll\u2026\u201d) is one of the best-supported ways to get started. A review of 94 studies found a medium-to-large effect on following through.",
    source: "Gollwitzer & Sheeran, 2006",
    url: "https://doi.org/10.1016/S0065-2601(06)38002-1",
  },
  {
    title: "Resting your eyes on one point",
    body: "Borrowed from trataka, a steady-gaze practice. In small studies, people did better on attention and memory tests after a session. It hasn't been tested as a short warm-up before work, so treat it as a calm way in, not a guarantee.",
    source: "Raghavendra & Singh, 2016; Swathi et al., 2021",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8718544/",
  },
  {
    title: "The same ritual every time",
    body: "A fixed routine before a task can take the edge off nerves and help performance. Doing the warm-up the same way each sit-down is part of the point.",
    source: "Brooks et al., 2016",
    url: "https://doi.org/10.1016/j.obhdp.2016.07.004",
  },
  {
    title: "Kind to your eyes",
    body: "Screens make us blink less, so you can blink whenever you like, and the warm-up ends with a short rest with your eyes closed.",
    source: "Rosenfield, 2011",
    url: "https://doi.org/10.1111/j.1475-1313.2011.00834.x",
  },
] as const;
