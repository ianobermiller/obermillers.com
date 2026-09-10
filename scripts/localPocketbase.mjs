import { spawn } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import PocketBase from "pocketbase";

import { seedBank } from "../src/bank/pocketbase.seed.mjs";
import { seedCal } from "../src/cal/pocketbase.seed.mjs";
import { LOCAL_SMTP_HOST, LOCAL_SMTP_PORT, startLocalMailCatcher } from "./localMailCatcher.mjs";

export const LOCAL_PB_URL = "http://127.0.0.1:8090";
export const LOCAL_ADMIN_EMAIL = "admin@local.test";
export const LOCAL_ADMIN_PASSWORD = "familybank-local";

// Shared local identities: a local PocketBase can't send email, so both apps
// sign in with these passwords instead of an OTP.
export const LOCAL_PARENT_EMAIL = "parent@example.com";
export const LOCAL_KID_EMAIL = "kid@example.com";
export const LOCAL_USER_PASSWORD = "familybank";

// Each app contributes its own local sample data.
const SEEDS = [seedBank, seedCal];

const REPO_ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const SOURCE_FILES = [
  "account.go",
  "applications.go",
  "go.mod",
  "go.sum",
  "main.go",
  "otp_mail.go",
  "passkey.go",
];

function pocketBaseDir() {
  return process.env.POCKETBASE_DIR ?? join(REPO_ROOT, "pocketbase");
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
  await run(process.execPath, [join(REPO_ROOT, "scripts/setup-pocketbase.mjs")], {
    cwd: REPO_ROOT,
    env: { ...process.env, ...localAdminEnv() },
  });
}

async function ensureUser(pb, email, name) {
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

// PocketBase defaults to SMTP disabled, which falls back to the system sendmail
// and silently drops every message. Point it at the local catcher so login codes
// show up in this terminal.
async function useLocalMail(pb) {
  const current = await pb.settings.getAll();
  await pb.settings.update({
    meta: {
      ...current.meta,
      appName: "Obermillers (local)",
      senderAddress: "no-reply@local.test",
      senderName: "Obermillers (local)",
    },
    smtp: {
      authMethod: "",
      enabled: true,
      host: LOCAL_SMTP_HOST,
      localName: "localhost",
      password: "",
      port: LOCAL_SMTP_PORT,
      tls: false,
      username: "",
    },
  });
}

async function seed() {
  const pb = new PocketBase(LOCAL_PB_URL);
  await pb.collection("_superusers").authWithPassword(LOCAL_ADMIN_EMAIL, LOCAL_ADMIN_PASSWORD);
  await useLocalMail(pb);
  const context = {
    ensureUser: (email, name) => ensureUser(pb, email, name),
    kidEmail: LOCAL_KID_EMAIL,
    parentEmail: LOCAL_PARENT_EMAIL,
  };
  for (const seedApp of SEEDS) {
    await seedApp(pb, context);
  }
  // A code request for an unknown address returns 200 and sends nothing, so
  // list the accounts that actually exist locally.
  const users = await pb.collection("users").getFullList({ fields: "email", sort: "email" });
  console.log(`Local sign-in (codes print here): ${users.map((user) => user.email).join(", ")}`);
  console.log("Any other address silently gets no code.");
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

  const mail = await startLocalMailCatcher();
  await applyLocalSchema();
  await seed();

  return {
    stop() {
      mail.stop();
      child?.kill("SIGTERM");
    },
    url,
  };
}
