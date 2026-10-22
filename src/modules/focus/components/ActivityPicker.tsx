"use client";

import { CaretDown, Check, GearSix } from "@phosphor-icons/react";
import { Popover, MenuItem, MenuSeparator } from "@/core/ui/Popover";
import { useUI } from "@/core/ui/store";
import { cn } from "@/core/lib/cn";
import { useT } from "@/core/i18n";
import { useTimer } from "../store/timer";
import { useActivityList } from "../hooks";

export function ActivityDot({ color, className }: { color: number; className?: string }) {
  return (
    <span className={cn("inline-block size-2.5 shrink-0 rounded-full ring-2 ring-ink/25", className)} style={{ background: `var(--series-${color + 1})` }} />
  );
}

export function ActivityPicker() {
  const t = useT();
  const activityId = useTimer((s) => s.activityId);
  const setActivity = useTimer((s) => s.setActivity);
  const openSettings = useUI((s) => s.openSettings);
  const list = useActivityList();
  const current = list.find((a) => a.id === activityId) ?? list[0];

  return (
    <Popover
      align="center"
      trigger={(props) => (
        <button
          type="button"
          {...props}
          className="inline-flex h-9 items-center gap-2 rounded-full bg-fill pr-3 pl-3.5 text-sm font-medium transition-colors hover:bg-ink/14"
          title={t("What kind of work is this?")}
        >
          {current && <ActivityDot color={current.color} />}
          {current?.name ?? t("Choose activity")}
          <CaretDown size={12} weight="bold" className="text-ink-3" />
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="eyebrow px-3 pt-2 pb-2 text-ink-3">{t("Logging time to")}</div>
          {list.map((a) => (
            <MenuItem
              key={a.id}
              icon={<ActivityDot color={a.color} className="ring-0" />}
              trailing={a.id === current?.id ? <Check size={15} weight="bold" /> : undefined}
              onClick={() => {
                setActivity(a.id);
                close();
              }}
            >
              {a.name}
            </MenuItem>
          ))}
          <MenuSeparator />
          <MenuItem
            icon={<GearSix size={16} weight="bold" />}
            onClick={() => {
              close();
              openSettings("activities");
            }}
          >
            {t("Manage activities")}
          </MenuItem>
        </>
      )}
    </Popover>
  );
}
