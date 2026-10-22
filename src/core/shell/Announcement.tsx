"use client";

import { useEffect, useState } from "react";
import { Megaphone, X } from "@phosphor-icons/react";
import { getSupabase } from "@/core/auth/supabase-browser";
import { useT } from "@/core/i18n";

const KEY = "steen.announcement.dismissed";

/** A message from /admin to everyone, until they close it. */
export function Announcement() {
  const t = useT();
  const [note, setNote] = useState<{ message: string; updated_at: string } | null>(null);

  useEffect(() => {
    getSupabase()
      ?.from("announcements")
      .select("message, updated_at")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data?.message) return;
        let seen: string | null = null;
        try {
          seen = localStorage.getItem(KEY);
        } catch {}
        if (seen !== data.updated_at) setNote(data);
      });
  }, []);

  if (!note) return null;
  const dismiss = () => {
    try {
      localStorage.setItem(KEY, note.updated_at);
    } catch {}
    setNote(null);
  };
  return (
    <div className="neutral relative z-[2] mx-auto mt-2 flex w-[min(100%-24px,640px)] items-start gap-3 rounded-[20px] bg-page/90 py-3 pr-2.5 pl-4 text-[14px] text-ink ring-1 ring-line backdrop-blur">
      <Megaphone size={16} weight="bold" className="mt-0.5 shrink-0 text-ink-3" />
      <p className="min-w-0 flex-1 leading-snug">{note.message}</p>
      <button type="button" onClick={dismiss} aria-label={t("Close")} className="grid size-7 shrink-0 place-items-center rounded-full text-ink-3 hover:bg-fill hover:text-ink">
        <X size={13} weight="bold" />
      </button>
    </div>
  );
}
