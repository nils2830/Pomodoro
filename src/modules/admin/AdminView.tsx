"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CaretDown, CheckCircle, DownloadSimple, Gift, Megaphone, MagnifyingGlass, PencilSimple, ShieldCheck, Trash, WarningCircle, XCircle } from "@phosphor-icons/react";
import { Button } from "@/core/ui/Button";
import { Segmented } from "@/core/ui/Segmented";
import { TextInput } from "@/core/ui/fields";
import { confirmAction, toast } from "@/core/ui/store";
import { useAuth } from "@/core/auth/store";
import { isGrantActive, isValidEmail, normalizeEmail, type ProGrant } from "@/core/billing/grants";
import { cn } from "@/core/lib/cn";

interface GrantRow extends ProGrant {
  signed_up_at: string | null;
}

interface UserRow {
  id: string;
  email: string | null;
  plan: "free" | "pro";
  plan_status: string | null;
  plan_interval: string | null;
  current_period_end: string | null;
  created_at: string;
}

type Duration = "forever" | "1m" | "3m" | "1y" | "date";

const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "");

function expiryFor(duration: Duration, date: string): string | null {
  if (duration === "forever") return null;
  if (duration === "date") return date ? new Date(`${date}T23:59:59`).toISOString() : null;
  const d = new Date();
  if (duration === "1m") d.setMonth(d.getMonth() + 1);
  if (duration === "3m") d.setMonth(d.getMonth() + 3);
  if (duration === "1y") d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, headers: { "content-type": "application/json", ...init?.headers } });
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
  return body;
}

/** Owner-only page: see who has signed up and gift Pro to friends. */
export function AdminView() {
  const status = useAuth((s) => s.status);
  const isAdmin = useAuth((s) => s.isAdmin);

  if (status === "loading") return <div className="min-h-svh" />;
  if (status === "disabled")
    return <Gatekeeper title="Accounts aren't set up yet." body="The admin page needs Supabase. Follow docs/launch.md, then sign in with your admin email." />;
  if (status === "signedOut") return <Gatekeeper title="Sign in to continue." body="The admin page is only for the site owner." signIn />;
  if (!isAdmin) return <Gatekeeper title="Nothing to see here." body="This page is only for the site owner." />;
  return <AdminPanel />;
}

function Gatekeeper({ title, body, signIn }: { title: string; body: string; signIn?: boolean }) {
  return (
    <div className="mx-auto max-w-[620px] px-5 pt-16 pb-24">
      <div className="eyebrow text-ink-3">Admin</div>
      <h1 className="display mt-4 text-[44px] leading-[0.9]">{title}</h1>
      <p className="mt-4 text-[16px] text-ink-2">{body}</p>
      {signIn && (
        <Link href="/login?next=/admin" className="mt-8 inline-flex h-11 items-center rounded-full bg-btn px-5 text-sm font-semibold text-btn-ink">
          Sign in
        </Link>
      )}
    </div>
  );
}

function AdminPanel() {
  const [grants, setGrants] = useState<GrantRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [counts, setCounts] = useState({ total: 0, paying: 0 });
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [duration, setDuration] = useState<Duration>("forever");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const loadGrants = useCallback(async () => {
    const body = await api<{ grants: GrantRow[] }>("/api/admin/grants");
    setGrants(body.grants);
  }, []);

  const loadUsers = useCallback(async (q: string) => {
    const body = await api<{ users: UserRow[]; counts: { total: number; paying: number } }>(`/api/admin/users?q=${encodeURIComponent(q)}`);
    setUsers(body.users);
    setCounts(body.counts);
  }, []);

  useEffect(() => {
    Promise.all([loadGrants(), loadUsers("")])
      .catch((e: Error) => toast({ message: e.message, tone: "error" }))
      .finally(() => setLoading(false));
  }, [loadGrants, loadUsers]);

  useEffect(() => {
    const t = window.setTimeout(() => loadUsers(query).catch(() => {}), 300);
    return () => window.clearTimeout(t);
  }, [query, loadUsers]);

  const grantByEmail = useMemo(() => new Map(grants.map((g) => [g.email, g])), [grants]);
  const activeGrants = grants.filter((g) => isGrantActive(g)).length;

  const save = async () => {
    const clean = normalizeEmail(email);
    if (!isValidEmail(clean)) return toast({ message: "Enter a valid email address.", tone: "error" });
    if (duration === "date" && !date) return toast({ message: "Pick an end date.", tone: "error" });
    setSaving(true);
    try {
      await api("/api/admin/grants", { method: "POST", body: JSON.stringify({ email: clean, expiresAt: expiryFor(duration, date), note }) });
      toast({ message: `${clean} now has Pro${duration === "forever" ? "" : ` until ${fmtDate(expiryFor(duration, date))}`}.`, tone: "success" });
      setEmail("");
      setNote("");
      setDuration("forever");
      setDate("");
      await loadGrants();
    } catch (e) {
      toast({ message: (e as Error).message, tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  const revoke = async (g: GrantRow) => {
    const ok = await confirmAction({
      title: `Remove Pro from ${g.email}?`,
      body: "Their data stays. They drop to the free plan the next time the app checks.",
      confirmLabel: "Remove",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await api("/api/admin/grants", { method: "DELETE", body: JSON.stringify({ email: g.email }) });
      await loadGrants();
    } catch (e) {
      toast({ message: (e as Error).message, tone: "error" });
    }
  };

  const edit = (g: GrantRow) => {
    setEmail(g.email);
    setNote(g.note ?? "");
    if (g.expires_at) {
      setDuration("date");
      setDate(g.expires_at.slice(0, 10));
    } else setDuration("forever");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 pt-8 pb-28 sm:px-8 sm:pt-12">
      <div className="eyebrow flex items-center gap-2 text-ink-3">
        <ShieldCheck size={14} weight="bold" /> Admin
      </div>
      <h1 className="display mt-3 text-[clamp(2.6rem,6vw,4.6rem)] leading-[0.88]">Members</h1>

      <div className="mt-8 grid grid-cols-3 border-y border-line">
        {[
          ["Accounts", counts.total],
          ["Paying Pro", counts.paying],
          ["Gifted Pro", activeGrants],
        ].map(([label, value]) => (
          <div key={label} className="border-line py-5 pr-4 [&:not(:first-child)]:border-l [&:not(:first-child)]:pl-5">
            <div className="eyebrow text-ink-3">{label}</div>
            <div className="mt-3 text-[clamp(1.8rem,3.4vw,2.5rem)] leading-none font-semibold tracking-[-0.03em]">{loading ? "–" : value}</div>
          </div>
        ))}
      </div>

      <Overview />
      <LaunchChecklist />
      <AnnouncementEditor />

      <div className="mt-12 grid gap-12 lg:grid-cols-[400px_1fr]">
        <section className="self-start rounded-[28px] bg-surface p-6 sm:p-7">
          <div className="flex items-center gap-2">
            <Gift size={20} weight="bold" />
            <h2 className="display text-[24px] leading-none">Give Pro</h2>
          </div>
          <p className="mt-2 text-[14px] text-ink-2">Works before they sign up too: Pro switches on when they log in with this email.</p>
          <form
            className="mt-5 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <label className="block">
              <span className="eyebrow mb-2 block text-ink-3">Email</span>
              <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="friend@example.com" required />
            </label>
            <div>
              <span className="eyebrow mb-2 block text-ink-3">For how long</span>
              <Segmented<Duration>
                size="sm"
                ariaLabel="Duration"
                value={duration}
                onChange={setDuration}
                className="flex-wrap"
                options={[
                  { value: "forever", label: "Forever" },
                  { value: "1m", label: "1 mo" },
                  { value: "3m", label: "3 mo" },
                  { value: "1y", label: "1 yr" },
                  { value: "date", label: "Until…" },
                ]}
              />
              {duration === "date" && (
                <TextInput type="date" className="mt-2" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().slice(0, 10)} />
              )}
            </div>
            <label className="block">
              <span className="eyebrow mb-2 block text-ink-3">Note (only you see it)</span>
              <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Study group" maxLength={200} />
            </label>
            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={saving}>
              {saving ? "Saving…" : grantByEmail.has(normalizeEmail(email)) ? "Update gift" : "Give Pro"}
            </Button>
          </form>
        </section>

        <section>
          <h2 className="display text-[24px] leading-none">Gifts</h2>
          {grants.length === 0 ? (
            <p className="mt-4 text-[14px] text-ink-3">{loading ? "Loading…" : "No one yet. Start with your own email to give yourself Pro."}</p>
          ) : (
            <ul className="mt-4 border-t border-line">
              {grants.map((g) => {
                const active = isGrantActive(g);
                return (
                  <li key={g.email} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line py-3.5">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{g.email}</div>
                      <div className="text-[13px] text-ink-3">
                        {g.signed_up_at ? `Signed up ${fmtDate(g.signed_up_at)}` : "Hasn't signed up yet"}
                        {g.note ? ` · ${g.note}` : ""}
                      </div>
                    </div>
                    <span className={cn("rounded-full px-2.5 py-1 text-[12px] font-medium", active ? "bg-ink text-page" : "bg-fill text-ink-3")}>
                      {!active ? `Ended ${fmtDate(g.expires_at)}` : g.expires_at ? `Until ${fmtDate(g.expires_at)}` : "Forever"}
                    </span>
                    <span className="flex gap-0.5">
                      <button
                        type="button"
                        aria-label={`Edit ${g.email}`}
                        onClick={() => edit(g)}
                        className="grid size-8 place-items-center rounded-full text-ink-3 hover:bg-fill hover:text-ink"
                      >
                        <PencilSimple size={15} weight="bold" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${g.email}`}
                        onClick={() => revoke(g)}
                        className="grid size-8 place-items-center rounded-full text-ink-3 hover:bg-fill hover:text-bad"
                      >
                        <Trash size={15} weight="bold" />
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-14 flex flex-wrap items-end justify-between gap-3">
            <h2 className="display text-[24px] leading-none">Accounts</h2>
            <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" icon={<DownloadSimple size={14} weight="bold" />} onClick={() => exportCsv(users)} disabled={!users.length}>
              CSV
            </Button>
            <label className="relative">
              <MagnifyingGlass size={15} weight="bold" className="absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3" />
              <TextInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search email"
                className="h-10 w-[240px] pl-9"
                aria-label="Search accounts"
              />
            </label>
            </div>
          </div>
          <ul className="mt-4 border-t border-line">
            {users.map((u) => {
              const g = u.email ? grantByEmail.get(u.email) : undefined;
              const label = u.plan === "pro" ? `Paying · ${u.plan_interval === "year" ? "yearly" : "monthly"}` : isGrantActive(g) ? "Gifted Pro" : "Free";
              return (
                <li key={u.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line py-3">
                  <button type="button" onClick={() => setOpenId(openId === u.id ? null : u.id)} aria-expanded={openId === u.id} className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-1.5 truncate text-[15px]">
                      {u.email ?? "(no email)"}
                      <CaretDown size={11} weight="bold" className={cn("shrink-0 text-ink-3 transition-transform", openId === u.id && "rotate-180")} />
                    </div>
                    <div className="text-[12.5px] text-ink-3">Joined {fmtDate(u.created_at)}</div>
                  </button>
                  <span className="text-[13px] text-ink-2">{label}</span>
                  {u.email && u.plan !== "pro" && !isGrantActive(g) && (
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<Gift size={14} weight="bold" />}
                      onClick={() => {
                        setEmail(u.email!);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      Give Pro
                    </Button>
                  )}
                  {openId === u.id && (
                    <UserDetail
                      user={u}
                      onDeleted={() => {
                        setOpenId(null);
                        loadUsers(query).catch(() => {});
                      }}
                    />
                  )}
                </li>
              );
            })}
            {!loading && users.length === 0 && <li className="py-4 text-[14px] text-ink-3">No accounts match.</li>}
          </ul>
          <p className="mt-4 text-[13px] text-ink-3">Refunds, invoices and cancellations for paying members are handled in your Stripe dashboard.</p>
        </section>
      </div>
    </div>
  );
}

interface HealthCheck {
  id: string;
  area: string;
  label: string;
  level: "ok" | "warn" | "fail";
  detail: string;
}

const LEVEL_ICON = {
  ok: <CheckCircle size={18} weight="fill" className="shrink-0 text-good" />,
  warn: <WarningCircle size={18} weight="fill" className="shrink-0 text-[oklch(0.75_0.14_75)]" />,
  fail: <XCircle size={18} weight="fill" className="shrink-0 text-bad" />,
};

/** What's ready for launch and what still needs setting up. Collapsed once everything is green. */
function LaunchChecklist() {
  const [checks, setChecks] = useState<HealthCheck[] | null>(null);
  const [open, setOpen] = useState<boolean | null>(null);
  useEffect(() => {
    api<{ checks: HealthCheck[] }>("/api/admin/health")
      .then((b) => setChecks(b.checks))
      .catch(() => setChecks([]));
  }, []);
  if (!checks?.length) return null;
  const todo = checks.filter((c) => c.level !== "ok").length;
  const expanded = open ?? todo > 0;
  const areas = [...new Set(checks.map((c) => c.area))];
  return (
    <section className="mt-10 rounded-[28px] bg-surface p-6 sm:p-7">
      <button type="button" onClick={() => setOpen(!expanded)} aria-expanded={expanded} className="flex w-full items-center justify-between gap-4 text-left">
        <div>
          <h2 className="display text-[24px] leading-none">Launch checklist</h2>
          <p className="mt-1.5 text-[14px] text-ink-3">{todo ? `${todo} thing${todo === 1 ? "" : "s"} left to set up.` : "Everything is set up."}</p>
        </div>
        <CaretDown size={16} weight="bold" className={cn("shrink-0 text-ink-3 transition-transform", expanded && "rotate-180")} />
      </button>
      {expanded && (
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          {areas.map((area) => (
            <div key={area}>
              <div className="eyebrow text-ink-3">{area}</div>
              <ul className="mt-2 divide-y divide-line border-y border-line">
                {checks
                  .filter((c) => c.area === area)
                  .map((c) => (
                    <li key={c.id} className="flex gap-3 py-3">
                      {LEVEL_ICON[c.level]}
                      <div className="min-w-0">
                        <div className="text-[14.5px] font-medium">{c.label}</div>
                        <div className="text-[13px] leading-snug break-words text-ink-3">{c.detail}</div>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function exportCsv(users: UserRow[]) {
  const cell = (v: string | null) => `"${(v ?? "").replace(/"/g, '""')}"`;
  const rows = [["email", "plan", "interval", "status", "joined"], ...users.map((u) => [u.email, u.plan, u.plan_interval, u.plan_status, u.created_at])];
  const url = URL.createObjectURL(new Blob([rows.map((r) => r.map(cell).join(",")).join("\n")], { type: "text/csv" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `steen-accounts-${new Date().toISOString().slice(0, 10)}.csv` });
  a.click();
  URL.revokeObjectURL(url);
}

interface Stats {
  signups7: number;
  signups30: number;
  active1: number;
  active7: number;
  active30: number;
  sessions7: number;
  focusHours7: number;
  monthly: number;
  yearly: number;
  mrr: number;
  signupsByDay: { day: string; n: number }[];
}

/** Growth, activity and revenue at a glance. Active means at least one focus session in the period. */
function Overview() {
  const [s, setS] = useState<Stats | null>(null);
  useEffect(() => {
    api<Stats>("/api/admin/stats").then(setS, () => {});
  }, []);
  if (!s) return null;

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86_400_000).toISOString().slice(0, 10);
    return { day: d, n: s.signupsByDay.find((x) => x.day === d)?.n ?? 0 };
  });
  const max = Math.max(1, ...days.map((d) => d.n));
  const cells: [string, string | number, string][] = [
    ["Active today", s.active1, `${s.active7} this week, ${s.active30} this month`],
    ["Sessions, 7 days", s.sessions7, `${s.focusHours7} hours of focus`],
    ["New accounts", s.signups7, `this week, ${s.signups30} in 30 days`],
    ["MRR", `$${s.mrr.toFixed(2)}`, `${s.monthly} monthly, ${s.yearly} yearly`],
  ];
  return (
    <section className="mt-10 grid gap-6 rounded-[28px] bg-surface p-6 sm:p-7 lg:grid-cols-[1.4fr_1fr] lg:items-end">
      <div className="grid grid-cols-2 gap-x-6 gap-y-6">
        {cells.map(([label, value, sub]) => (
          <div key={label}>
            <div className="eyebrow text-ink-3">{label}</div>
            <div className="mt-2.5 text-[clamp(1.6rem,3vw,2.2rem)] leading-none font-semibold tracking-[-0.03em] tabular-nums">{value}</div>
            <div className="mt-1.5 text-[12.5px] text-ink-3">{sub}</div>
          </div>
        ))}
      </div>
      <div>
        <div className="eyebrow mb-3 text-ink-3">Sign-ups, last 30 days</div>
        <div className="flex h-28 items-end gap-[3px]">
          {days.map((d) => (
            <div
              key={d.day}
              title={`${fmtDate(d.day)}: ${d.n}`}
              className="flex-1 rounded-t-[3px] bg-ink/70"
              style={{ height: `${Math.max(3, (d.n / max) * 100)}%`, opacity: d.n ? 1 : 0.2 }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface Detail {
  lastSignInAt: string | null;
  confirmedAt: string | null;
  providers: string[];
  usage: { sessions: number; focusHours: number; lastSession: number | null };
}

function UserDetail({ user, onDeleted }: { user: UserRow; onDeleted: () => void }) {
  const [d, setD] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api<Detail>(`/api/admin/users/${user.id}`).then(setD, (e: Error) => setError(e.message));
  }, [user.id]);

  const remove = async () => {
    const ok = await confirmAction({
      title: `Delete ${user.email ?? "this account"}?`,
      body: "Their account, sessions, tasks and settings are deleted for good. This can't be undone.",
      confirmLabel: "Delete account",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await api(`/api/admin/users/${user.id}`, { method: "DELETE" });
      toast({ message: `${user.email ?? "Account"} deleted.`, tone: "success" });
      onDeleted();
    } catch (e) {
      toast({ message: (e as Error).message, tone: "error" });
    }
  };

  const rows: [string, string][] = d
    ? [
        ["Signs in with", d.providers.join(", ") || "email"],
        ["Last sign-in", d.lastSignInAt ? new Date(d.lastSignInAt).toLocaleString() : "never"],
        ["Focus sessions", `${d.usage.sessions} · ${d.usage.focusHours} h`],
        ["Last session", d.usage.lastSession ? new Date(Number(d.usage.lastSession)).toLocaleString() : "none yet"],
        ...(user.current_period_end ? [["Renews or ends", fmtDate(user.current_period_end)] as [string, string]] : []),
      ]
    : [];
  return (
    <div className="mt-2 mb-1 basis-full rounded-[18px] bg-fill p-4">
      {error ? (
        <p className="text-[13px] text-bad">{error}</p>
      ) : !d ? (
        <p className="text-[13px] text-ink-3">Loading…</p>
      ) : (
        <dl className="grid gap-x-6 gap-y-2 text-[13.5px] sm:grid-cols-2">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 sm:block">
              <dt className="text-ink-3">{k}</dt>
              <dd className="sm:mt-0.5">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="mt-4 flex justify-end">
        <Button size="sm" variant="outline" icon={<Trash size={14} weight="bold" />} onClick={remove}>
          Delete account
        </Button>
      </div>
    </div>
  );
}

/** One message shown to everyone in the app until they close it. */
function AnnouncementEditor() {
  const [message, setMessage] = useState("");
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api<{ message: string; active: boolean }>("/api/admin/announcement").then((a) => {
      setMessage(a.message);
      setActive(a.active);
    }, () => {});
  }, []);

  const save = async (nextActive: boolean) => {
    setBusy(true);
    try {
      await api("/api/admin/announcement", { method: "POST", body: JSON.stringify({ message, active: nextActive }) });
      setActive(nextActive);
      toast({ message: nextActive ? "Announcement is live." : "Announcement hidden.", tone: "success" });
    } catch (e) {
      toast({ message: (e as Error).message, tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-6 rounded-[28px] bg-surface p-6 sm:p-7">
      <div className="flex items-center gap-2">
        <Megaphone size={20} weight="bold" />
        <h2 className="display text-[24px] leading-none">Announcement</h2>
        <span className={cn("ml-auto rounded-full px-2.5 py-1 text-[12px] font-medium", active ? "bg-good/15 text-good" : "bg-fill text-ink-3")}>
          {active ? "Live" : "Off"}
        </span>
      </div>
      <p className="mt-2 text-[13.5px] text-ink-3">A short note at the top of the app for every member, until they close it. Saving a new text shows it again to everyone.</p>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={280}
        rows={2}
        placeholder="New: log distractions after each session and see them in Insights."
        className="mt-4 w-full resize-none bg-fill px-4 py-3 text-[14.5px] ring-1 ring-line outline-none"
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => save(true)} disabled={busy || !message.trim()}>
          {active ? "Update" : "Publish"}
        </Button>
        {active && (
          <Button size="sm" variant="outline" onClick={() => save(false)} disabled={busy}>
            Hide
          </Button>
        )}
        <span className="ml-auto text-[12px] text-ink-3 tabular-nums">{message.length}/280</span>
      </div>
    </section>
  );
}
