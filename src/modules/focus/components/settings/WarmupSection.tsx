"use client";

import { useState } from "react";
import { ArrowSquareOut, CaretDown, Eye } from "@phosphor-icons/react";
import { Field } from "@/core/ui/fields";
import { Switch } from "@/core/ui/Switch";
import { Segmented } from "@/core/ui/Segmented";
import { Button } from "@/core/ui/Button";
import { useUI } from "@/core/ui/store";
import { cn } from "@/core/lib/cn";
import { useFocusSettings } from "../../store/settings";
import { useWarmup } from "../../warmup/store";
import { WARMUP_EXPLAINER, WARMUP_PRESETS, WARMUP_REFERENCES, WARMUP_SAFETY, type WarmupWhen } from "../../warmup/protocol";
import { Group, SectionTitle } from "./SettingsDialog";

export function WarmupSection() {
  const s = useFocusSettings((x) => x.doc);
  const set = useFocusSettings((x) => x.set);
  const closeSettings = useUI((x) => x.closeSettings);
  const [science, setScience] = useState(false);
  const preset = WARMUP_PRESETS.find((p) => p.seconds === s.warmupSeconds);

  return (
    <>
      <SectionTitle eyebrow="Warm-up" title="Settle before you start">
        A minute or two resting your eyes on a single dot, then a moment with them closed. A calm, consistent way into a session.
      </SectionTitle>

      <Group title="When">
        <div className="py-3.5">
          <Segmented<WarmupWhen>
            ariaLabel="When to warm up"
            value={s.warmupWhen}
            onChange={(v) => set({ warmupWhen: v })}
            options={[
              { value: "sitdown", label: "New sit-down" },
              { value: "always", label: "Every session" },
              { value: "off", label: "Off" },
            ]}
          />
          <p className="mt-2.5 text-[13px] leading-snug text-ink-3">
            {s.warmupWhen === "sitdown"
              ? "Before the first focus session after 20 minutes away. Rounds after a break go straight in."
              : s.warmupWhen === "always"
                ? "Before every focus session you start yourself. Automatic starts skip it."
                : "Start goes straight to the timer. You can still try it below."}
          </p>
        </div>
      </Group>

      <Group title="Length">
        <div className="grid grid-cols-5 gap-1.5 pt-4">
          {WARMUP_PRESETS.map((p) => {
            const active = p.seconds === s.warmupSeconds;
            return (
              <button
                key={p.seconds}
                type="button"
                onClick={() => set({ warmupSeconds: p.seconds })}
                aria-pressed={active}
                className={cn(
                  "flex flex-col items-center rounded-2xl px-1 py-2.5 transition-colors",
                  active ? "bg-ink text-page" : "bg-fill text-ink hover:bg-ink/10",
                )}
              >
                <span className="text-[15px] font-semibold tabular-nums">{p.label}</span>
                <span className={cn("text-[11.5px]", active ? "opacity-70" : "text-ink-3")}>{p.name}</span>
              </button>
            );
          })}
        </div>
        <p className="pt-2.5 pb-4 text-[13px] text-ink-3">{preset?.note ?? "Settle, a gaze at the dot, eyes closed, then begin."}</p>
      </Group>

      <Group title="Steps">
        <Field label="Name your first step" hint="One line before the warm-up, shown again when you open your eyes.">
          <Switch label="Name your first step" checked={s.warmupFirstStep} onChange={(v) => set({ warmupFirstStep: v })} />
        </Field>
        <Field label="Eyes closed at the end" hint="A quarter of the time, while the afterglow of the dot fades. Rests your eyes.">
          <Switch label="Eyes closed at the end" checked={s.warmupEyesClosed} onChange={(v) => set({ warmupEyesClosed: v })} />
        </Field>
        <Field label="Soft tone" hint="Tells you when to open your eyes.">
          <Switch label="Soft tone" checked={s.warmupTone} onChange={(v) => set({ warmupTone: v })} />
        </Field>
      </Group>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          icon={<Eye size={14} weight="bold" />}
          onClick={() => {
            closeSettings();
            useWarmup.getState().open({ preview: true });
          }}
        >
          Try it now
        </Button>
        <span className="text-[13px] text-ink-3">Nothing starts afterwards.</span>
      </div>

      <div className="mt-8 rounded-[22px] bg-fill">
        <button type="button" onClick={() => setScience((v) => !v)} aria-expanded={science} className="flex w-full items-center justify-between px-5 py-4 text-left">
          <span className="text-[15px] font-medium">What the research says</span>
          <CaretDown size={14} weight="bold" className={cn("text-ink-3 transition-transform", science && "rotate-180")} />
        </button>
        {science && (
          <div className="px-5 pb-5 text-[13.5px] leading-relaxed text-ink-2">
            <p>{WARMUP_EXPLAINER}</p>
            <p className="mt-3 text-ink-3">{WARMUP_SAFETY}</p>
            <ul className="mt-4 space-y-3 border-t border-line pt-4">
              {WARMUP_REFERENCES.map((r) => (
                <li key={r.url}>
                  <a href={r.url} target="_blank" rel="noreferrer" className="group inline-flex gap-1.5 font-medium text-ink hover:underline">
                    {r.citation}
                    <ArrowSquareOut size={12} weight="bold" className="mt-1 shrink-0 text-ink-3" />
                  </a>
                  <div className="text-[12.5px] text-ink-3">{r.supports}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
