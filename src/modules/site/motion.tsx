"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Lenis from "lenis";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { cn } from "@/core/lib/cn";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Buttery scrolling for marketing pages. Off when the visitor prefers reduced motion. */
export function SmoothScroll() {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true });
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const glide = (el: HTMLElement) => lenis.scrollTo(el, { offset: -88, duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
    // Links to a section of this page ("#faces" or "/welcome#faces") glide there.
    // Capture phase, so it runs before the router jumps to the anchor.
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest?.('a[href*="#"]') as HTMLAnchorElement | null;
      if (!a) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname || !url.hash) return;
      const el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      history.replaceState(null, "", url.hash);
      glide(el);
    };
    document.addEventListener("click", onClick, true);
    // Arriving from another page with a #section: start at the top and glide down.
    let arrival = 0;
    if (window.location.hash) {
      const el = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      if (el) arrival = window.setTimeout(() => glide(el), 350);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(arrival);
      document.removeEventListener("click", onClick, true);
      lenis.destroy();
    };
  }, [reduce]);
  return null;
}

/** Fades and lifts its children into place once they scroll into view. */
export function Reveal({ children, delay = 0, y = 28, className, as = "div" }: { children: ReactNode; delay?: number; y?: number; className?: string; as?: "div" | "section" | "li" }) {
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 1.05, delay, ease: EASE }}
    >
      {children}
    </Comp>
  );
}

/** Headline that rises in word by word. */
export function WordReveal({ text, className, delay = 0, stagger = 0.075 }: { text: string; className?: string; delay?: number; stagger?: number }) {
  const words = text.split(" ");
  return (
    <span className={cn("inline", className)} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: "105%", opacity: 0, filter: "blur(8px)" }}
            animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.1, delay: delay + i * stagger, ease: EASE }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/** Scroll progress of an element through the viewport, 0 → 1. */
export function useSectionProgress<T extends HTMLElement>(offset: ["start end" | "start start" | "end start" | "end end" | "center center", "start end" | "start start" | "end start" | "end end" | "center center"] = ["start end", "end start"]) {
  const ref = useRef<T>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset });
  return [ref, scrollYProgress] as const;
}

/** Moves children vertically as the page scrolls past (subtle depth). */
export function Parallax({ children, speed = 0.12, className }: { children: ReactNode; speed?: number; className?: string }) {
  const [ref, progress] = useSectionProgress<HTMLDivElement>();
  const reduce = useReducedMotion();
  const y = useTransform(progress, [0, 1], [`${speed * 100}%`, `${-speed * 100}%`]);
  return (
    <div ref={ref} className={className}>
      <motion.div style={reduce ? undefined : { y }} className="h-full w-full">
        {children}
      </motion.div>
    </div>
  );
}

export type { MotionValue };
export { EASE };
