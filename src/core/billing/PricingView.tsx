"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, Minus, Plus } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { Segmented } from "../ui/Segmented";
import { Button } from "../ui/Button";
import { toast } from "../ui/store";
import { config } from "../config";
import { usePlan, useTrialEligible } from "./entitlements";
import { useAuth } from "../auth/store";
import { LogoMark } from "../ui/Logo";
import { FEATURES, FREE_INCLUDES, PRICING, PRO_HIGHLIGHTS, TRIAL_DAYS } from "./plans";
import { t as translate, useT } from "../i18n";
import { startUpgrade, type Interval } from "./checkout";

const COMPARE: [string, boolean | string, boolean | string][] = [
  ["Focus, short & long break timer", true, true],
  ["Focus warm-up, 30 s to 3 min", true, true],
  ["Hide the timer, hold to peek", true, true],
  ["Timer faces", "Digits, ring, wall clock", "All 8"],
  ["Flow mode (open-ended sessions)", false, true],
  ["Tasks, estimates, finish time", true, true],
  ["Activities", "3", "Unlimited"],
  ["Projects & task templates", false, true],
  ["Insights history", "7 days", "Everything"],
  ["Sit-down rhythm, year heatmap, observations", false, true],
  ["Landscapes behind the timer", "2", "All 6"],
  ["Fonts", "All 5", "All 5"],
  ["Themes", "3", "6"],
  ["Alarm sounds", "2", "6"],
  ["Ambient soundscapes", "Clock tick", "Rain, ocean, 3 noises"],
  ["Pop-out mini timer", false, true],
  ["Saved to your account, on every device", true, true],
  ["JSON backup & restore", true, true],
  ["CSV export", false, true],
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "How does the free week work?",
    a: "If you've never had Pro, your first 7 days are free. You add a card at checkout, but nothing is charged until the week is over, and if you cancel before then you pay nothing.",
  },
  {
    q: "Why do I need an account for the free plan?",
    a: "Your sessions are the whole point of the insights, so they are saved to your account from the first minute. Switch browsers or lose a laptop and nothing is gone.",
  },
  {
    q: "What happens if I stop paying?",
    a: "You move back to Free at the end of the period you paid for. Nothing is deleted: older history and Pro-only views simply lock until you upgrade again.",
  },
  {
    q: "Can I cancel or get a refund?",
    a: "Cancel anytime from Account → Billing. If Pro isn't for you, email us within 14 days of your first payment for a full refund.",
  },
  {
    q: "Do prices include VAT?",
    a: "The price you see at checkout is the price you pay, including any VAT. Payments run through Stripe; we never see your card.",
  },
];

function Cell({ v }: { v: boolean | string }) {
  const t = useT();
  if (v === true) return <Check size={17} weight="bold" className="mx-auto" aria-label={t("Included")} />;
  if (v === false) return <Minus size={17} weight="bold" className="mx-auto text-ink-3" aria-label={t("Not included")} />;
  return <span className="text-[13.5px]">{t(v)}</span>;
}

export function PricingView() {
  const t = useT();
  const plan = usePlan();
  const router = useRouter();
  const params = useSearchParams();
  const [interval, setInterval] = useState<Interval>(params.get("interval") === "month" ? "month" : "year");
  const [busy, setBusy] = useState(false);
  const signedOut = useAuth((s) => s.status === "signedOut");
  const trial = useTrialEligible();
  const monthly = interval === "year" ? (PRICING.yearly / 12).toFixed(2).replace(/\.00$/, "") : String(PRICING.monthly);

  useEffect(() => {
    if (params.get("checkout") === "cancelled") toast(translate("Checkout cancelled. Nothing was charged."));
  }, [params]);

  const upgrade = async () => {
    setBusy(true);
    await startUpgrade(interval, router);
    setBusy(false);
  };

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 pt-8 pb-28 sm:px-8 sm:pt-14">
      <div className="max-w-[760px]">
        <div className="eyebrow text-ink-3">{t("Pricing")}</div>
        <h1 className="display mt-4 text-[clamp(2.8rem,7.5vw,6rem)] leading-[0.86]">{t("The timer is free. The depth is Pro.")}</h1>
        <p className="mt-6 max-w-[48ch] text-[17px] leading-relaxed text-ink-2">
          {t(
            "Every account starts free, with your sessions saved from the first minute. Pro is for the full picture: deep insights, every face and landscape, and flow mode.",
          )}
        </p>
      </div>

      <div className="mt-10">
        <Segmented<Interval>
          ariaLabel={t("Billing interval")}
          value={interval}
          onChange={setInterval}
          options={[
            { value: "month", label: t("Monthly") },
            { value: "year", label: t("Yearly · save 25%") },
          ]}
        />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="flex flex-col rounded-[32px] border border-line p-8">
          <div className="eyebrow text-ink-3">{t("Free")}</div>
          <div className="mt-5 text-[52px] leading-none font-semibold tracking-[-0.04em]">{PRICING.symbol}0</div>
          <div className="mt-2 text-[14px] text-ink-3">{t("Free forever. Just create an account.")}</div>
          <ul className="mt-8 flex-1 space-y-3">
            {FREE_INCLUDES.map((f) => (
              <li key={f} className="flex gap-3 text-[15px]">
                <Check size={17} weight="bold" className="mt-0.5 shrink-0 text-ink-3" />
                {t(f)}
              </li>
            ))}
          </ul>
          {signedOut ? (
            <Link
              href="/login?mode=signup"
              className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full border border-line text-[15px] font-medium transition-colors hover:bg-fill"
            >
              {t("Create a free account")} <ArrowRight size={16} weight="bold" />
            </Link>
          ) : (
            <Button variant="outline" size="lg" className="mt-8" disabled>
              {plan === "free" ? t("Your current plan") : t("Included")}
            </Button>
          )}
        </div>

        <div className="relative flex flex-col overflow-hidden rounded-[32px] bg-[#f3eee6] p-8 text-[#12110f]">
          <LogoMark size={260} className="pointer-events-none absolute -top-10 -right-14 text-black/[0.045]" />
          <div className="eyebrow opacity-70">Pro</div>
          <div className="mt-5 flex items-baseline gap-2">
            <span className="text-[52px] leading-none font-semibold tracking-[-0.04em]">
              {PRICING.symbol}
              {monthly}
            </span>
            <span className="text-[15px] opacity-75">{t("/ month")}</span>
          </div>
          <div className="mt-2 text-[14px] opacity-75">
            {interval === "year" ? t("{price} billed once a year.", { price: `${PRICING.symbol}${PRICING.yearly}` }) : t("Billed monthly.")}{" "}
            {trial ? t("First {days} days free.", { days: TRIAL_DAYS }) : t("Cancel anytime.")}
          </div>
          <ul className="relative mt-8 flex-1 space-y-3">
            {PRO_HIGHLIGHTS.slice(0, 8).map((f) => (
              <li key={f} className="flex gap-3 text-[15px]">
                <Check size={17} weight="bold" className="mt-0.5 shrink-0 opacity-75" />
                <span>
                  <b className="font-semibold">{t(FEATURES[f].label)}.</b> <span className="opacity-80">{t(FEATURES[f].detail)}</span>
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={upgrade}
            disabled={busy || plan === "pro"}
            className="relative mt-8 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[#12110f] text-[16px] font-semibold text-[#f3eee6] transition-transform hover:-translate-y-0.5 disabled:opacity-70"
          >
            {plan === "pro"
              ? t("You're on Pro")
              : !config.billingEnabled
                ? t("Unlock Pro (demo mode)")
                : signedOut
                  ? t("Start free, then upgrade")
                  : trial
                    ? t("Try Pro free for {days} days", { days: TRIAL_DAYS })
                    : t("Upgrade to Pro")}
            {plan !== "pro" && <ArrowRight size={18} weight="bold" />}
          </button>
          <p className="relative mt-3 text-center text-[12.5px] opacity-60">
            {config.billingEnabled
              ? trial
                ? t("Nothing is charged for {days} days. Cancel before then and you pay nothing.", { days: TRIAL_DAYS })
                : t("Secure checkout with Stripe. 14-day refund on your first payment.")
              : t("Payments aren't connected on this deployment, so Pro unlocks locally for testing.")}
          </p>
        </div>
      </div>

      <div className="mt-20">
        <h2 className="display text-[32px] leading-none">{t("Side by side")}</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[560px] border-t border-ink/80 text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="py-3 pr-4 text-[13px] font-medium text-ink-3">{t("Feature")}</th>
                <th className="w-[26%] py-3 text-center text-[13px] font-medium text-ink-3">{t("Free")}</th>
                <th className="w-[26%] py-3 text-center text-[13px] font-semibold">Pro</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(([label, free, pro]) => (
                <tr key={label} className="border-b border-line">
                  <td className="py-3.5 pr-4 text-[15px]">{t(label)}</td>
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

      <div className="mt-20 grid gap-8 md:grid-cols-[1fr_1.6fr]">
        <h2 className="display text-[32px] leading-none">{t("Questions")}</h2>
        <div className="border-t border-ink/80">
          {FAQ.map((item) => (
            <FaqItem key={item.q} q={t(item.q)} a={t(item.a)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-line">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between gap-4 py-5 text-left">
        <span className="text-[16px] font-medium">{q}</span>
        <Plus size={16} weight="bold" className={`shrink-0 text-ink-3 transition-transform duration-300 ${open ? "rotate-45" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="max-w-[60ch] pb-5 text-[15px] leading-relaxed text-ink-2">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
