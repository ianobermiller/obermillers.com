#!/usr/bin/env tsx

import { existsSync } from "node:fs";

import PocketBase from "pocketbase";

import { calCollections } from "../src/cal/collections";
import {
  mapCalendarInsert,
  mapCategoryInsert,
  mapDayInsert,
  usersByInstantId,
  type InstantCalendar,
  type InstantDump,
  type InstantUser,
} from "../src/cal/instantMigrate";
import { instantCalendarUrlId } from "../src/cal/urlId";

const LOCAL_PB_URL = "http://127.0.0.1:8090";
const LOCAL_PB_HOSTS = new Set(["127.0.0.1", "localhost"]);

// Values passed on the command line win over the dotenv files below.
const shellEnv = { ...process.env };
for (const file of [".env", ".env.local"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

function env(name: string): string | undefined {
  return shellEnv[name] ?? process.env[name];
}

function isLocalPocketBaseUrl(url: string): boolean {
  try {
    return LOCAL_PB_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

const dryRun = process.argv.includes("--dry-run");
const INSTANT_APP_ID = env("INSTANT_APP_ID") ?? "ade8f44c-d755-45dd-b985-15ee77d3eb87";
const INSTANT_ADMIN_TOKEN = env("INSTANT_ADMIN_TOKEN");
const pbUrl = env("POCKETBASE_URL") ?? env("VITE_POCKETBASE_URL") ?? LOCAL_PB_URL;
const isLocal = isLocalPocketBaseUrl(pbUrl);
const adminEmail = env("POCKETBASE_ADMIN_EMAIL") ?? (isLocal ? "admin@local.test" : undefined);
const adminPassword =
  env("POCKETBASE_ADMIN_PASSWORD") ?? (isLocal ? "familybank-local" : undefined);

if (!INSTANT_ADMIN_TOKEN) {
  console.error("Missing INSTANT_ADMIN_TOKEN (Instant dashboard → app → Admin token).");
  process.exit(1);
}

if (!adminEmail || !adminPassword) {
  console.error(`Missing PocketBase superuser credentials for ${pbUrl}.

Put POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD in .env.local, or pass them inline.
Set POCKETBASE_URL=${LOCAL_PB_URL} to migrate into a local PocketBase instead.`);
  process.exit(1);
}

function parseInstantDump(value: unknown): InstantDump {
  if (!value || typeof value !== "object") return {};
  const record = value as Record<string, unknown>;
  const dump: InstantDump = {};
  if (Array.isArray(record["calendars"])) dump.calendars = record["calendars"] as InstantCalendar[];
  if (Array.isArray(record["$users"])) dump.$users = record["$users"] as InstantUser[];
  return dump;
}

async function instantQuery(query: Record<string, unknown>): Promise<InstantDump> {
  const response = await fetch("https://api.instantdb.com/admin/query", {
    body: JSON.stringify({ query }),
    headers: {
      Authorization: `Bearer ${INSTANT_ADMIN_TOKEN}`,
      "App-Id": INSTANT_APP_ID,
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`Instant query failed (${String(response.status)}): ${await response.text()}`);
  }
  const body: unknown = await response.json();
  if (body && typeof body === "object" && "data" in body) {
    return parseInstantDump(body.data);
  }
  return parseInstantDump(body);
}

async function instantUsers(): Promise<InstantUser[]> {
  const fromQuery = await instantQuery({ $users: {} });
  if (fromQuery.$users && fromQuery.$users.length > 0) {
    return fromQuery.$users.filter((user) => typeof user.email === "string" && user.email !== "");
  }

  const response = await fetch("https://api.instantdb.com/admin/users", {
    headers: {
      Authorization: `Bearer ${INSTANT_ADMIN_TOKEN}`,
      "App-Id": INSTANT_APP_ID,
    },
  });
  if (!response.ok) {
    throw new Error(`Instant users failed (${String(response.status)}): ${await response.text()}`);
  }
  const body: unknown = await response.json();
  const list = Array.isArray(body)
    ? body
    : body && typeof body === "object" && "users" in body
      ? body.users
      : [];
  if (!Array.isArray(list)) return [];
  return list.flatMap((item) => {
    if (!item || typeof item !== "object" || !("id" in item) || !("email" in item)) return [];
    if (typeof item.id !== "string" || typeof item.email !== "string") return [];
    return [{ email: item.email, id: item.id }];
  });
}

async function ensurePocketBaseUser(pb: PocketBase, email: string): Promise<string> {
  const existing = await pb
    .collection("users")
    .getList(1, 1, { filter: `email = "${email.replaceAll('"', "")}"` });
  const found = existing.items[0];
  if (found) return found.id;
  const password = `${crypto.randomUUID()}Aa1!`;
  const created = await pb.collection("users").create({
    email,
    emailVisibility: true,
    password,
    passwordConfirm: password,
    verified: true,
  });
  console.log(`Created PocketBase user ${email}`);
  return created.id;
}

console.log(`${dryRun ? "Dry run" : "Migrating"} Instant ${INSTANT_APP_ID} → PocketBase ${pbUrl}`);

const pb = new PocketBase(pbUrl);
await pb.collection("_superusers").authWithPassword(adminEmail, adminPassword);

const users = await instantUsers();
const userById = usersByInstantId(users);
console.log(`Instant users: ${String(users.length)}`);

const dump = await instantQuery({ calendars: { categories: {}, days: {} } });
const calendars: InstantCalendar[] = dump.calendars ?? [];
console.log(`Instant calendars: ${String(calendars.length)}`);

let imported = 0;
let skipped = 0;

for (const calendar of calendars) {
  const urlId = instantCalendarUrlId(calendar.id);
  const already = await pb
    .collection(calCollections.calendars)
    .getList(1, 1, { filter: `urlId = "${urlId}"` });
  if (already.items[0]) {
    skipped += 1;
    continue;
  }

  const instantOwner = calendar.ownerId ? userById.get(calendar.ownerId) : undefined;
  if (!instantOwner) {
    console.warn(
      `Skipping ${calendar.id}: no Instant user for ownerId ${calendar.ownerId ?? "(missing)"}`,
    );
    skipped += 1;
    continue;
  }

  if (dryRun) {
    console.log(
      `Would import ${calendar.title ?? "(untitled)"} → /cal/${urlId} for ${instantOwner.email} ` +
        `(${String(calendar.categories?.length ?? 0)} categories, ${String(calendar.days?.length ?? 0)} days)`,
    );
    imported += 1;
    continue;
  }

  const ownerId = await ensurePocketBaseUser(pb, instantOwner.email);
  const created = await pb
    .collection(calCollections.calendars)
    .create(mapCalendarInsert(calendar, ownerId));

  const categoryIdByInstant = new Map<string, string>();
  for (const category of calendar.categories ?? []) {
    const record = await pb
      .collection(calCollections.categories)
      .create(mapCategoryInsert(category, created.id, ownerId));
    categoryIdByInstant.set(category.id, record.id);
  }

  for (const day of calendar.days ?? []) {
    await pb
      .collection(calCollections.days)
      .create(mapDayInsert(day, created.id, ownerId, categoryIdByInstant));
  }

  imported += 1;
  console.log(`Imported ${created["title"] as string} → /cal/${urlId}`);
}

console.log(`Done. Imported ${String(imported)}, skipped ${String(skipped)}.`);
