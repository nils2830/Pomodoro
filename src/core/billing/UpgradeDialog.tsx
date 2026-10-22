"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "@phosphor-icons/react";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Segmented } from "../ui/Segmented";
import { useUI } from "../ui/store";
import { FEATURES, PRICING, PRO_HIGHLIGHTS } from "./plans";
import { startUpgrade, type Interval } from "./checkout";
import { config } from "../config";

export function UpgradeDialog() {
  const { open, feature } = useUI((s) => s.upgrade);
  const close = useUI((s) => s.closeUpgrade);
  const router = useRouter();
  const [interval, setInterval] = useState<Interval>("year");
  const [busy, setBusy] = useState(false);
  const focus = feature ? FEATURES[feature] : null;
  const list = PRO_HIGHLIGHTS.filter((f) => f !== feature).slice(0, 6);
  const monthlyEquivalent = (PRICING.yearly / 12).toFixed(2).replace(/\.00$/, "");

  return (
    <Dialog open={open} onClose={close} size="md" bare>
      <div className="grid sm:grid-cols-[1fr_1.1fr]">
        <div className="relative overflow-hidden rounded-t-[28px] bg-[oklch(0.555_0.135_32)] p-7 text-[oklch(0.985_0.012_85)] sm:rounded-l-[28px] sm:rounded-tr-none">
          <div className="pointer-events-none absolute -right-16 -bottom-20 size-64 rounded-full border-[28px] border-white/10" />
          <div className="pointer-events-none absolute -right-2 -bottom-6 size-24 rounded-full bg-white/10" />
          <div className="eyebrow opacity-70">Steen Pro</div>
          <h2 className="display mt-4 text-[34px] leading-[0.95]">{focus ? focus.label : "Go deeper."}</h2>
          <p className="mt-3 max-w-[30ch] text-[15px] leading-snug opacity-85">
            {focus ? focus.detail : "The timer stays free. Pro is for seeing your patterns and shaping your space."}
          </p>
          <div className="relative mt-10">
            <div className="display text-[44px] leading-none">
              {PRICING.symbol}
              {interval === "year" ? monthlyEquivalent : PRICING.monthly}
              <span className="ml-1 font-sans text-base font-medium opacity-75">/ month</span>
            </div>
            <div className="mt-1.5 text-[13px] opacity-75">
              {interval === "year" ? `Billed ${PRICING.symbol}${PRICING.yearly} yearly` : "Billed monthly, cancel anytime"}
            </div>
          </div>
        </div>
        <div className="p-7">
          <div className="eyebrow text-ink-3">Also included</div>
          <ul className="mt-4 space-y-2.5">
            {list.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[14px] leading-snug">
                <Check size={16} weight="bold" className="mt-0.5 shrink-0 text-ink-3" />
                <span>{FEATURES[f].label}</span>
              </li>
            ))}
          </ul>
          <Segmented
            className="mt-6 w-full [&>button]:flex-1 [&>button]:justify-center"
            size="sm"
            ariaLabel="Billing interval"
            value={interval}
            onChange={setInterval}
            options={[
              { value: "month", label: "Monthly" },
              { value: "year", label: "Yearly · save 25%" },
            ]}
          />
          <Button
            variant="primary"
            size="lg"
            className="mt-3 w-full"
            disabled={busy}
            trailing={<ArrowRight size={16} weight="bold" />}
            onClick={async () => {
              setBusy(true);
              await startUpgrade(interval, router);
              setBusy(false);
              close(); // the embedded checkout opens in its own dialog
            }}
          >
            {config.billingEnabled ? "Upgrade to Pro" : "Unlock Pro (demo)"}
          </Button>
          <Link href="/pricing" onClick={close} className="mt-3 block text-center text-[13px] text-ink-3 underline-offset-4 hover:text-ink hover:underline">
            Compare plans
          </Link>
        </div>
      </div>
    </Dialog>
  );
}
