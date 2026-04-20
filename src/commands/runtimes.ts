import { execFileSync } from "child_process";
import * as fmt from "../utils/format.js";

interface RuntimeProbe {
  /** Display name (the binary). */
  readonly name: string;
  /** File extensions this runtime serves. */
  readonly extensions: readonly string[];
  /** Args to invoke for a version probe. */
  readonly versionArgs: readonly string[];
  /** Optional note shown next to the extensions (e.g. "via npx"). */
  readonly note?: string;
}

/**
 * One probe per unique runner. Order matches the typical extension probe order
 * so the output reads predictably.
 */
const PROBES: readonly RuntimeProbe[] = [
  { name: "bash", extensions: [".sh", ".bash"], versionArgs: ["--version"] },
  { name: "zsh", extensions: [".zsh"], versionArgs: ["--version"] },
  { name: "python3", extensions: [".py"], versionArgs: ["--version"] },
  { name: "ruby", extensions: [".rb"], versionArgs: ["--version"] },
  { name: "node", extensions: [".js"], versionArgs: ["--version"] },
  { name: "tsx", extensions: [".ts"], versionArgs: ["--version"], note: "via npx tsx" },
  { name: "php", extensions: [".php"], versionArgs: ["--version"] },
  { name: "perl", extensions: [".pl"], versionArgs: ["--version"] },
];

/**
 * Print which of runic's supported runtimes are installed on this host
 * and at which version. Useful before you start writing scripts: you can
 * see what languages you can reach for without surprises later.
 */
export function runtimes(): void {
  const probes = PROBES.map(probe);
  const nameWidth = Math.max(...probes.map((p) => p.name.length));
  const versionWidth = Math.max(...probes.map((p) => p.display.length));

  console.log("");
  console.log(`  ${fmt.heading("runic runtimes")}\n`);

  for (const p of probes) {
    const mark = p.installed ? fmt.success("✓") : fmt.dim("✗");
    const name = p.installed ? p.name.padEnd(nameWidth) : fmt.dim(p.name.padEnd(nameWidth));
    const display = p.installed ? p.display : fmt.dim(p.display);
    const exts = fmt.dim(`(${p.extensions.join(", ")}${p.note ? ` — ${p.note}` : ""})`);
    console.log(`  ${mark} ${name}  ${display.padEnd(versionWidth)}  ${exts}`);
  }

  console.log("");
  console.log(fmt.dim("  Extensionless files dispatch via their shebang line — any interpreter on PATH works."));
  console.log("");
}

interface ProbeResult {
  readonly name: string;
  readonly extensions: readonly string[];
  readonly note: string | undefined;
  readonly installed: boolean;
  readonly display: string;
}

function probe(p: RuntimeProbe): ProbeResult {
  const base = { name: p.name, extensions: p.extensions, note: p.note };

  // npx is always available with node, but tsx may need on-demand fetch.
  // Probe `tsx --version` directly; if not on PATH, report as on-demand.
  if (p.name === "tsx") {
    const direct = tryVersion("tsx", p.versionArgs);
    if (direct) {
      return { ...base, installed: true, display: direct };
    }
    if (commandExists("npx")) {
      return { ...base, installed: true, display: "fetched on first use" };
    }
    return { ...base, installed: false, display: "not installed" };
  }

  if (!commandExists(p.name)) {
    return { ...base, installed: false, display: "not installed" };
  }

  const version = tryVersion(p.name, p.versionArgs) ?? "installed";
  return { ...base, installed: true, display: version };
}

/** True if the command is on PATH. */
function commandExists(command: string): boolean {
  try {
    execFileSync("which", [command], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/** Run `<command> <args>`, return a short version string, or undefined if it failed. */
function tryVersion(command: string, args: readonly string[]): string | undefined {
  try {
    const raw = execFileSync(command, [...args], {
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 3000,
      encoding: "utf8",
    });
    return formatVersion(raw);
  } catch {
    return undefined;
  }
}

/** Pull a sensible version string out of `<runner> --version` output. */
function formatVersion(raw: string): string {
  const firstNonEmpty = raw.split("\n").find((l) => l.trim()) ?? "";
  const dotted = firstNonEmpty.match(/\d+\.\d+(?:\.\d+)?/);
  if (dotted) return dotted[0];
  // Node prints "v20.10.0" with no other text — already caught above.
  // Fallback: trimmed first line, capped at 50 chars.
  return firstNonEmpty.trim().slice(0, 50);
}
