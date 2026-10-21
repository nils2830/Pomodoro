import type { CSSProperties } from "react";

export type TimerModeKey = "focus" | "short" | "long";

interface ModeColors {
  /** Page background while in this mode. */
  bg: string;
  /** Darker background used by "dim while running". */
  deep: string;
  /** Soft light behind the timer face. */
  glow: string;
  /** Progress bar, active indicators. */
  accent: string;
  /** Primary button fill and its label colour. */
  btn: string;
  btnInk: string;
}

export interface ThemeDef {
  id: string;
  name: string;
  description: string;
  pro: boolean;
  /** Ink is the text colour on top of the mode backgrounds. */
  ink: "light" | "dark";
  modes: Record<TimerModeKey, ModeColors>;
}

const LIGHT_INK = "oklch(0.985 0.012 85)";
const DARK_INK = "oklch(0.215 0.022 50)";

/** Colour fields where the ink itself is the button. */
function bold(bg: string, deep: string, glow: string): ModeColors {
  return { bg, deep, glow, accent: LIGHT_INK, btn: LIGHT_INK, btnInk: bg };
}

export const THEMES: ThemeDef[] = [
  {
    id: "ember",
    name: "Ember",
    description: "Terracotta, sage and dusk blue.",
    pro: false,
    ink: "light",
    modes: {
      focus: bold("oklch(0.555 0.135 32)", "oklch(0.35 0.085 30)", "oklch(0.68 0.14 48)"),
      short: bold("oklch(0.555 0.075 172)", "oklch(0.34 0.05 178)", "oklch(0.7 0.08 160)"),
      long: bold("oklch(0.5 0.085 258)", "oklch(0.31 0.06 262)", "oklch(0.64 0.09 240)"),
    },
  },
  {
    id: "nocturne",
    name: "Nocturne",
    description: "Near-black with glowing accents.",
    pro: false,
    ink: "light",
    modes: {
      focus: {
        bg: "oklch(0.2 0.016 40)",
        deep: "oklch(0.15 0.01 40)",
        glow: "oklch(0.36 0.09 38)",
        accent: "oklch(0.74 0.15 45)",
        btn: "oklch(0.74 0.15 45)",
        btnInk: "oklch(0.18 0.02 40)",
      },
      short: {
        bg: "oklch(0.2 0.016 175)",
        deep: "oklch(0.15 0.01 175)",
        glow: "oklch(0.36 0.06 170)",
        accent: "oklch(0.8 0.1 168)",
        btn: "oklch(0.8 0.1 168)",
        btnInk: "oklch(0.18 0.02 175)",
      },
      long: {
        bg: "oklch(0.2 0.018 262)",
        deep: "oklch(0.15 0.012 262)",
        glow: "oklch(0.36 0.07 258)",
        accent: "oklch(0.76 0.1 255)",
        btn: "oklch(0.76 0.1 255)",
        btnInk: "oklch(0.18 0.02 262)",
      },
    },
  },
  {
    id: "paper",
    name: "Paper",
    description: "Warm light paper, ink and colour accents.",
    pro: false,
    ink: "dark",
    modes: {
      focus: {
        bg: "oklch(0.955 0.02 70)",
        deep: "oklch(0.91 0.028 65)",
        glow: "oklch(0.9 0.06 45)",
        accent: "oklch(0.6 0.16 35)",
        btn: "oklch(0.6 0.16 35)",
        btnInk: "oklch(0.985 0.01 70)",
      },
      short: {
        bg: "oklch(0.955 0.02 165)",
        deep: "oklch(0.91 0.028 165)",
        glow: "oklch(0.9 0.05 165)",
        accent: "oklch(0.55 0.09 172)",
        btn: "oklch(0.55 0.09 172)",
        btnInk: "oklch(0.985 0.01 165)",
      },
      long: {
        bg: "oklch(0.955 0.018 250)",
        deep: "oklch(0.91 0.025 250)",
        glow: "oklch(0.89 0.045 250)",
        accent: "oklch(0.52 0.11 258)",
        btn: "oklch(0.52 0.11 258)",
        btnInk: "oklch(0.985 0.01 250)",
      },
    },
  },
  {
    id: "grove",
    name: "Grove",
    description: "Forest, moss and spruce.",
    pro: true,
    ink: "light",
    modes: {
      focus: bold("oklch(0.46 0.075 152)", "oklch(0.3 0.05 155)", "oklch(0.6 0.09 140)"),
      short: bold("oklch(0.58 0.085 122)", "oklch(0.37 0.06 125)", "oklch(0.72 0.1 115)"),
      long: bold("oklch(0.42 0.05 208)", "oklch(0.28 0.035 210)", "oklch(0.56 0.06 200)"),
    },
  },
  {
    id: "velvet",
    name: "Velvet",
    description: "Wine, mauve and aubergine.",
    pro: true,
    ink: "light",
    modes: {
      focus: bold("oklch(0.43 0.11 355)", "oklch(0.29 0.075 355)", "oklch(0.58 0.13 5)"),
      short: bold("oklch(0.53 0.07 315)", "oklch(0.34 0.05 315)", "oklch(0.66 0.08 320)"),
      long: bold("oklch(0.36 0.09 288)", "oklch(0.25 0.06 288)", "oklch(0.5 0.1 290)"),
    },
  },
  {
    id: "citrus",
    name: "Citrus",
    description: "Marigold, lime sorbet and sky.",
    pro: true,
    ink: "dark",
    modes: {
      focus: {
        bg: "oklch(0.84 0.13 82)",
        deep: "oklch(0.76 0.13 75)",
        glow: "oklch(0.92 0.1 95)",
        accent: DARK_INK,
        btn: DARK_INK,
        btnInk: "oklch(0.84 0.13 82)",
      },
      short: {
        bg: "oklch(0.87 0.1 135)",
        deep: "oklch(0.79 0.1 135)",
        glow: "oklch(0.94 0.08 130)",
        accent: DARK_INK,
        btn: DARK_INK,
        btnInk: "oklch(0.87 0.1 135)",
      },
      long: {
        bg: "oklch(0.84 0.07 222)",
        deep: "oklch(0.76 0.07 225)",
        glow: "oklch(0.93 0.05 215)",
        accent: DARK_INK,
        btn: DARK_INK,
        btnInk: "oklch(0.84 0.07 222)",
      },
    },
  },
];

export function getTheme(id: string): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/**
 * CSS variables that recolour the shell for a timer mode.
 * With a photo background the ink is always light and surfaces are glass,
 * so text stays readable whatever the landscape.
 */
export function modeVars(theme: ThemeDef, mode: TimerModeKey, dim: boolean, opts: { photo?: boolean } = {}): CSSProperties {
  const m = theme.modes[mode];
  if (opts.photo) {
    const tint = theme.ink === "light" ? m.bg : m.accent;
    const mixP = (pct: number) => `color-mix(in oklab, ${LIGHT_INK} ${pct}%, transparent)`;
    return {
      // Solid, so text set in the page colour (active pills) stays readable; the photo layer paints above it.
      "--c-page": `color-mix(in oklab, ${tint} 28%, #0b0a09)`,
      "--c-surface": "rgb(12 11 10 / 0.34)",
      "--c-raised": "rgb(12 11 10 / 0.5)",
      "--c-ink": LIGHT_INK,
      "--c-ink-2": mixP(80),
      "--c-ink-3": mixP(60),
      "--c-line": mixP(20),
      "--c-fill": mixP(13),
      "--c-accent": LIGHT_INK,
      "--c-glow": "transparent",
      "--c-btn": LIGHT_INK,
      "--c-btn-ink": `color-mix(in oklab, ${tint} 80%, black)`,
      "--c-btn-shadow": "rgb(0 0 0 / 0.55)",
      "--c-tint": tint,
      colorScheme: "dark",
    } as CSSProperties;
  }
  const ink = theme.ink === "light" ? LIGHT_INK : DARK_INK;
  const mix = (pct: number) => `color-mix(in oklab, ${ink} ${pct}%, transparent)`;
  return {
    "--c-page": dim ? m.deep : m.bg,
    "--c-surface": mix(8),
    "--c-raised": mix(12),
    "--c-ink": ink,
    "--c-ink-2": mix(74),
    "--c-ink-3": mix(52),
    "--c-line": mix(18),
    "--c-fill": mix(10),
    "--c-accent": m.accent,
    "--c-glow": m.glow,
    "--c-btn": m.btn,
    "--c-btn-ink": m.btnInk,
    "--c-btn-shadow": m.deep,
    colorScheme: theme.ink === "light" ? "dark" : "light",
  } as CSSProperties;
}

/** Categorical slots for activities. Validated palette, fixed order. */
export const SERIES_COUNT = 8;
export const SERIES_NAMES = ["Blue", "Orange", "Aqua", "Yellow", "Magenta", "Green", "Violet", "Red"];
