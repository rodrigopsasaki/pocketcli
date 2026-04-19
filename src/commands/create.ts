import { existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname, extname } from "path";
import { CliError } from "../errors.js";

const SHEBANG_MAP: Readonly<Record<string, string>> = {
  sh: "#!/bin/bash",
  bash: "#!/bin/bash",
  zsh: "#!/bin/zsh",
  py: "#!/usr/bin/env python3",
  rb: "#!/usr/bin/env ruby",
  js: "#!/usr/bin/env node",
  ts: "#!/usr/bin/env -S npx tsx",
  php: "#!/usr/bin/env php",
  pl: "#!/usr/bin/env perl",
};

const COMMENT_MAP: Readonly<Record<string, string>> = {
  sh: "#",
  bash: "#",
  zsh: "#",
  py: "#",
  rb: "#",
  js: "//",
  ts: "//",
  php: "//",
  pl: "#",
};

/**
 * Scaffold a new script file with the appropriate shebang and a description placeholder.
 */
export function create(path: string): void {
  if (existsSync(path)) {
    throw new CliError("pocket create", `file already exists: ${path}`);
  }

  const ext = extname(path).slice(1) || "sh";
  const shebang = SHEBANG_MAP[ext] ?? "#!/bin/bash";
  const commentPrefix = COMMENT_MAP[ext] ?? "#";

  const content = `${shebang}\n${commentPrefix} TODO: describe what this script does\n\n`;

  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(path, content, { mode: 0o755 });
  console.log(`Created: ${path}`);
}
