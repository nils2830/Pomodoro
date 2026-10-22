import { ArrowDownRight, ArrowUpRight } from "@phosphor-icons/react";
import { formatDuration } from "@/core/lib/time";
import { cn } from "@/core/lib/cn";
import { useT } from "@/core/i18n";
import type { InsightsData } from "./useInsights";

function Delta({ now, before, invert, label }: { now: number; before: number; invert?: boolean; label: string }) {
  if (before <= 0 || now === before) return <span className="text-ink-3">{label}</span>;
  const change = (now - before) / before;
  const up = change > 0;
  const good = invert ? !up : up;
  return (
    <span className={cn("inline-flex items-center gap-0.5 font-medium", good ? "text-good" : "text-bad")}>
      {up ? <ArrowUpRight size={13} weight="bold" /> : <ArrowDownRight size={13} weight="bold" />}
      {Math.abs(Math.round(change * 100))}%<span className="ml-1 font-normal text-ink-3">{label}</span>
    </span>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: React.ReactNode }) {
  return (
    <div className="min-w-0 border-line py-5 pr-4 sm:border-r sm:pr-6 sm:last:border-r-0 [&:not(:first-child)]:sm:pl-6">
      <div className="eyebrow text-ink-3">{label}</div>
      <div className="mt-3 text-[clamp(1.9rem,3.4vw,2.6rem)] leading-none font-semibold tracking-[-0.03em]">{value}</div>
      {sub && <div className="mt-2 text-[12.5px]">{sub}</div>}
    </div>
  );
}

export function KpiRow({ data }: { data: InsightsData }) {
  const t = useT();
  const { kpis, prevKpis, streak, range } = data;
  const vs = range.key === "all" ? "" : t("vs before");
  return (
    <div className="grid grid-cols-2 border-y border-line sm:grid-cols-3 lg:grid-cols-5">
      <Stat label={t("Focused")} value={formatDuration(kpis.focusMs)} sub={<Delta now={kpis.focusMs} before={prevKpis.focusMs} label={vs} />} />
      <Stat label={t("Sit-downs")} value={String(kpis.sitDowns)} sub={<Delta now={kpis.sitDowns} before={prevKpis.sitDowns} label={vs} />} />
      <Stat
        label={t("Avg sit-down")}
        value={kpis.sitDowns ? formatDuration(kpis.avgSitDownMs) : "–"}
        sub={<span className="text-ink-3">{t("longest {duration}", { duration: formatDuration(kpis.longestSitDownMs) })}</span>}
      />
      <Stat
        label={t("Active days")}
        value={`${kpis.activeDays}`}
        sub={
          <span className="text-ink-3">
            {t("of {total} · {avg}/day", { total: kpis.totalDays, avg: kpis.activeDays ? formatDuration(kpis.avgPerActiveDayMs) : "0m" })}
          </span>
        }
      />
      <Stat label={t("Streak")} value={`${streak.current}d`} sub={<span className="text-ink-3">{t("best {count} days", { count: streak.longest })}</span>} />
    </div>
  );
}
