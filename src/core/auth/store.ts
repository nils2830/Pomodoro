"use client";

import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import type { Plan } from "../billing/plans";
import type { ProGrant } from "../billing/grants";

export interface Profile {
  id: string;
  email: string | null;
  plan: Plan;
  plan_interval: "month" | "year" | null;
  plan_status: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
}

export type AuthStatus = "disabled" | "loading" | "signedOut" | "signedIn";

interface AuthState {
  status: AuthStatus;
  user: User | null;
  profile: Profile | null;
  /** Pro gifted by the admin, if any. */
  grant: ProGrant | null;
  isAdmin: boolean;
  set(patch: Partial<Omit<AuthState, "set">>): void;
}

export const useAuth = create<AuthState>()((set) => ({
  status: "loading",
  user: null,
  profile: null,
  grant: null,
  isAdmin: false,
  set: (patch) => set(patch),
}));
