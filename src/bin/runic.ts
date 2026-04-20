import { parseArgv, getFlag, getFlagAll } from "../utils/argv.js";
import { init } from "../commands/init.js";
import { help } from "../commands/help.js";
import { doctor } from "../commands/doctor.js";
import { completions } from "../commands/completions.js";
import { create } from "../commands/create.js";
import { runtimes } from "../commands/runtimes.js";
import { CliError } from "../errors.js";

const USAGE = `
  runic — Turn any script folder into a CLI

  Usage:
    runic init <shell> --name <name> --dir <dir> [--dir <dir>...]
    runic help --name <name> --dir <dir>
    runic doctor --dir <dir>
    runic runtimes
    runic completions <shell> --name <name> --dir <dir>
    runic create <path>

  Setup:
    eval "$(runic init zsh --name myapp --dir ./scripts)"

  https://github.com/rodrigopsasaki/runic
`;

function main(): void {
  const parsed = parseArgv(process.argv);

  switch (parsed.command) {
    case "init": {
      const shell = parsed.positionals[0] ?? "";
      const name = getFlag(parsed.flags, "name") ?? "";
      const dirs = getFlagAll(parsed.flags, "dir");
      init({ shell, name, dirs });
      break;
    }

    case "help": {
      const name = getFlag(parsed.flags, "name") ?? "runic";
      const dirs = getFlagAll(parsed.flags, "dir");
      help({ name, dirs });
      break;
    }

    case "doctor": {
      const dirs = getFlagAll(parsed.flags, "dir");
      doctor({ dirs });
      break;
    }

    case "completions": {
      const shell = parsed.positionals[0] ?? "";
      const name = getFlag(parsed.flags, "name") ?? "runic";
      const dirs = getFlagAll(parsed.flags, "dir");
      completions({ shell, name, dirs });
      break;
    }

    case "create": {
      const path = parsed.positionals[0];
      if (!path) {
        throw new CliError("runic create", "path argument is required (usage: runic create <path>)");
      }
      create(path);
      break;
    }

    case "runtimes": {
      runtimes();
      break;
    }

    default:
      console.log(USAGE);
      break;
  }
}

try {
  main();
} catch (err) {
  if (err instanceof CliError) {
    console.error(`${err.prefix}: ${err.message}`);
    process.exit(err.exitCode);
  }
  throw err;
}
