"use client";

import { Check, LockSimple, Prohibit } from "@phosphor-icons/react";
import { Field } from "@/core/ui/fields";
import { Switch } from "@/core/ui/Switch";
import { Segmented } from "@/core/ui/Segmented";
import { ProBadge } from "@/core/ui/ProBadge";
import { useCan } from "@/core/billing/entitlements";
import { useGate } from "@/core/billing/useGate";
import { usePrefs } from "@/core/prefs";
import { THEMES } from "@/core/theme/themes";
import { BACKGROUNDS } from "@/core/theme/backgrounds";
import { FONTS } from "@/core/theme/fonts";
import { cn } from "@/core/lib/cn";
import { useFocusSettings } from "../../store/settings";
import { Group, SectionTitle } from "./SettingsDialog";

export function AppearanceSection() {
  const s = useFocusSettings((x) => x.doc);
  const set = useFocusSettings((x) => x.set);
  const prefs = usePrefs((p) => p.doc);
  const setPrefs = usePrefs((p) => p.set);
  const canThemes = useCan("themes.all");
  const canBackgrounds = useCan("backgrounds.all");
  const gate = useGate();
  const themeBg = THEMES.find((t) => t.id === s.theme)?.modes.focus.bg;

  return (
    <>
      <SectionTitle eyebrow="Appearance" title="Make it yours">
        Colours, a place to sit and a typeface. The timer page shifts with each mode either way.
      </SectionTitle>

      <Group title="Language">
        <Field label="Language" hint="Auto follows your browser.">
          <Segmented
            size="sm"
            ariaLabel="Language"
            value={prefs.language}
            onChange={(v) => setPrefs({ language: v })}
            options={[
              { value: "auto", label: "Auto" },
              { value: "en", label: "English" },
              { value: "da", label: "Dansk" },
            ]}
          />
        </Field>
      </Group>

      <Group title="Background">
        <div className="grid grid-cols-3 gap-2 py-4 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => set({ background: "none" })}
            aria-pressed={s.background === "none"}
            className={cn("group relative aspect-[4/3] overflow-hidden rounded-2xl ring-2 transition-all", s.background === "none" ? "ring-ink" : "ring-transparent hover:ring-line")}
            style={{ background: themeBg }}
          >
            <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/35 px-2.5 py-1.5 text-left text-[12px] font-medium text-white backdrop-blur">
              Theme colour
              {s.background === "none" ? <Check size={12} weight="bold" /> : <Prohibit size={12} weight="bold" className="opacity-60" />}
            </span>
          </button>
          {BACKGROUNDS.map((b) => {
            const active = s.background === b.id;
            const locked = b.pro && !canBackgrounds;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => (b.pro ? gate("backgrounds.all", () => set({ background: b.id })) : set({ background: b.id }))}
                aria-pressed={active}
                aria-label={`${b.name} background${locked ? " (Pro)" : ""}`}
                className={cn("group relative aspect-[4/3] overflow-hidden rounded-2xl ring-2 transition-all", active ? "ring-ink" : "ring-transparent hover:ring-line")}
                style={{ backgroundColor: b.color, backgroundImage: `url(${b.blur})`, backgroundSize: "cover" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.src} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/35 px-2.5 py-1.5 text-left text-[12px] font-medium text-white backdrop-blur">
                  {b.name}
                  {active ? <Check size={12} weight="bold" /> : locked ? <LockSimple size={11} weight="bold" className="opacity-80" /> : null}
                </span>
              </button>
            );
          })}
        </div>
        {s.background !== "none" && (
          <Field label="Darken" hint="More shade keeps the timer and tasks easy to read.">
            <input
              type="range"
              min={0}
              max={70}
              value={Math.round(s.backgroundDim * 100)}
              aria-label="Darken background"
              onChange={(e) => set({ backgroundDim: Number(e.target.value) / 100 })}
              className="h-1.5 w-36 cursor-pointer appearance-none rounded-full bg-ink/15 accent-[var(--c-ink)]"
            />
          </Field>
        )}
      </Group>

      <Group title="Colour theme">
        <div className="grid gap-2.5 py-4 sm:grid-cols-2">
          {THEMES.map((t) => {
            const active = s.theme === t.id;
            const locked = t.pro && !canThemes;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => (t.pro ? gate("themes.all", () => set({ theme: t.id })) : set({ theme: t.id }))}
                className={cn("group overflow-hidden rounded-[18px] text-left ring-2 transition-all", active ? "ring-ink" : "ring-transparent hover:ring-line")}
              >
                <div className="flex h-14">
                  {(["focus", "short", "long"] as const).map((m) => (
                    <div key={m} className="relative flex-1" style={{ background: t.modes[m].bg }}>
                      <span className="absolute bottom-2 left-2.5 size-2.5 rounded-full" style={{ background: t.modes[m].btn }} />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between bg-fill px-3.5 py-2.5">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {t.name} {t.pro && <ProBadge />}
                  </div>
                  {active ? <Check size={15} weight="bold" /> : locked ? <LockSimple size={13} weight="bold" className="text-ink-3" /> : null}
                </div>
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Typeface">
        <div className="grid gap-1.5 py-4">
          {FONTS.map((f) => {
            const active = prefs.font === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setPrefs({ font: f.id })}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-4 rounded-2xl px-4 py-3 text-left transition-colors",
                  active ? "bg-ink text-page" : "bg-fill hover:bg-ink/10",
                )}
                style={{ fontFamily: f.family }}
              >
                <span className="w-10 text-[26px] leading-none font-semibold tracking-[-0.03em]">Aa</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold">{f.name}</span>
                  <span className={cn("block text-[13px]", active ? "opacity-70" : "text-ink-3")}>{f.description}</span>
                </span>
                {active && <Check size={15} weight="bold" className="shrink-0" />}
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Behaviour">
        <Field label="Dim while running" hint="Deepens the background so the screen recedes.">
          <Switch label="Dim while running" checked={s.dimWhenRunning} onChange={(v) => set({ dimWhenRunning: v })} />
        </Field>
        <Field label="Other pages" hint="Insights, settings and account.">
          <Segmented
            size="sm"
            ariaLabel="Appearance"
            value={prefs.appearance}
            onChange={(v) => setPrefs({ appearance: v })}
            options={[
              { value: "system", label: "Auto" },
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
          />
        </Field>
      </Group>
    </>
  );
}
