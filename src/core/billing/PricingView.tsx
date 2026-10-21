"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, Minus } from "@phosphor-icons/react";
import { Segmented } from "../ui/Segmented";
import { Button } from "../ui/Button";
import { toast } from "../ui/store";
import { config } from "../config";
import { usePlan } from "./entitlements";
import { FEATURES, FREE_INCLUDES, PRICING, PRO_HIGHLIGHTS } from "./plans";
import { startUpgrade, type Interval } from "./checkout";

const COMPARE: [string, boolean | string, boolean | string][] = [
  ["Focus, short & long break timer", true, true],
  ["Hide the timer, hold to peek", true, true],
  ["Timer faces", "Digits, ring, wall clock", "All 8"],
  ["Flow mode (open-ended sessions)", false, true],
  ["Tasks, estimates, finish time", true, true],
  ["Activities", "3", "Unlimited"],
  ["Projects & task templates", false, true],
  ["Insights history", "7 days", "Everything"],
  ["Sit-down rhythm, year heatmap, observations", false, true],
  ["Alarm sounds", "2", "6"],
  ["Ambient soundscapes", "Clock tick", "Rain, ocean, 3 noises"],
  ["Themes", "3", "6"],
  ["Pop-out mini timer", false, true],
  ["CSV export", false, true],
  ["JSON backup & restore", true, true],
  ["Cloud sync across devices", false, true],
];

function Cell({ v }: { v: boolean | string }) {
  if (v === true) return <Check size={17} weight="bold" className="mx-auto" aria-label="Included" />;
  if (v === false) return <Minus size={17} weight="bold" className="mx-auto text-ink-3" aria-label="Not included" />;
  return <span className="text-[13.5px]">{v}</span>;
}

export function PricingView() {
  const plan = usePlan();
  const router = useRouter();
  const params = useSearchParams();
  const [interval, setInterval] = useState<Interval>(params.get("interval") === "month" ? "month" : "year");
  const [busy, setBusy] = useState(false);
  const monthly = interval === "year" ? (PRICING.yearly / 12).toFixed(2).replace(/\.00$/, "") : String(PRICING.monthly);

  useEffect(() => {
    if (params.get("checkout") === "cancelled") toast("Checkout cancelled. Nothing was charged.");
  }, [params]);

  const upgrade = async () => {
    setBusy(true);
    await startUpgrade(interval, router);
    setBusy(false);
  };

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 pt-8 pb-28 sm:px-8 sm:pt-14">
      <div className="max-w-[760px]">
        <div className="eyebrow text-ink-3">Pricing</div>
        <h1 className="display mt-4 text-[clamp(2.8rem,7.5vw,6rem)] leading-[0.86]">The timer is free. The depth is Pro.</h1>
        <p className="mt-6 max-w-[48ch] text-[17px] leading-relaxed text-ink-2">
          Use Cadence every day without paying. Upgrade when you want the full picture of your habits, more ways to see time, and your data on every device.
        </p>
      </div>

      <div className="mt-10">
        <Segmented<Interval>
          ariaLabel="Billing interval"
          value={interval}
          onChange={setInterval}
          options={[
            { value: "month", label: "Monthly" },
            { value: "year", label: "Yearly · 25% off" },
          ]}
        />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="flex flex-col rounded-[32px] border border-line p-8">
          <div className="eyebrow text-ink-3">Free</div>
          <div className="mt-5 text-[52px] leading-none font-semibold tracking-[-0.04em]">{PRICING.symbol}0</div>
          <div className="mt-2 text-[14px] text-ink-3">Forever, no account needed.</div>
          <ul className="mt-8 flex-1 space-y-3">
            {FREE_INCLUDES.map((f) => (
              <li key={f} className="flex gap-3 text-[15px]">
                <Check size={17} weight="bold" className="mt-0.5 shrink-0 text-ink-3" />
                {f}
              </li>
            ))}
          </ul>
          <Button variant="outline" size="lg" className="mt-8" disabled>
            {plan === "free" ? "Your current plan" : "Included"}
          </Button>
        </div>

        <div className="relative flex flex-col overflow-hidden rounded-[32px] bg-[oklch(0.555_0.135_32)] p-8 text-[oklch(0.985_0.012_85)]">
          <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full border-[36px] border-white/10" />
          <div className="eyebrow opacity-70">Pro</div>
          <div className="mt-5 flex items-baseline gap-2">
            <span className="text-[52px] leading-none font-semibold tracking-[-0.04em]">
              {PRICING.symbol}
              {monthly}
            </span>
            <span className="text-[15px] opacity-75">/ month</span>
          </div>
          <div className="mt-2 text-[14px] opacity-75">
            {interval === "year" ? `${PRICING.symbol}${PRICING.yearly} billed once a year.` : "Billed monthly. Cancel anytime."}
          </div>
          <ul className="relative mt-8 flex-1 space-y-3">
            {PRO_HIGHLIGHTS.slice(0, 8).map((f) => (
              <li key={f} className="flex gap-3 text-[15px]">
                <Check size={17} weight="bold" className="mt-0.5 shrink-0 opacity-75" />
                <span>
                  <b className="font-semibold">{FEATURES[f].label}.</b> <span className="opacity-80">{FEATURES[f].detail}</span>
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={upgrade}
            disabled={busy || plan === "pro"}
            className="relative mt-8 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[oklch(0.985_0.012_85)] text-[16px] font-semibold text-[oklch(0.42_0.12_32)] transition-transform hover:-translate-y-0.5 disabled:opacity-70"
          >
            {plan === "pro" ? "You're on Pro" : config.billingEnabled ? "Upgrade to Pro" : "Unlock Pro (demo mode)"}
            {plan !== "pro" && <ArrowRight size={18} weight="bold" />}
          </button>
          {!config.billingEnabled && (
            <p className="relative mt-3 text-center text-[12.5px] opacity-70">
              Payments aren&apos;t connected on this deployment, so Pro unlocks locally for testing.
            </p>
          )}
        </div>
      </div>

      <div className="mt-20">
        <h2 className="display text-[32px] leading-none">Side by side</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[560px] border-t border-ink/80 text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="py-3 pr-4 text-[13px] font-medium text-ink-3">Feature</th>
                <th className="w-[26%] py-3 text-center text-[13px] font-medium text-ink-3">Free</th>
                <th className="w-[26%] py-3 text-center text-[13px] font-semibold">Pro</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(([label, free, pro]) => (
                <tr key={label} className="border-b border-line">
                  <td className="py-3.5 pr-4 text-[15px]">{label}</td>
                  <td className="py-3.5 text-center text-ink-2">
                    <Cell v={free} />
                  </td>
                  <td className="py-3.5 text-center">
                    <Cell v={pro} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
