import { describe, it, expect } from "vitest";
import { execFileSync } from "child_process";
import { join } from "path";

const BIN = join(import.meta.dirname, "..", "..", "dist", "runic.cjs");

/**
 * End-to-end against the built binary. Output is host-dependent (bash version on
 * the CI runner is not the same as on a laptop), so we assert shape, not content.
 *
 * Runs `runic runtimes` and expects:
 * - heading present
 * - every supported extension listed
 * - bash must report as installed (no runic host lacks bash)
 * - explanation about shebang fallback present
 */
describe("runic runtimes", () => {
  const output = execFileSync("node", [BIN, "runtimes"], {
    encoding: "utf8",
    env: { ...process.env, FORCE_COLOR: "0" }, // strip ANSI for stable matching
    timeout: 15000,
  });

  it("prints the runic runtimes heading", () => {
    expect(output).toContain("runic runtimes");
  });

  it.each([
    { ext: ".sh" },
    { ext: ".bash" },
    { ext: ".zsh" },
    { ext: ".py" },
    { ext: ".rb" },
    { ext: ".js" },
    { ext: ".ts" },
    { ext: ".php" },
    { ext: ".pl" },
  ])("mentions $ext", ({ ext }) => {
    expect(output).toContain(ext);
  });

  it("reports bash as installed (it must be — runic itself uses it)", () => {
    expect(output).toMatch(/✓\s+bash/);
  });

  it("explains shebang fallback for extensionless files", () => {
    expect(output).toContain("shebang");
  });
});
