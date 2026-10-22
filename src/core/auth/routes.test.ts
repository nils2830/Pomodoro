import { describe, expect, it } from "vitest";
import { safeNext } from "./routes";

const ORIGIN = "https://steen.app";
// Next turns a same-host redirect into a relative Location, so a "//" path would leave the site too.
const staysOnSite = (next: string) => {
  const url = new URL(next, ORIGIN);
  return url.origin === ORIGIN && !url.pathname.startsWith("//") && !next.startsWith("//");
};

describe("safeNext", () => {
  it("keeps same-site paths", () => {
    expect(safeNext("/")).toBe("/");
    expect(safeNext("/insights?x=1")).toBe("/insights?x=1");
  });

  it("rejects protocol-relative and backslash paths", () => {
    expect(safeNext("//evil.com")).toBe("/");
    expect(safeNext("/\\evil.com")).toBe("/");
  });

  it("leaves a percent-encoded backslash as a harmless same-site path", () => {
    const next = safeNext("/%5Cevil.com");
    expect(next).toBe("/%5Cevil.com");
    expect(staysOnSite(next)).toBe(true);
  });

  it("rejects paths with tabs or newlines that browsers would strip", () => {
    expect(safeNext("/\t/evil.com")).toBe("/");
    expect(safeNext("/\n/evil.com")).toBe("/");
    expect(safeNext("/\r/evil.com")).toBe("/");
    expect(safeNext("/\u0000/evil.com")).toBe("/");
    expect(safeNext("/\u007f/evil.com")).toBe("/");
  });

  it("rejects dot segments that normalize to a protocol-relative path", () => {
    expect(safeNext("/..//evil.com")).toBe("/");
    expect(safeNext("/.//evil.com")).toBe("/");
    expect(safeNext("/%2e%2e//evil.com")).toBe("/");
    expect(safeNext("/.%2e//evil.com")).toBe("/");
    expect(safeNext("/a/..//evil.com")).toBe("/");
  });

  it("returns the normalized path", () => {
    expect(safeNext("/a/../insights#week")).toBe("/insights#week");
  });

  it("rejects absolute and script URLs", () => {
    expect(safeNext("https://evil.com")).toBe("/");
    expect(safeNext("javascript:alert(1)")).toBe("/");
  });

  it("falls back on missing values", () => {
    expect(safeNext(null)).toBe("/");
    expect(safeNext(undefined)).toBe("/");
    expect(safeNext("")).toBe("/");
    expect(safeNext(null, "/settings")).toBe("/settings");
  });

  it("never resolves off-site", () => {
    const inputs = [
      "/",
      "/insights?x=1",
      "//evil.com",
      "/\\evil.com",
      "/%5Cevil.com",
      "/\t/evil.com",
      "/\n/evil.com",
      "/..//evil.com",
      "/.//evil.com",
      "/%2e%2e//evil.com",
      "/.%2e//evil.com",
      "/a/..//evil.com",
      "https://evil.com",
      "javascript:alert(1)",
    ];
    for (const input of inputs) expect(staysOnSite(safeNext(input))).toBe(true);
  });
});
