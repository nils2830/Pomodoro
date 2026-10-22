import { MINUTE } from "@/core/lib/time";
import { cn } from "@/core/lib/cn";
import { useT } from "@/core/i18n";
import type { FaceProps } from "./types";

/** One dot per minute (or per few minutes for long sessions). Changes once a minute. */
export function Dots(p: FaceProps) {
  const t = useT();
  const plannedMin = Math.max(1, Math.round(p.plannedMs / MINUTE));
  const per = plannedMin <= 60 ? 1 : Math.ceil(plannedMin / 60);
  const count = Math.ceil(plannedMin / per);
  const cols = count <= 25 ? Math.ceil(Math.sqrt(count)) : count <= 40 ? 8 : 10;
  const spent = Math.floor(p.elapsedMs / (MINUTE * per));
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <div className="grid gap-[min(2.2cqw,3.4cqh)]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: count }, (_, i) => {
          const done = i < spent;
          const current = i === spent && p.status === "running";
          return (
            <span
              key={i}
              className={cn(
                "relative block size-[min(5cqw,8cqh)] rounded-full transition-all duration-700",
                done ? "scale-[0.45] bg-ink/30" : "bg-ink",
                current && "animate-breathe",
              )}
            />
          );
        })}
      </div>
      <div className="text-[13px] text-ink-3">{per === 1 ? t("one dot, one minute") : t("one dot, {count} minutes", { count: per })}</div>
    </div>
  );
}
