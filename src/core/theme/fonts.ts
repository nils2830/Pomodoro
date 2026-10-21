/** Typefaces offered in Settings → Appearance. All self-hosted. */
export interface FontDef {
  id: string;
  name: string;
  description: string;
  /** CSS font-family value placed in --font-user. */
  family: string;
}

export const FONTS: FontDef[] = [
  { id: "geologica", name: "Geologica", description: "The Steen face. Clean, with chiselled headlines.", family: '"Geologica Variable"' },
  { id: "host", name: "Host Grotesk", description: "Neutral and modern.", family: '"Host Grotesk Variable"' },
  { id: "familjen", name: "Familjen Grotesk", description: "Nordic, a little quirky.", family: '"Familjen Grotesk Variable"' },
  { id: "newsreader", name: "Newsreader", description: "A calm editorial serif.", family: '"Newsreader Variable"' },
  { id: "atkinson", name: "Atkinson Hyperlegible", description: "Designed for low vision. Easiest to read.", family: '"Atkinson Hyperlegible Next Variable"' },
];

export const DEFAULT_FONT = "geologica";

export function getFont(id: string | undefined): FontDef {
  return FONTS.find((f) => f.id === id) ?? FONTS[0];
}
