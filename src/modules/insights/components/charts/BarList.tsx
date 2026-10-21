import { formatDuration } from "@/core/lib/time";

export interface BarItem {
  id: string;
  label: string;
  color: string;
  value: number;
  detail?: string;
}

/** Horizontal bars for part-to-whole. Text stays in ink; the colour sits in the bar. */
export function BarList({ items, total }: { items: BarItem[]; total: number }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-4">
      {items.map((i) => (
        <li key={i.id}>
          <div className="flex items-baseline justify-between gap-3 text-[14px]">
            <span className="flex min-w-0 items-center gap-2 font-medium">
              <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: i.color }} />
              <span className="truncate">{i.label}</span>
            </span>
            <span className="shrink-0 tabular-nums">
              <span className="font-semibold">{formatDuration(i.value)}</span>
              <span className="ml-2 text-ink-3">{total > 0 ? Math.round((i.value / total) * 100) : 0}%</span>
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-fill">
            <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${(i.value / max) * 100}%`, background: i.color }} />
          </div>
          {i.detail && <div className="mt-1.5 text-[12.5px] text-ink-3">{i.detail}</div>}
        </li>
      ))}
    </ul>
  );
}
