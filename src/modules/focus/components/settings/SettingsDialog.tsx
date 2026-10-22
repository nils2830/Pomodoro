"use client";

import type { ReactNode } from "react";
import { Bell, CheckSquare, Database, Eye, Palette, SpeakerHigh, Swatches, Timer, Monitor, UserCircle } from "@phosphor-icons/react";
import { Dialog } from "@/core/ui/Dialog";
import { useUI, type SettingsTab } from "@/core/ui/store";
import { cn } from "@/core/lib/cn";
import { useT } from "@/core/i18n";
import { TimerSection, TasksSection, SoundSection, DisplaySection, NotificationsSection } from "./sections";
import { WarmupSection } from "./WarmupSection";
import { AppearanceSection } from "./AppearanceSection";
import { AccountSection } from "./AccountSection";
import { ActivitiesSection } from "./ActivitiesSection";
import { DataSection } from "./DataSection";

const TABS: { id: SettingsTab; label: string; icon: ReactNode }[] = [
  { id: "account", label: "Account", icon: <UserCircle size={18} weight="bold" /> },
  { id: "timer", label: "Timer", icon: <Timer size={18} weight="bold" /> },
  { id: "warmup", label: "Warm-up", icon: <Eye size={18} weight="bold" /> },
  { id: "appearance", label: "Appearance", icon: <Palette size={18} weight="bold" /> },
  { id: "display", label: "Faces", icon: <Monitor size={18} weight="bold" /> },
  { id: "tasks", label: "Tasks", icon: <CheckSquare size={18} weight="bold" /> },
  { id: "sound", label: "Sound", icon: <SpeakerHigh size={18} weight="bold" /> },
  { id: "notifications", label: "Alerts", icon: <Bell size={18} weight="bold" /> },
  { id: "activities", label: "Activities", icon: <Swatches size={18} weight="bold" /> },
  { id: "data", label: "Data", icon: <Database size={18} weight="bold" /> },
];

const SECTIONS: Record<SettingsTab, () => ReactNode> = {
  account: AccountSection,
  timer: TimerSection,
  warmup: WarmupSection,
  appearance: AppearanceSection,
  display: DisplaySection,
  tasks: TasksSection,
  sound: SoundSection,
  notifications: NotificationsSection,
  activities: ActivitiesSection,
  data: DataSection,
};

export function SettingsDialog() {
  const t = useT();
  const { open, tab } = useUI((s) => s.settings);
  const close = useUI((s) => s.closeSettings);
  const openTab = useUI((s) => s.openSettings);
  const Section = SECTIONS[tab];

  return (
    <Dialog open={open} onClose={close} size="lg" bare>
      <div className="grid min-h-[min(640px,calc(100svh-32px))] md:grid-cols-[200px_1fr]">
        <nav aria-label={t("Settings sections")} className="flex gap-1 overflow-x-auto border-b border-line p-3 md:flex-col md:border-r md:border-b-0 md:p-4">
          <div className="display hidden px-3 pt-2 pb-5 text-[26px] leading-none md:block">{t("Settings")}</div>
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openTab(item.id)}
              aria-current={item.id === tab ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                item.id === tab ? "bg-ink text-page" : "text-ink-2 hover:bg-fill hover:text-ink",
              )}
            >
              {item.icon}
              {t(item.label)}
            </button>
          ))}
        </nav>
        <div className="relative max-h-[calc(100svh-32px)] overflow-y-auto px-6 pt-6 pb-8 sm:px-8">
          <button
            type="button"
            onClick={close}
            className="absolute top-5 right-5 rounded-full px-3 py-1.5 text-sm font-medium text-ink-3 hover:bg-fill hover:text-ink"
          >
            {t("Done")}
          </button>
          <Section />
        </div>
      </div>
    </Dialog>
  );
}

export function SectionTitle({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-4 pr-16">
      <div className="eyebrow text-ink-3">{eyebrow}</div>
      <h3 className="display mt-2 text-[28px] leading-none">{title}</h3>
      {children && <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{children}</p>}
    </div>
  );
}

export function Group({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="mt-6 first-of-type:mt-2">
      {title && <div className="eyebrow mb-1 text-ink-3">{title}</div>}
      <div className="divide-y divide-line border-y border-line">{children}</div>
    </div>
  );
}
