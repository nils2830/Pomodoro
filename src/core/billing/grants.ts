/** A gift of Pro from the site admin. Null expiry means forever. */
export interface ProGrant {
  email: string;
  expires_at: string | null;
  note: string | null;
  granted_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export function isGrantActive(grant: Pick<ProGrant, "expires_at"> | null | undefined, now = Date.now()): boolean {
  if (!grant) return false;
  return grant.expires_at == null || new Date(grant.expires_at).getTime() > now;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
