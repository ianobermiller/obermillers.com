import { spawn } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import PocketBase from "pocketbase";

const collections = {
  accounts: "familybank_accounts",
  presets: "familybank_presets",
  transactions: "familybank_transactions",
};

export const LOCAL_PB_URL = "http://127.0.0.1:8090";
export const LOCAL_ADMIN_EMAIL = "admin@local.test";
export const LOCAL_ADMIN_PASSWORD = "familybank-local";
export const LOCAL_PARENT_EMAIL = "parent@example.com";
export const LOCAL_KID_EMAIL = "kid@example.com";
export const LOCAL_USER_PASSWORD = "familybank";

const FAMILY_BANK_ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const SOURCE_FILES = ["main.go", "passkey.go", "go.mod", "go.sum"];

function pocketBaseDir() {
  return process.env.POCKETBASE_DIR ?? join(FAMILY_BANK_ROOT, "pocketbase");
}

export function isLocalPocketBaseUrl(url) {
  if (!url) {
    return false;
  }
  try {
    const { hostname } = new URL(url);
    return hostname === "127.0.0.1" || hostname === "localhost";
  } catch {
    return false;
  }
}

function localAdminEnv(url = LOCAL_PB_URL) {
  return {
    POCKETBASE_ADMIN_EMAIL: LOCAL_ADMIN_EMAIL,
    POCKETBASE_ADMIN_PASSWORD: LOCAL_ADMIN_PASSWORD,
    POCKETBASE_URL: url,
    VITE_POCKETBASE_URL: url,
  };
}

function makePath() {
  const brewMake = "/opt/homebrew/bin/make";
  return existsSync(brewMake) ? brewMake : "make";
}

function run(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
      }
    });
  });
}

function needsBuild(dir, binary) {
  if (!existsSync(binary)) {
    return true;
  }
  const builtAt = statSync(binary).mtimeMs;
  return SOURCE_FILES.some((file) => {
    const path = join(dir, file);
    return existsSync(path) && statSync(path).mtimeMs > builtAt;
  });
}

async function isPocketBaseUp(url = LOCAL_PB_URL) {
  try {
    const response = await fetch(`${url}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForHealth(url) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await isPocketBaseUp(url)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`PocketBase did not become healthy at ${url}`);
}

async function ensureBinary(dir) {
  const binary = join(dir, "pocketbase");
  if (!existsSync(join(dir, "go.mod"))) {
    throw new Error(`No PocketBase repo at ${dir}. Clone it or set POCKETBASE_DIR.`);
  }
  if (!needsBuild(dir, binary)) {
    return binary;
  }

  const path = `${join("/opt/homebrew/bin")}:${process.env.PATH ?? ""}`;
  console.log(`Building PocketBase in ${dir}`);
  try {
    await run(makePath(), ["build"], {
      cwd: dir,
      env: { ...process.env, CGO_ENABLED: "0", PATH: path },
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      throw new Error("Go is required to build PocketBase. Install it with: brew install go", {
        cause: error,
      });
    }
    throw error;
  }
  return binary;
}

async function ensureSuperuser(binary, dir) {
  await run(
    binary,
    ["superuser", "upsert", LOCAL_ADMIN_EMAIL, LOCAL_ADMIN_PASSWORD, "--dir", "pb_data"],
    {
      cwd: dir,
    },
  );
}

async function applyLocalSchema() {
  await run(process.execPath, [join(FAMILY_BANK_ROOT, "scripts/setup-pocketbase.mjs")], {
    cwd: FAMILY_BANK_ROOT,
    env: { ...process.env, ...localAdminEnv() },
  });
}

async function seedIfEmpty() {
  const pb = new PocketBase(LOCAL_PB_URL);
  await pb.collection("_superusers").authWithPassword(LOCAL_ADMIN_EMAIL, LOCAL_ADMIN_PASSWORD);

  const existing = await pb.collection(collections.accounts).getList(1, 1);
  if (existing.totalItems > 0) {
    return;
  }

  async function ensureUser(email, name) {
    const found = await pb.collection("users").getList(1, 1, { filter: `email = "${email}"` });
    if (found.items[0]) {
      return found.items[0];
    }
    return await pb.collection("users").create({
      email,
      emailVisibility: true,
      name,
      password: LOCAL_USER_PASSWORD,
      passwordConfirm: LOCAL_USER_PASSWORD,
      verified: true,
    });
  }

  const parent = await ensureUser(LOCAL_PARENT_EMAIL, "Parent");
  const kid = await ensureUser(LOCAL_KID_EMAIL, "Kid");
  const now = Date.now();
  const account = await pb.collection(collections.accounts).create({
    childEmail: LOCAL_KID_EMAIL,
    color: "teal",
    emoji: "🦖",
    member: kid.id,
    name: "Maya",
    owner: parent.id,
  });
  await pb.collection(collections.presets).create({
    account: account.id,
    note: "Allowance",
    owner: parent.id,
    value: 500,
  });
  await pb.collection(collections.transactions).create({
    account: account.id,
    isFromParent: true,
    note: "Starting balance",
    owner: parent.id,
    timestamp: now - 86_400_000,
    value: 2000,
  });
  await pb.collection(collections.transactions).create({
    account: account.id,
    isFromParent: true,
    note: "Allowance",
    owner: parent.id,
    timestamp: now,
    value: 500,
  });

  console.log(
    `Seeded ${LOCAL_PARENT_EMAIL} / ${LOCAL_KID_EMAIL} (password: ${LOCAL_USER_PASSWORD})`,
  );
}

export async function ensureLocalPocketBase() {
  const dir = pocketBaseDir();
  const url = LOCAL_PB_URL;
  let child;

  if (await isPocketBaseUp(url)) {
    console.log(`Using PocketBase already running at ${url}`);
  } else {
    const binary = await ensureBinary(dir);
    await ensureSuperuser(binary, dir);
    console.log(`Starting PocketBase at ${url} (data: ${join(dir, "pb_data")})`);
    child = spawn(binary, ["serve", "--http=127.0.0.1:8090", "--dir", "pb_data"], {
      cwd: dir,
      stdio: "inherit",
    });
    child.on("error", (error) => {
      console.error(error);
    });
    await waitForHealth(url);
  }

  await applyLocalSchema();
  await seedIfEmpty();

  return {
    stop() {
      child?.kill("SIGTERM");
    },
    url,
  };
}
