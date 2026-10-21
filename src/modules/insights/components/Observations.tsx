import type { Observation } from "../analytics";

export function Observations({ items }: { items: Observation[] }) {
  if (items.length === 0) return <p className="text-[14px] text-ink-3">A few more sessions and patterns will start to show here.</p>;
  return (
    <ol className="grid gap-x-10 sm:grid-cols-2">
      {items.map((o, i) => (
        <li key={o.id} className="grid grid-cols-[34px_1fr] border-b border-line py-5">
          <span className="font-mono text-[12px] text-ink-3">{String(i + 1).padStart(2, "0")}</span>
          <div>
            <div className="display text-[19px] leading-snug">{o.title}</div>
            <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">{o.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
