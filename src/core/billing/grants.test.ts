import { describe, expect, it } from "vitest";
import { isGrantActive, isValidEmail, normalizeEmail } from "./grants";

describe("grants", () => {
  const now = new Date(2026, 9, 21).getTime();

  it("treats a missing expiry as forever", () => {
    expect(isGrantActive({ expires_at: null }, now)).toBe(true);
  });

  it("respects end dates", () => {
    expect(isGrantActive({ expires_at: new Date(2026, 9, 22).toISOString() }, now)).toBe(true);
    expect(isGrantActive({ expires_at: new Date(2026, 9, 20).toISOString() }, now)).toBe(false);
    expect(isGrantActive(null, now)).toBe(false);
  });

  it("normalises and validates emails", () => {
    expect(normalizeEmail("  Friend@Example.COM ")).toBe("friend@example.com");
    expect(isValidEmail("friend@example.com")).toBe(true);
    expect(isValidEmail("not an email")).toBe(false);
  });
});
