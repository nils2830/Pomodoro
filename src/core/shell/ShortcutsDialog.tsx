"use client";

import { Dialog } from "../ui/Dialog";
import { Kbd } from "../ui/Kbd";
import { useUI } from "../ui/store";
import { useT } from "../i18n";

export const SHORTCUTS: [string[], string][] = [
  [["Space"], "Start or pause"],
  [["S"], "Skip to the next segment"],
  [["R"], "Reset the current segment"],
  [["H"], "Hide or show the timer"],
  [["F"], "Choose a timer face"],
  [["Z"], "Zen mode"],
  [["1"], "Focus"],
  [["2"], "Short break"],
  [["3"], "Long break"],
  [["N"], "New task"],
  [["+"], "Add a minute while running"],
  [["?"], "Show shortcuts"],
];

export function ShortcutsDialog() {
  const open = useUI((s) => s.shortcutsOpen);
  const set = useUI((s) => s.setShortcuts);
  const t = useT();
  return (
    <Dialog open={open} onClose={() => set(false)} title={t("Keyboard")} eyebrow={t("Shortcuts")} size="sm">
      <ul className="mt-2 divide-y divide-line">
        {SHORTCUTS.map(([keys, label]) => (
          <li key={label} className="flex items-center justify-between py-2.5 text-[14px]">
            <span className="text-ink-2">{t(label)}</span>
            <span className="flex gap-1">
              {keys.map((k) => (
                <Kbd key={k}>{k}</Kbd>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}
