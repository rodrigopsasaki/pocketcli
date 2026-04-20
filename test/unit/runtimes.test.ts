import { describe, it, expect } from "vitest";

/**
 * The version formatter is the interesting pure logic in src/commands/runtimes.ts —
 * the rest is shelling out to each runner. Re-declaring the function here (mirror of
 * the private helper) lets us test the regex behaviour without exposing it.
 *
 * If the regex ever changes in runtimes.ts, this mirror must change too — if they
 * drift, the README's example output will lie about what you'll actually see.
 */
function formatVersion(raw: string): string {
  const firstNonEmpty = raw.split("\n").find((l) => l.trim()) ?? "";
  const dotted = firstNonEmpty.match(/\d+\.\d+(?:\.\d+)?/);
  if (dotted) return dotted[0];
  return firstNonEmpty.trim().slice(0, 50);
}

describe("runtimes formatVersion", () => {
  it.each([
    { raw: "GNU bash, version 5.2.37(1)-release (arm64-apple-darwin23)", expected: "5.2.37" },
    { raw: "zsh 5.9 (arm-apple-darwin23.0)", expected: "5.9" },
    { raw: "Python 3.12.5", expected: "3.12.5" },
    { raw: "ruby 3.3.0p0 (2023-12-25 revision 5124f9ac75)", expected: "3.3.0" },
    { raw: "v20.10.0\n", expected: "20.10.0" },
    { raw: "PHP 8.3.0 (cli) (built: Nov 21 2023 10:00:00)", expected: "8.3.0" },
    { raw: "\nThis is perl 5, version 38, subversion 0 (v5.38.0) built for darwin", expected: "5.38.0" },
    { raw: "4.19.2", expected: "4.19.2" },
  ])("should extract $expected from $raw", ({ raw, expected }) => {
    expect(formatVersion(raw)).toBe(expected);
  });

  it("should fall back to first non-empty line when no version is present", () => {
    const raw = "no version info here\nignored line";

    const actual = formatVersion(raw);

    expect(actual).toBe("no version info here");
  });

  it("should handle empty output", () => {
    expect(formatVersion("")).toBe("");
  });

  it("should cap fallback strings at 50 characters", () => {
    const raw = "x".repeat(100);

    const actual = formatVersion(raw);

    expect(actual.length).toBe(50);
  });
});
