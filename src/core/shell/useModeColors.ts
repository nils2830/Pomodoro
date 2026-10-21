"use client";

import { useEffect } from "react";
import { getTheme, modeVars } from "../theme/themes";
import { useTimer } from "@/modules/focus/store/timer";
import { useFocusSettings } from "@/modules/focus/store/settings";

const KEYS = [
  "--c-page",
  "--c-surface",
  "--c-raised",
  "--c-ink",
  "--c-ink-2",
  "--c-ink-3",
  "--c-line",
  "--c-fill",
  "--c-accent",
  "--c-glow",
  "--c-btn",
  "--c-btn-ink",
  "--c-btn-shadow",
];

/**
 * On the focus page the whole document takes the colours of the current
 * theme and timer mode. Applied to <html> so body, overscroll and portals match.
 */
export function useModeColors(active: boolean) {
  const mode = useTimer((s) => s.mode);
  const running = useTimer((s) => s.status === "running");
  const themeId = useFocusSettings((s) => s.doc.theme);
  const dimSetting = useFocusSettings((s) => s.doc.dimWhenRunning);
  const dim = dimSetting && running;

  useEffect(() => {
    const root = document.documentElement;
    if (!active) {
      KEYS.forEach((k) => root.style.removeProperty(k));
      root.style.removeProperty("color-scheme");
      delete root.dataset.mode;
      return;
    }
    const vars = modeVars(getTheme(themeId), mode, dim) as Record<string, string>;
    for (const k of KEYS) root.style.setProperty(k, vars[k]);
    root.style.setProperty("color-scheme", vars.colorScheme);
    root.dataset.mode = mode;
  }, [active, mode, themeId, dim]);
}
