import { generateZshFunction } from "../shell/templates/zsh.js";
import { generateBashFunction } from "../shell/templates/bash.js";
import { generateFishFunction } from "../shell/templates/fish.js";
import { CliError } from "../errors.js";

const SUPPORTED_SHELLS = ["zsh", "bash", "fish"] as const;
type Shell = (typeof SUPPORTED_SHELLS)[number];

interface InitOptions {
  readonly shell: string;
  readonly name: string;
  readonly dirs: readonly string[];
}

const GENERATORS: Readonly<Record<Shell, (opts: { name: string; dirs: readonly string[] }) => string>> = {
  zsh: generateZshFunction,
  bash: generateBashFunction,
  fish: generateFishFunction,
};

/**
 * Generate a shell function that turns script directories into a CLI.
 * Outputs the function to stdout for use with `eval "$(pocket init ...)"`.
 */
export function init(options: InitOptions): void {
  const { shell, name, dirs } = options;

  if (!shell) {
    throw new CliError("pocket init", "shell argument is required (zsh, bash, or fish)");
  }

  if (!name) {
    throw new CliError("pocket init", "--name is required");
  }

  if (dirs.length === 0) {
    throw new CliError("pocket init", "at least one --dir is required");
  }

  if (!isSupportedShell(shell)) {
    throw new CliError("pocket init", `unsupported shell "${shell}". Use ${SUPPORTED_SHELLS.join(", ")}.`);
  }

  process.stdout.write(GENERATORS[shell]({ name, dirs }));
}

function isSupportedShell(shell: string): shell is Shell {
  return SUPPORTED_SHELLS.includes(shell as Shell);
}
