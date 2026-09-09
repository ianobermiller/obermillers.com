#!/usr/bin/env node

import PocketBase from "pocketbase";

import { bankSchema } from "../src/bank/pocketbase.schema.mjs";
import { calSchema } from "../src/cal/pocketbase.schema.mjs";
import {
  isLocalPocketBaseUrl,
  LOCAL_ADMIN_EMAIL,
  LOCAL_ADMIN_PASSWORD,
} from "./localPocketbase.mjs";

const url = process.env.POCKETBASE_URL ?? process.env.VITE_POCKETBASE_URL;
const email =
  process.env.POCKETBASE_ADMIN_EMAIL ?? (isLocalPocketBaseUrl(url) ? LOCAL_ADMIN_EMAIL : undefined);
const password =
  process.env.POCKETBASE_ADMIN_PASSWORD ??
  (isLocalPocketBaseUrl(url) ? LOCAL_ADMIN_PASSWORD : undefined);

if (!url || !email || !password) {
  console.error(`Missing PocketBase admin env.

Local (default):
  npm run dev

Production:
  POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD in .env.local
  npm run pb:setup:prod`);
  process.exit(1);
}

const pb = new PocketBase(url);

// Every app shares the `users` auth collection; app data lives in prefixed
// collections owned by that app's schema module.
const schema = [...bankSchema, ...calSchema];

// Collections created through the API start out without the autodate fields the
// dashboard adds by default, so sorting or filtering on them 400s.
const AUTODATE_FIELDS = [
  { name: "created", onCreate: true, onUpdate: false, type: "autodate" },
  { name: "updated", onCreate: true, onUpdate: true, type: "autodate" },
];

function indexSql(collection, columns, unique) {
  const name = `idx_${collection}_${columns.join("_")}`;
  const target = columns.map((column) => `\`${column}\``).join(", ");
  const kind = unique ? "UNIQUE INDEX" : "INDEX";
  return `CREATE ${kind} IF NOT EXISTS \`${name}\` ON \`${collection}\` (${target})`;
}

function indexesFor(spec) {
  return (spec.indexes ?? []).map((index) => {
    if (typeof index === "string") return indexSql(spec.name, [index], false);
    if (Array.isArray(index)) return indexSql(spec.name, index, false);
    return indexSql(spec.name, index.columns, index.unique === true);
  });
}

function fieldsFor(spec, idByName) {
  const fields = spec.fields.map((field) => {
    if (field.relation === undefined) return field;
    const { relation, ...rest } = field;
    const collectionId = idByName.get(relation);
    if (collectionId === undefined) {
      throw new Error(`${spec.name}.${field.name} points at unknown collection ${relation}`);
    }
    return {
      cascadeDelete: false,
      collectionId,
      maxSelect: 1,
      minSelect: 0,
      type: "relation",
      ...rest,
    };
  });
  return [...AUTODATE_FIELDS, ...fields];
}

function mergeFields(existing, extras) {
  const fields = [...existing];
  for (const extra of extras) {
    const index = fields.findIndex((field) => field.name === extra.name);
    if (index === -1) {
      fields.push(extra);
    } else {
      fields[index] = { ...fields[index], ...extra };
    }
  }
  return fields;
}

async function ensureExists(spec) {
  try {
    return await pb.collections.getOne(spec.name);
  } catch {
    // Empty
  }
  if (spec.legacyName !== undefined) {
    try {
      const legacy = await pb.collections.getOne(spec.legacyName);
      console.log(`Renaming ${spec.legacyName} -> ${spec.name}`);
      return await pb.collections.update(legacy.id, { name: spec.name });
    } catch {
      // Empty
    }
  }
  const created = await pb.collections.create({ name: spec.name, type: "base" });
  console.log(`Created ${spec.name}`);
  return created;
}

async function applySpec(spec, idByName) {
  console.log(`Updating ${spec.name}`);
  const collection = await pb.collections.getOne(spec.name);
  try {
    await pb.collections.update(collection.id, {
      ...spec.rules,
      fields: mergeFields(collection.fields, fieldsFor(spec, idByName)),
      indexes: indexesFor(spec),
    });
  } catch (error) {
    const details =
      error && typeof error === "object" && "response" in error ? error.response : error;
    console.error(`Failed to update ${spec.name}:`, JSON.stringify(details, null, 2));
    process.exit(1);
  }
}

async function enableUserOtp() {
  const users = await pb.collections.getOne("users");
  await pb.collections.update(users.id, {
    otp: {
      ...users.otp,
      duration: users.otp?.duration || 300,
      enabled: true,
      length: users.otp?.length || 6,
    },
  });
  console.log("Enabled OTP on users");
  return users;
}

await pb.collection("_superusers").authWithPassword(email, password);
const users = await enableUserOtp();

// Create every collection before applying fields so relations can point at each
// other regardless of the order they are declared in.
const idByName = new Map([["users", users.id]]);
for (const spec of schema) {
  const collection = await ensureExists(spec);
  idByName.set(spec.name, collection.id);
}
for (const spec of schema) {
  await applySpec(spec, idByName);
}

console.log(`PocketBase schema is ready at ${url} (${schema.map((s) => s.name).join(", ")})`);
