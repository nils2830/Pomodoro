"use client";

import { useEffect, useState } from "react";
import { getBackground } from "../theme/backgrounds";
import { useTimer } from "@/modules/focus/store/timer";
import { useFocusSettings } from "@/modules/focus/store/settings";
import { usePhotoBackground } from "./useModeColors";

/**
 * The landscape behind the timer page. Paints its colour at once, then a tiny
 * blurred preview, then fades the full image in. A tint of the current mode
 * sits on top so focus and breaks still feel different.
 */
export function FocusBackdrop() {
  const bg = getBackground(usePhotoBackground());
  const dim = useFocusSettings((s) => s.doc.backgroundDim);
  const dimRunning = useFocusSettings((s) => s.doc.dimWhenRunning);
  const running = useTimer((s) => s.status === "running");
  // A cached image (preloaded by the boot script) shows at once instead of fading in over the blur.
  const [loaded, setLoaded] = useState<string | null>(() => {
    if (!bg) return null;
    const img = new Image();
    img.src = bg.src;
    return img.complete ? bg.id : null;
  });
  // From here on this component paints the background, so the boot layer must not linger after a change.
  useEffect(() => {
    document.documentElement.style.removeProperty("--boot-bg");
    document.documentElement.style.removeProperty("--boot-bg-color");
  }, []);
  if (!bg) return null;
  const shade = Math.min(0.85, dim + (dimRunning && running ? 0.2 : 0));
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden" style={{ backgroundColor: bg.color }}>
      <div className="absolute inset-0 scale-110 bg-cover bg-center blur-xl" style={{ backgroundImage: `url(${bg.blur})` }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={bg.id}
        src={bg.src}
        alt=""
        onLoad={() => setLoaded(bg.id)}
        className="absolute inset-0 size-full object-cover transition-opacity duration-1000"
        style={{ opacity: loaded === bg.id ? 1 : 0 }}
      />
      <div className="absolute inset-0 transition-[background-color] duration-700" style={{ backgroundColor: `rgb(8 7 6 / ${shade})` }} />
      <div
        className="absolute inset-0 transition-[background] duration-700"
        style={{ background: "linear-gradient(to top, color-mix(in oklab, var(--c-tint, transparent) 38%, transparent), transparent 55%)" }}
      />
    </div>
  );
}
