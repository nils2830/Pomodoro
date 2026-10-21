"use client";

import { createRoot } from "react-dom/client";
import { Pause, Play, SkipForward } from "@phosphor-icons/react";
import { toast } from "@/core/ui/store";
import { getTheme, modeVars } from "@/core/theme/themes";
import { useTimer } from "../store/timer";
import { useFocusSettings } from "../store/settings";
import { useFaceProps } from "../hooks";
import { MODE_LABEL } from "../labels";
import { Digits } from "./faces/Digits";
import { Hidden } from "./faces/Hidden";

interface DocumentPiP {
  window: Window | null;
  requestWindow(opts: { width: number; height: number }): Promise<Window>;
}

function MiniTimer() {
  const face = useFaceProps("mini", 500);
  const toggle = useTimer((s) => s.toggle);
  const skip = useTimer((s) => s.skip);
  const theme = useFocusSettings((s) => s.doc.theme);
  const hidden = useFocusSettings((s) => s.doc.hideTimer);
  const vars = modeVars(getTheme(theme), face.mode, false);
  const isFlow = face.flow && face.mode === "focus";
  return (
    <div style={vars} className="flex h-svh flex-col bg-page p-4 font-sans text-ink">
      <div className="flex items-center justify-between">
        <span className="eyebrow text-ink-2">{isFlow ? "Flow" : MODE_LABEL[face.mode]}</span>
        <div className="flex gap-1">
          <button type="button" onClick={toggle} aria-label="Start or pause" className="grid size-9 place-items-center rounded-full bg-ink/12">
            {face.status === "running" ? <Pause size={16} weight="fill" /> : <Play size={16} weight="fill" />}
          </button>
          {!isFlow && (
            <button type="button" onClick={skip} aria-label="Skip" className="grid size-9 place-items-center rounded-full bg-ink/12">
              <SkipForward size={16} weight="fill" />
            </button>
          )}
        </div>
      </div>
      <div className="grid flex-1 place-items-center [container-type:size]">{hidden ? <Hidden {...face} /> : <Digits {...face} />}</div>
    </div>
  );
}

/** Opens a floating always-on-top timer (Document Picture-in-Picture). */
export async function openPopout(): Promise<void> {
  const dpip = (window as unknown as { documentPictureInPicture?: DocumentPiP }).documentPictureInPicture;
  if (!dpip) {
    toast({ message: "The pop-out timer needs a Chromium browser (Chrome, Edge, Arc).", tone: "error" });
    return;
  }
  if (dpip.window) {
    dpip.window.focus();
    return;
  }
  const pip = await dpip.requestWindow({ width: 320, height: 220 });
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const style = pip.document.createElement("style");
      style.textContent = Array.from(sheet.cssRules)
        .map((r) => r.cssText)
        .join("\n");
      pip.document.head.appendChild(style);
    } catch {
      if (sheet.href) {
        const link = pip.document.createElement("link");
        link.rel = "stylesheet";
        link.href = sheet.href;
        pip.document.head.appendChild(link);
      }
    }
  }
  pip.document.title = "Steen";
  pip.document.body.style.margin = "0";
  const container = pip.document.createElement("div");
  pip.document.body.appendChild(container);
  const root = createRoot(container);
  root.render(<MiniTimer />);
  pip.addEventListener("pagehide", () => root.unmount());
}
