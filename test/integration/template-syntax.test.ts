import { describe, it, expect } from "vitest";
import { execFileSync } from "child_process";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { randomBytes } from "crypto";
import { generateZshFunction } from "../../src/shell/templates/zsh.js";
import { generateBashFunction } from "../../src/shell/templates/bash.js";
import { generateFishFunction } from "../../src/shell/templates/fish.js";

const TEMP_DIR = join(tmpdir(), "pocket-syntax-test");

interface SyntaxCheckResult {
  ok: boolean;
  stderr: string;
}

function writeTempScript(content: string, extension: string): string {
  mkdirSync(TEMP_DIR, { recursive: true });
  const path = join(TEMP_DIR, `${randomBytes(4).toString("hex")}.${extension}`);
  writeFileSync(path, content);
  return path;
}

function syntaxCheck(binary: string, flags: readonly string[], path: string): SyntaxCheckResult {
  try {
    execFileSync(binary, [...flags, path], { stdio: "pipe", timeout: 5000 });
    return { ok: true, stderr: "" };
  } catch (err) {
    const execErr = err as { stderr?: Buffer; code?: string };
    if (execErr.code === "ENOENT") {
      return { ok: false, stderr: `${binary} not available on PATH (skipping)` };
    }
    return { ok: false, stderr: execErr.stderr?.toString() ?? "unknown error" };
  }
}

/**
 * Catches shell-template escape bugs at build time rather than at runtime
 * in a user's terminal. Each shell's `-n` flag parses without executing.
 */
describe("generated shell function syntax", () => {
  const inputs = [
    { name: "simple", dirs: ["/tmp/scripts"] },
    { name: "myapp", dirs: ["/a", "/b", "/c"] },
    { name: "ops_tool", dirs: ["/path with spaces/scripts"] },
  ];

  it.each(inputs)("zsh output is syntactically valid ($name)", ({ name, dirs }) => {
    const code = generateZshFunction({ name, dirs });
    const path = writeTempScript(code, "zsh");

    const result = syntaxCheck("zsh", ["-n"], path);

    rmSync(path, { force: true });
    expect(result.ok || result.stderr.includes("skipping"), result.stderr).toBe(true);
  });

  it.each(inputs)("bash output is syntactically valid ($name)", ({ name, dirs }) => {
    const code = generateBashFunction({ name, dirs });
    const path = writeTempScript(code, "bash");

    const result = syntaxCheck("bash", ["-n"], path);

    rmSync(path, { force: true });
    expect(result.ok || result.stderr.includes("skipping"), result.stderr).toBe(true);
  });

  it.each(inputs)("fish output is syntactically valid ($name)", ({ name, dirs }) => {
    const code = generateFishFunction({ name, dirs });
    const path = writeTempScript(code, "fish");

    const result = syntaxCheck("fish", ["-n"], path);

    rmSync(path, { force: true });
    // Fish may not be installed on all systems; skip gracefully if so
    expect(result.ok || result.stderr.includes("skipping"), result.stderr).toBe(true);
  });

  it("zsh template contains POCKET_* env vars, not RC_*", () => {
    const code = generateZshFunction({ name: "t", dirs: ["/tmp"] });
    expect(code).toContain("POCKET_COMMAND=");
    expect(code).toContain("POCKET_CLI_NAME=");
    expect(code).not.toContain("RC_COMMAND");
    expect(code).not.toContain("RC_CLI_NAME");
  });

  it("bash template contains POCKET_* env vars, not RC_*", () => {
    const code = generateBashFunction({ name: "t", dirs: ["/tmp"] });
    expect(code).toContain("POCKET_COMMAND=");
    expect(code).toContain("POCKET_CLI_NAME=");
    expect(code).not.toContain("RC_COMMAND");
    expect(code).not.toContain("RC_CLI_NAME");
  });

  it("fish template contains POCKET_* env vars, not RC_*", () => {
    const code = generateFishFunction({ name: "t", dirs: ["/tmp"] });
    expect(code).toContain("POCKET_COMMAND");
    expect(code).toContain("POCKET_CLI_NAME");
    expect(code).not.toContain("RC_COMMAND");
    expect(code).not.toContain("RC_CLI_NAME");
  });
});

// Clean up the temp dir after all tests
process.on("exit", () => {
  if (existsSync(TEMP_DIR)) {
    rmSync(TEMP_DIR, { recursive: true, force: true });
  }
});
