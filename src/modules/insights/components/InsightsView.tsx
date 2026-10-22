"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileCsv, Flask, Plus, Timer, X } from "@phosphor-icons/react";
import { Segmented } from "@/core/ui/Segmented";
import { Select } from "@/core/ui/fields";
import { Button } from "@/core/ui/Button";
import { ProGate } from "@/core/billing/ProGate";
import { useCan } from "@/core/billing/entitlements";
import { useGate } from "@/core/billing/useGate";
import { useUI } from "@/core/ui/store";
import { usePrefs } from "@/core/prefs";
import { useEntries } from "@/core/data/entries";
import { useNow } from "@/core/lib/useNow";
import { useLocale, useT } from "@/core/i18n";
import { formatDuration, formatHourLabel, MINUTE } from "@/core/lib/time";
import { useActivityList } from "@/modules/focus/hooks";
import type { BucketUnit, RangeKey } from "../analytics";
import { formatDayLabel, formatShortDate, monthShort, monthYear } from "../dates";
import { hasSampleData, loadSampleData, removeSampleData } from "../sample";
import { exportSessionsCsv } from "../export";
import { useInsights } from "./useInsights";
import { KpiRow } from "./KpiRow";
import { DistractionPanel } from "./DistractionPanel";
import { Observations } from "./Observations";
import { SessionLog } from "./SessionLog";
import { EntryDialog } from "./EntryDialog";
import { Block, Legend } from "./charts/shared";
import { StackedColumns } from "./charts/StackedColumns";
import { Columns } from "./charts/Columns";
import { Punchcard } from "./charts/Punchcard";
import { YearHeatmap } from "./charts/YearHeatmap";
import { TrendLine } from "./charts/TrendLine";
import { BarList } from "./charts/BarList";

const RANGES: { value: RangeKey; label: string; title: string }[] = [
  { value: "7d", label: "7D", title: "Last 7 days" },
  { value: "30d", label: "30D", title: "Last 30 days" },
  { value: "90d", label: "90D", title: "Last 90 days" },
  { value: "1y", label: "1Y", title: "Last 12 months" },
  { value: "all", label: "All", title: "All time" },
];

const UNIT_SUBTITLE: Record<BucketUnit, string> = {
  day: "Per day, split by activity.",
  week: "Per week, split by activity.",
  month: "Per month, split by activity.",
};

const color = (slot: number | undefined) => (slot == null ? "var(--c-ink-3)" : `var(--series-${slot + 1})`);

export function InsightsView() {
  const t = useT();
  const locale = useLocale();
  const canHistory = useCan("insights.history");
  const canExport = useCan("export");
  const canAdvanced = useCan("insights.advanced");
  const weekStart = usePrefs((s) => s.doc.weekStart);
  const gate = useGate();
  const openUpgrade = useUI((s) => s.openUpgrade);
  const hourFormat = usePrefs((s) => s.doc.hourFormat);
  const activities = useActivityList(true);
  const liveActivities = useActivityList();
  const items = useEntries((s) => s.items);
  const sample = hasSampleData(items);
  const [rangeKey, setRangeKey] = useState<RangeKey>("7d");
  const [activityId, setActivityId] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const minute = useNow(60_000);
  const now = Math.floor(minute / MINUTE) * MINUTE;
  const effectiveRange: RangeKey = canHistory ? rangeKey : "7d";
  const data = useInsights(effectiveRange, activityId, now);
  const rangeTitle = RANGES.find((r) => r.value === effectiveRange)!.title;

  const unassigned = t("Unassigned");
  const series = useMemo(() => {
    const used = new Set(data.mix.map((m) => m.activityId ?? "none"));
    const list = activities.filter((a) => used.has(a.id)).map((a) => ({ id: a.id, label: a.name, color: color(a.color) }));
    if (used.has("none")) list.push({ id: "none", label: unassigned, color: "var(--c-ink-3)" });
    return list;
  }, [activities, data.mix, unassigned]);

  const columns = data.buckets.map((b) => {
    const d = new Date(b.start);
    const label =
      data.unit === "day"
        ? data.buckets.length <= 7
          ? data.weekdayNames[(d.getDay() - weekStart + 7) % 7]
          : String(d.getDate())
        : data.unit === "week"
          ? formatShortDate(locale, b.start)
          : monthShort(locale, d.getMonth());
    const title =
      data.unit === "day"
        ? formatDayLabel(locale, b.start, now)
        : data.unit === "week"
          ? t("Week of {date}", { date: formatShortDate(locale, b.start) })
          : monthYear(locale, b.start);
    return { key: String(b.start), label, title, values: b.byActivity, total: b.totalMs };
  });

  if (!data.hasAnyData) return <EmptyState onLog={() => setLogOpen(true)} logOpen={logOpen} closeLog={() => setLogOpen(false)} />;

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 pt-6 pb-24 sm:px-6 sm:pt-10">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="eyebrow text-ink-3">
            {t("Insights")} · {t(rangeTitle)}
          </div>
          <h1 className="display mt-3 text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.86]">{t("Your rhythm")}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" icon={<Plus size={15} weight="bold" />} onClick={() => setLogOpen(true)}>
            {t("Log time")}
          </Button>
          <Button
            variant="outline"
            icon={<FileCsv size={15} weight="bold" />}
            onClick={() => gate("export", exportSessionsCsv)}
            trailing={!canExport ? <span className="font-mono text-[9.5px] tracking-[0.1em] text-ink-3">PRO</span> : undefined}
          >
            {t("Export")}
          </Button>
        </div>
      </header>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Segmented<RangeKey>
          ariaLabel={t("Time range")}
          size="sm"
          value={effectiveRange}
          onChange={setRangeKey}
          onLocked={() => openUpgrade("insights.history")}
          options={RANGES.map((r) => ({ value: r.value, label: t(r.label), title: t(r.title), locked: !canHistory && r.value !== "7d" }))}
        />
        <Select value={activityId ?? ""} onChange={(e) => setActivityId(e.target.value || null)} aria-label={t("Activity")} className="h-9">
          <option value="">{t("All activities")}</option>
          {liveActivities.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
        {sample && (
          <span className="inline-flex h-9 items-center gap-2 rounded-full bg-accent/12 pr-1.5 pl-3.5 text-[13px] font-medium">
            <Flask size={14} weight="bold" /> {t("Sample data")}
            <button
              type="button"
              onClick={removeSampleData}
              className="inline-flex h-6 items-center gap-1 rounded-full px-2 text-ink-2 hover:bg-fill hover:text-ink"
            >
              <X size={12} weight="bold" /> {t("Remove")}
            </button>
          </span>
        )}
      </div>

      <div className="mt-8">
        <KpiRow data={data} />
      </div>

      {data.focus.length > 0 && (
        <div className="mt-6">
          <DistractionPanel stats={data.distraction} />
        </div>
      )}

      <div className="mt-14 grid gap-x-12 gap-y-16 lg:grid-cols-12">
        <Block
          index={t("01 · Volume")}
          title={t("Focus over time")}
          subtitle={t(UNIT_SUBTITLE[data.unit])}
          className="lg:col-span-8"
          legend={series.length > 1 ? <Legend items={series} /> : undefined}
          table={{
            columns: [t("Period"), ...series.map((s) => s.label), t("Total")],
            rows: columns.map((c) => [c.title, ...series.map((s) => formatDuration(c.values[s.id] ?? 0)), formatDuration(c.total)]),
          }}
        >
          <StackedColumns columns={columns} series={series} />
        </Block>

        <Block index={t("02 · Mix")} title={t("Where the time goes")} subtitle={t("Share of focus by activity.")} className="lg:col-span-4">
          {data.mix.length ? (
            <BarList
              total={data.kpis.focusMs}
              items={data.mix.map((m) => {
                const a = activities.find((x) => x.id === m.activityId);
                return {
                  id: m.activityId ?? "none",
                  label: a?.name ?? t("Unassigned"),
                  color: color(a?.color),
                  value: m.ms,
                  detail: t("{count} sessions", { count: m.sessions }),
                };
              })}
            />
          ) : (
            <p className="text-[14px] text-ink-3">{t("Nothing logged in this period.")}</p>
          )}
        </Block>

        <Block
          index={t("03 · Rhythm")}
          title={t("When you sit down")}
          subtitle={t("Each dot is an hour of the week; bigger means you started there more often.")}
          className="lg:col-span-12"
          table={
            canAdvanced
              ? {
                  columns: [t("Day"), ...Array.from({ length: 24 }, (_, h) => formatHourLabel(h, hourFormat))],
                  rows: data.punch.grid.map((row, d) => [data.weekdayNames[d], ...row]),
                }
              : undefined
          }
        >
          <ProGate feature="insights.advanced">
            <Punchcard grid={data.punch.grid} max={data.punch.max} weekdays={data.weekdayNames} hourFormat={hourFormat} />
          </ProGate>
        </Block>

        <Block
          index={t("04 · Year")}
          title={t("A year at a glance")}
          subtitle={t("Focus per day across the last twelve months.")}
          className="lg:col-span-12"
          table={
            canAdvanced
              ? {
                  columns: [t("Month"), t("Focus"), t("Active days")],
                  rows: Object.entries(
                    data.year.columns.flat().reduce<Record<string, { ms: number; days: number }>>((acc, d) => {
                      if (d.future) return acc;
                      const k = monthYear(locale, d.ts);
                      acc[k] ??= { ms: 0, days: 0 };
                      acc[k].ms += d.ms;
                      if (d.ms > 0) acc[k].days += 1;
                      return acc;
                    }, {}),
                  ).map(([k, v]) => [k, formatDuration(v.ms), v.days]),
                }
              : undefined
          }
        >
          <ProGate feature="insights.advanced">
            <YearHeatmap columns={data.year.columns} weekdays={data.weekdayNames} />
          </ProGate>
        </Block>

        <Block
          index={t("05 · Length")}
          title={t("How long you stay")}
          subtitle={t("Sit-downs by total focus time.")}
          className="lg:col-span-6"
          table={canAdvanced ? { columns: [t("Length"), t("Sit-downs")], rows: data.lengths.map((l) => [t(l.label), l.count]) } : undefined}
        >
          <ProGate feature="insights.advanced" compact>
            <Columns
              data={data.lengths.map((l) => ({
                key: l.label,
                label: t(l.label),
                value: l.count,
                title: t("{length} sit-downs", { length: t(l.label) }),
                display: String(l.count),
              }))}
            />
          </ProGate>
        </Block>

        <Block
          index={t("06 · Week")}
          title={t("Your week")}
          subtitle={t("Average focus on each weekday.")}
          className="lg:col-span-6"
          table={
            canAdvanced
              ? {
                  columns: [t("Weekday"), t("Average"), t("Total")],
                  rows: data.weekdays.map((w, i) => [data.weekdayNames[i], formatDuration(w.avgMs), formatDuration(w.totalMs)]),
                }
              : undefined
          }
        >
          <ProGate feature="insights.advanced" compact>
            <Columns
              data={data.weekdays.map((w, i) => ({
                key: String(i),
                label: data.weekdayNames[i],
                value: w.avgMs,
                title: t("Average {day}", { day: data.weekdayNames[i] }),
                display: formatDuration(w.avgMs),
              }))}
            />
          </ProGate>
        </Block>

        <Block
          index={t("07 · Day")}
          title={t("Hours of the day")}
          subtitle={t("Where your focus minutes fall, across the period.")}
          className="lg:col-span-6"
          table={
            canAdvanced
              ? { columns: [t("Hour"), t("Focus")], rows: data.hours.map((ms, h) => [`${formatHourLabel(h, hourFormat)}:00`, formatDuration(ms)]) }
              : undefined
          }
        >
          <ProGate feature="insights.advanced" compact>
            <Columns
              labelEvery={3}
              data={data.hours.map((ms, h) => ({
                key: String(h),
                label: formatHourLabel(h, hourFormat),
                value: ms,
                title: t("{from}:00 to {to}:00", { from: formatHourLabel(h, hourFormat), to: formatHourLabel((h + 1) % 24, hourFormat) }),
                display: formatDuration(ms),
              }))}
            />
          </ProGate>
        </Block>

        <Block
          index={t("08 · Trend")}
          title={t("Week by week")}
          subtitle={t("Total focus for each of the last 16 weeks.")}
          className="lg:col-span-6"
          table={
            canAdvanced
              ? { columns: [t("Week of"), t("Focus")], rows: data.trend.map((w) => [formatShortDate(locale, w.start), formatDuration(w.totalMs)]) }
              : undefined
          }
        >
          <ProGate feature="insights.advanced" compact>
            <TrendLine data={data.trend} />
          </ProGate>
        </Block>

        <Block
          index={t("09 · Patterns")}
          title={t("What stands out")}
          subtitle={t("Written from your own numbers for this period.")}
          className="lg:col-span-12"
        >
          <ProGate feature="insights.advanced">
            <Observations items={data.observations} />
          </ProGate>
        </Block>

        <Block index={t("10 · Log")} title={t("Every session")} subtitle={t("Edit or delete anything that's wrong.")} className="lg:col-span-12">
          <SessionLog focus={data.focus} />
        </Block>
      </div>

      <EntryDialog key={String(logOpen)} open={logOpen} onClose={() => setLogOpen(false)} />
    </div>
  );
}

function EmptyState({ onLog, logOpen, closeLog }: { onLog: () => void; logOpen: boolean; closeLog: () => void }) {
  const t = useT();
  return (
    <div className="mx-auto grid min-h-[calc(100svh-72px)] w-full max-w-[1180px] items-center px-5 py-16 sm:px-8">
      <div className="grid items-center gap-14 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="eyebrow text-ink-3">{t("Insights")}</div>
          <h1 className="display mt-4 text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.86]">{t("Nothing to read yet.")}</h1>
          <p className="mt-6 max-w-[44ch] text-[17px] leading-relaxed text-ink-2">
            {t("Every focus session you finish lands here. After a few days you'll see how often you sit down, when, for how long, and what you spend it on.")}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/" className="inline-flex h-12 items-center gap-2 rounded-full bg-btn px-6 text-[15px] font-medium text-btn-ink">
              <Timer size={18} weight="bold" /> {t("Start a session")}
            </Link>
            <Button variant="outline" size="lg" icon={<Flask size={17} weight="bold" />} onClick={loadSampleData}>
              {t("Explore with sample data")}
            </Button>
            <Button variant="ghost" size="lg" icon={<Plus size={17} weight="bold" />} onClick={onLog}>
              {t("Log past time")}
            </Button>
          </div>
        </div>
        <div aria-hidden className="hidden grid-cols-7 gap-1.5 opacity-80 lg:grid">
          {Array.from({ length: 49 }, (_, i) => {
            const v = [0, 1, 2, 3, 4][(i * 7 + (i % 5) * 3) % 5];
            return (
              <span
                key={i}
                className="aspect-square rounded-[6px]"
                style={{ background: v ? `color-mix(in oklab, var(--seq) ${v * 22}%, var(--c-page))` : "var(--c-fill)" }}
              />
            );
          })}
        </div>
      </div>
      <EntryDialog key={String(logOpen)} open={logOpen} onClose={closeLog} />
    </div>
  );
}
