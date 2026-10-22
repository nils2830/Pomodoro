"use client";

import { Check, LockSimple, Prohibit } from "@phosphor-icons/react";
import { Field } from "@/core/ui/fields";
import { Switch } from "@/core/ui/Switch";
import { Segmented } from "@/core/ui/Segmented";
import { Button } from "@/core/ui/Button";
import { useUI } from "@/core/ui/store";
import { useTour } from "@/core/shell/Tour";
import { ProBadge } from "@/core/ui/ProBadge";
import { useCan } from "@/core/billing/entitlements";
import { useGate } from "@/core/billing/useGate";
import { usePrefs } from "@/core/prefs";
import { THEMES } from "@/core/theme/themes";
import { BACKGROUNDS } from "@/core/theme/backgrounds";
import { FONTS } from "@/core/theme/fonts";
import { cn } from "@/core/lib/cn";
import { useT } from "@/core/i18n";
import { useFocusSettings } from "../../store/settings";
import { Group, SectionTitle } from "./SettingsDialog";

export function AppearanceSection() {
  const t = useT();
  const s = useFocusSettings((x) => x.doc);
  const set = useFocusSettings((x) => x.set);
  const prefs = usePrefs((p) => p.doc);
  const setPrefs = usePrefs((p) => p.set);
  const canThemes = useCan("themes.all");
  const canBackgrounds = useCan("backgrounds.all");
  const gate = useGate();
  const themeBg = THEMES.find((x) => x.id === s.theme)?.modes.focus.bg;

  return (
    <>
      <SectionTitle eyebrow={t("Appearance")} title={t("Make it yours")}>
        {t("Colours, a place to sit and a typeface. The timer page shifts with each mode either way.")}
      </SectionTitle>

      <Group title={t("Language")}>
        <Field label={t("Language")} hint={t("Auto follows your browser.")}>
          <Segmented
            size="sm"
            ariaLabel={t("Language")}
            value={prefs.language}
            onChange={(v) => setPrefs({ language: v })}
            options={[
              { value: "auto", label: t("Auto") },
              { value: "en", label: "English" },
              { value: "da", label: "Dansk" },
            ]}
          />
        </Field>
      </Group>

      <Group title={t("Background")}>
        <div className="grid grid-cols-3 gap-2 py-4 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => set({ background: "none" })}
            aria-pressed={s.background === "none"}
            className={cn(
              "group relative aspect-[4/3] overflow-hidden rounded-2xl ring-2 transition-all",
              s.background === "none" ? "ring-ink" : "ring-transparent hover:ring-line",
            )}
            style={{ background: themeBg }}
          >
            <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/35 px-2.5 py-1.5 text-left text-[12px] font-medium text-white backdrop-blur">
              {t("Theme colour")}
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
                aria-label={locked ? t("{name} background (Pro)", { name: t(b.name) }) : t("{name} background", { name: t(b.name) })}
                className={cn(
                  "group relative aspect-[4/3] overflow-hidden rounded-2xl ring-2 transition-all",
                  active ? "ring-ink" : "ring-transparent hover:ring-line",
                )}
                style={{ backgroundColor: b.color, backgroundImage: `url(${b.blur})`, backgroundSize: "cover" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.src}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/35 px-2.5 py-1.5 text-left text-[12px] font-medium text-white backdrop-blur">
                  {t(b.name)}
                  {active ? <Check size={12} weight="bold" /> : locked ? <LockSimple size={11} weight="bold" className="opacity-80" /> : null}
                </span>
              </button>
            );
          })}
        </div>
        {s.background !== "none" && (
          <Field label={t("Darken")} hint={t("More shade keeps the timer and tasks easy to read.")}>
            <input
              type="range"
              min={0}
              max={70}
              value={Math.round(s.backgroundDim * 100)}
              aria-label={t("Darken background")}
              onChange={(e) => set({ backgroundDim: Number(e.target.value) / 100 })}
              className="h-1.5 w-36 cursor-pointer appearance-none rounded-full bg-ink/15 accent-[var(--c-ink)]"
            />
          </Field>
        )}
      </Group>

      <Group title={t("Colour theme")}>
        <div className="grid gap-2.5 py-4 sm:grid-cols-2">
          {THEMES.map((theme) => {
            const active = s.theme === theme.id;
            const locked = theme.pro && !canThemes;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => (theme.pro ? gate("themes.all", () => set({ theme: theme.id })) : set({ theme: theme.id }))}
                className={cn("group overflow-hidden rounded-[18px] text-left ring-2 transition-all", active ? "ring-ink" : "ring-transparent hover:ring-line")}
              >
                <div className="flex h-14">
                  {(["focus", "short", "long"] as const).map((m) => (
                    <div key={m} className="relative flex-1" style={{ background: theme.modes[m].bg }}>
                      <span className="absolute bottom-2 left-2.5 size-2.5 rounded-full" style={{ background: theme.modes[m].btn }} />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between bg-fill px-3.5 py-2.5">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {t(theme.name)} {theme.pro && <ProBadge />}
                  </div>
                  {active ? <Check size={15} weight="bold" /> : locked ? <LockSimple size={13} weight="bold" className="text-ink-3" /> : null}
                </div>
              </button>
            );
          })}
        </div>
      </Group>

      <Group title={t("Typeface")}>
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
                  <span className={cn("block text-[13px]", active ? "opacity-70" : "text-ink-3")}>{t(f.description)}</span>
                </span>
                {active && <Check size={15} weight="bold" className="shrink-0" />}
              </button>
            );
          })}
        </div>
      </Group>

      <Group title={t("Behaviour")}>
        <Field label={t("Intro tour")} hint={t("A short walk through the timer page.")}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              useUI.getState().closeSettings();
              window.setTimeout(() => useTour.getState().start(), 350);
            }}
          >
            {t("Show again")}
          </Button>
        </Field>
        <Field label={t("Dim while running")} hint={t("Deepens the background so the screen recedes.")}>
          <Switch label={t("Dim while running")} checked={s.dimWhenRunning} onChange={(v) => set({ dimWhenRunning: v })} />
        </Field>
        <Field label={t("Other pages")} hint={t("Insights, settings and account.")}>
          <Segmented
            size="sm"
            ariaLabel={t("Appearance")}
            value={prefs.appearance}
            onChange={(v) => setPrefs({ appearance: v })}
            options={[
              { value: "system", label: t("Auto") },
              { value: "light", label: t("Light") },
              { value: "dark", label: t("Dark") },
            ]}
          />
        </Field>
      </Group>
    </>
  );
}
