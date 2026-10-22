"use client";

import { Check, LockSimple, SquaresFour } from "@phosphor-icons/react";
import { Popover } from "@/core/ui/Popover";
import { IconButton } from "@/core/ui/Button";
import { useGate } from "@/core/billing/useGate";
import { useCan } from "@/core/billing/entitlements";
import { cn } from "@/core/lib/cn";
import { useT } from "@/core/i18n";
import { FACES } from "./faces";
import { useFocusSettings } from "../store/settings";
import { useTimer } from "../store/timer";

export function FaceList({ onPick }: { onPick?: () => void }) {
  const t = useT();
  const face = useFocusSettings((s) => s.doc.face);
  const hidden = useFocusSettings((s) => s.doc.hideTimer);
  const set = useFocusSettings((s) => s.set);
  const flow = useTimer((s) => s.flow && s.mode === "focus");
  const canAll = useCan("faces.all");
  const gate = useGate();
  return (
    <div className="grid grid-cols-1 gap-0.5">
      {FACES.map((f) => {
        const active = !hidden && f.id === face;
        const locked = f.pro && !canAll;
        return (
          <button
            key={f.id}
            type="button"
            role="menuitemradio"
            aria-checked={active}
            onClick={() => {
              const apply = () => {
                set({ face: f.id, hideTimer: false });
                onPick?.();
              };
              if (f.pro) gate("faces.all", apply);
              else apply();
            }}
            className={cn("flex items-start gap-3 rounded-[14px] px-3 py-2.5 text-left transition-colors hover:bg-fill", active && "bg-fill")}
          >
            <span className="mt-0.5 grid size-4 shrink-0 place-items-center">
              {active ? <Check size={16} weight="bold" /> : locked ? <LockSimple size={14} weight="bold" className="text-ink-3" /> : null}
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2 text-sm font-semibold">
                {t(f.name)}
                {!f.ticker && (
                  <span className="rounded-full bg-fill px-1.5 py-px font-mono text-[9.5px] tracking-[0.08em] text-ink-3 uppercase">{t("no ticker")}</span>
                )}
              </span>
              <span className="block text-[12.5px] leading-snug text-ink-3">
                {t(f.description)}
                {flow && !f.flow ? ` ${t("Shows digits during flow.")}` : ""}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function FacePicker() {
  const t = useT();
  return (
    <Popover
      align="end"
      panelClassName="w-[320px] max-h-[70vh] overflow-y-auto"
      trigger={(props) => (
        <IconButton label={t("Timer face (F)")} {...props}>
          <SquaresFour size={20} weight="bold" />
        </IconButton>
      )}
    >
      {(close) => (
        <>
          <div className="eyebrow px-3 pt-2 pb-2 text-ink-3">{t("Timer face")}</div>
          <FaceList onPick={close} />
        </>
      )}
    </Popover>
  );
}
