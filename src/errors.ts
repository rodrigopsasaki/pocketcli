/**
 * Typed error for user-facing CLI failures.
 *
 * Commands throw this instead of calling `console.error` + `process.exit` directly.
 * The entry point catches it, prints `prefix: message` to stderr, and exits with
 * the specified code. Anything else bubbles up as an unhandled exception (which
 * is what we want — it means a bug, not a user error).
 */
export class CliError extends Error {
  readonly prefix: string;
  readonly exitCode: number;

  constructor(prefix: string, message: string, exitCode = 1) {
    super(message);
    this.name = "CliError";
    this.prefix = prefix;
    this.exitCode = exitCode;
  }
}
