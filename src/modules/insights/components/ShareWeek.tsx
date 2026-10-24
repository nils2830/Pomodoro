"use client";

import { useEffect, useState } from "react";
import { DownloadSimple, ShareNetwork } from "@phosphor-icons/react";
import { Button } from "@/core/ui/Button";
import { Dialog } from "@/core/ui/Dialog";
import { useEntries, type Entry } from "@/core/data/entries";
import { getBackground } from "@/core/theme/backgrounds";
import { usePhotoBackground } from "@/core/shell/useModeColors";
import { formatDuration, HOUR, MINUTE } from "@/core/lib/time";
import { localeTag, useLocale, useT } from "@/core/i18n";

const DAY = 24 * HOUR;

export interface WeekStats {
  days: { date: Date; ms: number }[];
  totalMs: number;
  sessions: number;
  activeDays: number;
  longestMs: number;
  best: { date: Date; ms: number } | null;
  distractionsPerSession: number | null;
}

/** The last seven calendar days, today included. */
export function weekStats(entries: Entry[], now = Date.now()): WeekStats {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const start = today.getTime() - 6 * DAY;
  const focus = entries.filter((e) => e.mode === "focus" && !e.deletedAt && e.startedAt >= start && e.startedAt <= now);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start + i * DAY + HOUR * 12); // midday dodges DST edges
    date.setHours(0, 0, 0, 0);
    const from = date.getTime();
    const ms = focus.filter((e) => e.startedAt >= from && e.startedAt < from + DAY).reduce((n, e) => n + e.durationMs, 0);
    return { date, ms };
  });
  const logged = focus.filter((e) => typeof e.distractions === "number");
  const best = days.reduce<WeekStats["best"]>((b, d) => (d.ms > 0 && (!b || d.ms > b.ms) ? d : b), null);
  return {
    days,
    totalMs: days.reduce((n, d) => n + d.ms, 0),
    sessions: focus.length,
    activeDays: days.filter((d) => d.ms >= MINUTE).length,
    longestMs: focus.reduce((n, e) => Math.max(n, e.durationMs), 0),
    best,
    distractionsPerSession: logged.length >= 3 ? logged.reduce((n, e) => n + (e.distractions ?? 0), 0) / logged.length : null,
  };
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Draws a 1080 × 1350 card (a portrait post) and returns it as a PNG. */
async function renderCard(s: WeekStats, photo: string | null, t: (k: string, v?: Record<string, string | number>) => string, tag: string): Promise<Blob> {
  const W = 1080;
  const H = 1350;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const family = getComputedStyle(document.body).fontFamily;
  await document.fonts?.ready;
  const font = (weight: number, size: number) => `${weight} ${size}px ${family}`;

  // Backdrop: their landscape if they use one, otherwise warm night.
  const img = photo ? await loadImage(photo) : null;
  if (img) {
    const scale = Math.max(W / img.width, H / img.height);
    ctx.drawImage(img, (W - img.width * scale) / 2, (H - img.height * scale) / 2, img.width * scale, img.height * scale);
    ctx.fillStyle = "rgba(10, 9, 8, 0.5)";
    ctx.fillRect(0, 0, W, H);
  } else {
    const g = ctx.createRadialGradient(W * 0.75, H * 0.15, 40, W * 0.5, H * 0.5, H);
    g.addColorStop(0, "#3a2c20");
    g.addColorStop(1, "#100f0d");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  const shade = ctx.createLinearGradient(0, H * 0.45, 0, H);
  shade.addColorStop(0, "rgba(8, 7, 6, 0)");
  shade.addColorStop(1, "rgba(8, 7, 6, 0.65)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);

  const white = (a: number) => `rgba(255, 252, 246, ${a})`;
  const X = 90;
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = white(1);
  ctx.font = font(700, 46);
  ctx.fillText("steen", X, 130);
  const from = s.days[0].date.toLocaleDateString(tag, { day: "numeric", month: "short" });
  const to = s.days[6].date.toLocaleDateString(tag, { day: "numeric", month: "short" });
  ctx.font = font(500, 30);
  ctx.fillStyle = white(0.7);
  ctx.textAlign = "right";
  ctx.fillText(`${from} – ${to}`, W - X, 128);
  ctx.textAlign = "left";

  ctx.font = font(600, 30);
  ctx.fillStyle = white(0.65);
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "4px";
  ctx.fillText(t("My week in focus").toUpperCase(), X, 300);
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px";

  ctx.fillStyle = white(1);
  ctx.font = font(700, 190);
  ctx.fillText(formatDuration(s.totalMs), X - 8, 480);
  ctx.font = font(400, 38);
  ctx.fillStyle = white(0.78);
  ctx.fillText(t("{sessions} sessions on {days} of 7 days", { sessions: s.sessions, days: s.activeDays }), X, 555);

  // Seven bars, the best day brightest.
  const top = 650;
  const bottom = 980;
  const gap = 22;
  const bw = (W - X * 2 - gap * 6) / 7;
  const max = Math.max(...s.days.map((d) => d.ms), 1);
  s.days.forEach((d, i) => {
    const h = Math.max(10, ((bottom - top) * d.ms) / max);
    const x = X + i * (bw + gap);
    ctx.fillStyle = d === s.best ? white(1) : white(d.ms ? 0.45 : 0.14);
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, bottom - h, bw, h, 14);
    else ctx.rect(x, bottom - h, bw, h);
    ctx.fill();
    ctx.fillStyle = white(d === s.best ? 0.95 : 0.55);
    ctx.font = font(500, 28);
    ctx.textAlign = "center";
    ctx.fillText(d.date.toLocaleDateString(tag, { weekday: "short" }).replace(".", ""), x + bw / 2, bottom + 48);
    ctx.textAlign = "left";
  });

  const facts: [string, string][] = [
    [t("Longest session"), s.longestMs ? formatDuration(s.longestMs) : "–"],
    [t("Best day"), s.best ? s.best.date.toLocaleDateString(tag, { weekday: "long" }) : "–"],
    s.distractionsPerSession !== null
      ? [t("Distractions per session"), s.distractionsPerSession.toFixed(1)]
      : [t("Per focus day"), s.activeDays ? formatDuration(s.totalMs / s.activeDays) : "–"],
  ];
  const colW = (W - X * 2) / 3;
  facts.forEach(([label, value], i) => {
    const x = X + i * colW;
    ctx.fillStyle = white(0.6);
    ctx.font = font(500, 26);
    ctx.fillText(label, x, 1120);
    ctx.fillStyle = white(1);
    ctx.font = font(650, 46);
    ctx.fillText(value.charAt(0).toUpperCase() + value.slice(1), x, 1178);
  });

  ctx.fillStyle = white(0.18);
  ctx.fillRect(X, 1225, W - X * 2, 2);
  ctx.fillStyle = white(0.95);
  ctx.font = font(650, 32);
  ctx.fillText("steen.fit", X, 1285);
  ctx.textAlign = "right";
  ctx.fillStyle = white(0.6);
  ctx.font = font(400, 28);
  ctx.fillText(t("A free focus timer"), W - X, 1285);

  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't draw the image."))), "image/png"));
}

/** "Share my week": a ready-made image of the last seven days for stories and chats. */
export function ShareWeek() {
  const t = useT();
  const locale = useLocale();
  const entries = useEntries((s) => s.items);
  const photoId = usePhotoBackground();
  const [open, setOpen] = useState(false);
  const [card, setCard] = useState<{ blob: Blob; url: string } | null>(null);
  const [empty, setEmpty] = useState(false);

  useEffect(() => () => (card ? URL.revokeObjectURL(card.url) : undefined), [card]);

  const start = async () => {
    setOpen(true);
    setCard(null);
    const stats = weekStats(Object.values(entries));
    setEmpty(stats.totalMs < MINUTE);
    if (stats.totalMs < MINUTE) return;
    const blob = await renderCard(stats, getBackground(photoId)?.src ?? null, t, localeTag(locale));
    setCard({ blob, url: URL.createObjectURL(blob) });
  };

  const file = card ? new File([card.blob], "steen-week.png", { type: "image/png" }) : null;
  const canShare = typeof navigator !== "undefined" && !!file && !!navigator.canShare?.({ files: [file] });
  const share = async () => {
    if (!file) return;
    try {
      await navigator.share({ files: [file], text: t("My week in focus, with Steen: https://www.steen.fit") });
    } catch {
      // Closing the share sheet isn't an error.
    }
  };

  return (
    <>
      <Button variant="outline" icon={<ShareNetwork size={15} weight="bold" />} onClick={start}>
        {t("Share week")}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} eyebrow={t("Last 7 days")} title={t("Your week, ready to share")} size="md">
        {empty ? (
          <p className="py-4 text-[15px] text-ink-2">{t("No focus sessions in the last 7 days yet. Finish one and come back.")}</p>
        ) : (
          <>
            <div className="grid aspect-[4/5] w-full place-items-center overflow-hidden rounded-[20px] bg-fill">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {card ? <img src={card.url} alt={t("Your week in focus")} className="size-full object-cover" /> : <span className="text-[14px] text-ink-3">{t("Drawing…")}</span>}
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              {card && (
                <a
                  href={card.url}
                  download="steen-week.png"
                  className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line px-4 text-[14px] font-semibold hover:bg-fill"
                >
                  <DownloadSimple size={15} weight="bold" /> {t("Download")}
                </a>
              )}
              {canShare && (
                <Button icon={<ShareNetwork size={15} weight="bold" />} onClick={share}>
                  {t("Share")}
                </Button>
              )}
            </div>
          </>
        )}
      </Dialog>
    </>
  );
}
