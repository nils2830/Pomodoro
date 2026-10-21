"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Gift, MagnifyingGlass, PencilSimple, ShieldCheck, Trash } from "@phosphor-icons/react";
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
          <ul className="mt-4 border-t border-line">
            {users.map((u) => {
              const g = u.email ? grantByEmail.get(u.email) : undefined;
              const label = u.plan === "pro" ? `Paying · ${u.plan_interval === "year" ? "yearly" : "monthly"}` : isGrantActive(g) ? "Gifted Pro" : "Free";
              return (
                <li key={u.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line py-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px]">{u.email ?? "(no email)"}</div>
                    <div className="text-[12.5px] text-ink-3">Joined {fmtDate(u.created_at)}</div>
                  </div>
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
