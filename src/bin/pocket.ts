import { parseArgv, getFlag, getFlagAll } from "../utils/argv.js";
import { init } from "../commands/init.js";
import { help } from "../commands/help.js";
import { doctor } from "../commands/doctor.js";
import { completions } from "../commands/completions.js";
import { create } from "../commands/create.js";
import { CliError } from "../errors.js";

const USAGE = `
  pocket — Turn any script folder into a CLI

  Usage:
    pocket init <shell> --name <name> --dir <dir> [--dir <dir>...]
    pocket help --name <name> --dir <dir>
    pocket doctor --dir <dir>
    pocket completions <shell> --name <name> --dir <dir>
    pocket create <path>

  Setup:
    eval "$(pocket init zsh --name myapp --dir ./scripts)"

  https://github.com/rodrigopsasaki/pocketcli
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
      const name = getFlag(parsed.flags, "name") ?? "pocket";
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
      const name = getFlag(parsed.flags, "name") ?? "pocket";
      const dirs = getFlagAll(parsed.flags, "dir");
      completions({ shell, name, dirs });
      break;
    }

    case "create": {
      const path = parsed.positionals[0];
      if (!path) {
        throw new CliError("pocket create", "path argument is required (usage: pocket create <path>)");
      }
      create(path);
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
