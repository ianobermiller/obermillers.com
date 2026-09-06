import { execFileSync } from "node:child_process";
import { chmodSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

if (process.env["CI"] === "true") {
  process.exit(0);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

try {
  execFileSync("git", ["rev-parse", "--is-inside-work-tree"], {
    cwd: root,
    stdio: "ignore",
  });
} catch {
  process.exit(0);
}

try {
  execFileSync("git", ["config", "core.hooksPath", ".githooks"], { cwd: root });
} catch {
  console.warn("Could not set core.hooksPath; git hooks are in .githooks/");
}

for (const hook of ["pre-commit", "pre-push"]) {
  chmodSync(join(root, ".githooks", hook), 0o755);
}
