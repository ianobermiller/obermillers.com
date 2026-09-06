#!/usr/bin/env node

import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { ensureLocalPocketBase, LOCAL_PB_URL } from "./localPocketbase.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const viteBin = join(root, "node_modules/vite/bin/vite.js");

const pocketBase = await ensureLocalPocketBase();
const vite = spawn(process.execPath, [viteBin], {
  cwd: root,
  env: { ...process.env, VITE_POCKETBASE_URL: LOCAL_PB_URL },
  stdio: "inherit",
});

function shutdown() {
  vite.kill("SIGTERM");
  pocketBase.stop();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

vite.on("exit", (code) => {
  pocketBase.stop();
  process.exit(code ?? 0);
});
