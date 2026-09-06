#!/usr/bin/env node

import PocketBase from "pocketbase";

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
  npm run bank:setup

Production:
  POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD in .env.local
  npm run bank:setup:prod`);
  process.exit(1);
}

const pb = new PocketBase(url);

// Keep in sync with src/core/pbCollections.ts — shared `users` auth, prefixed app data.
const collections = {
  accounts: "familybank_accounts",
  presets: "familybank_presets",
  transactions: "familybank_transactions",
};

const ACCOUNT_ACCESS = `@request.auth.id != "" && (owner = @request.auth.id || member = @request.auth.id || childEmail = @request.auth.email)`;
const NESTED_ACCOUNT_ACCESS = `@request.auth.id != "" && (@request.body.account.owner = @request.auth.id || @request.body.account.member = @request.auth.id || @request.body.account.childEmail = @request.auth.email)`;
const PARENT_OF_ACCOUNT = `account.owner = @request.auth.id`;
const CREATE_ACCOUNT = `@request.auth.id != "" && @request.body.owner = @request.auth.id`;
const UPDATE_ACCOUNT = `owner = @request.auth.id || (childEmail = @request.auth.email && @request.body.member = @request.auth.id) || (member = @request.auth.id && @request.body.name:isset = false && @request.body.owner:isset = false && @request.body.member:isset = false && @request.body.childEmail:isset = false)`;
const CREATE_TRANSACTION = `${NESTED_ACCOUNT_ACCESS} && @request.body.owner = @request.body.account.owner && ((@request.body.account.owner = @request.auth.id && @request.body.isFromParent = true) || (@request.body.account.owner != @request.auth.id && @request.body.isFromParent = false))`;
const CREATE_PRESET = `${NESTED_ACCOUNT_ACCESS} && @request.body.owner = @request.body.account.owner`;
const PRESET_MUTATE = `account.owner = @request.auth.id || account.member = @request.auth.id || account.childEmail = @request.auth.email`;

function extraFields(usersId, accountsId) {
  return {
    accounts: [
      { name: "name", required: true, type: "text" },
      { name: "emoji", required: true, type: "text" },
      { name: "color", type: "text" },
      { name: "childEmail", type: "email" },
      {
        cascadeDelete: false,
        collectionId: usersId,
        maxSelect: 1,
        minSelect: 0,
        name: "owner",
        required: true,
        type: "relation",
      },
      {
        cascadeDelete: false,
        collectionId: usersId,
        maxSelect: 1,
        minSelect: 0,
        name: "member",
        required: false,
        type: "relation",
      },
    ],
    presets: [
      {
        cascadeDelete: true,
        collectionId: accountsId,
        maxSelect: 1,
        minSelect: 0,
        name: "account",
        required: true,
        type: "relation",
      },
      {
        cascadeDelete: false,
        collectionId: usersId,
        maxSelect: 1,
        minSelect: 0,
        name: "owner",
        required: true,
        type: "relation",
      },
      { name: "note", required: true, type: "text" },
      { name: "value", required: true, type: "number" },
    ],
    transactions: [
      {
        cascadeDelete: true,
        collectionId: accountsId,
        maxSelect: 1,
        minSelect: 0,
        name: "account",
        required: true,
        type: "relation",
      },
      {
        cascadeDelete: false,
        collectionId: usersId,
        maxSelect: 1,
        minSelect: 0,
        name: "owner",
        required: true,
        type: "relation",
      },
      { name: "note", required: true, type: "text" },
      { name: "value", required: true, type: "number" },
      { name: "timestamp", required: true, type: "number" },
      { name: "isFromParent", required: true, type: "bool" },
    ],
  };
}

async function getOrRename(prefixedName, legacyName) {
  try {
    return await pb.collections.getOne(prefixedName);
  } catch {
    try {
      const legacy = await pb.collections.getOne(legacyName);
      console.log(`Renaming ${legacyName} -> ${prefixedName}`);
      return await pb.collections.update(legacy.id, { name: prefixedName });
    } catch {
      const created = await pb.collections.create({ name: prefixedName, type: "base" });
      console.log(`Created ${prefixedName}`);
      return created;
    }
  }
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

async function ensureCollection(name, extras, rules, indexes) {
  let collection;
  try {
    collection = await pb.collections.getOne(name);
    console.log(`Updating ${name}`);
  } catch {
    collection = await pb.collections.create({ name, type: "base" });
    console.log(`Created ${name}`);
  }

  try {
    await pb.collections.update(collection.id, {
      ...rules,
      fields: mergeFields(collection.fields, extras),
      indexes,
    });
  } catch (error) {
    const details =
      error && typeof error === "object" && "response" in error ? error.response : error;
    console.error(`Failed to update ${name}:`, JSON.stringify(details, null, 2));
    process.exit(1);
  }
  return await pb.collections.getOne(name);
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

let accounts = await getOrRename(collections.accounts, "accounts");
const fields = extraFields(users.id, accounts.id);

await ensureCollection(
  collections.accounts,
  fields.accounts,
  {
    createRule: CREATE_ACCOUNT,
    deleteRule: "owner = @request.auth.id",
    listRule: ACCOUNT_ACCESS,
    updateRule: UPDATE_ACCOUNT,
    viewRule: ACCOUNT_ACCESS,
  },
  [
    `CREATE INDEX IF NOT EXISTS \`idx_${collections.accounts}_owner\` ON \`${collections.accounts}\` (\`owner\`)`,
    `CREATE INDEX IF NOT EXISTS \`idx_${collections.accounts}_member\` ON \`${collections.accounts}\` (\`member\`)`,
    `CREATE INDEX IF NOT EXISTS \`idx_${collections.accounts}_child_email\` ON \`${collections.accounts}\` (\`childEmail\`)`,
  ],
);

const accountsFresh = await pb.collections.getOne(collections.accounts);
const fieldsWithAccounts = extraFields(users.id, accountsFresh.id);

await getOrRename(collections.presets, "presets");
await ensureCollection(
  collections.presets,
  fieldsWithAccounts.presets,
  {
    createRule: CREATE_PRESET,
    deleteRule: PRESET_MUTATE,
    listRule: PRESET_MUTATE,
    updateRule: PRESET_MUTATE,
    viewRule: PRESET_MUTATE,
  },
  [
    `CREATE INDEX IF NOT EXISTS \`idx_${collections.presets}_account\` ON \`${collections.presets}\` (\`account\`)`,
  ],
);

await getOrRename(collections.transactions, "transactions");
await ensureCollection(
  collections.transactions,
  fieldsWithAccounts.transactions,
  {
    createRule: CREATE_TRANSACTION,
    deleteRule: PARENT_OF_ACCOUNT,
    listRule: PRESET_MUTATE,
    updateRule: PARENT_OF_ACCOUNT,
    viewRule: PRESET_MUTATE,
  },
  [
    `CREATE INDEX IF NOT EXISTS \`idx_${collections.transactions}_account\` ON \`${collections.transactions}\` (\`account\`)`,
    `CREATE INDEX IF NOT EXISTS \`idx_${collections.transactions}_account_timestamp\` ON \`${collections.transactions}\` (\`account\`, \`timestamp\`)`,
  ],
);

console.log(`PocketBase schema is ready at ${url} (${Object.values(collections).join(", ")})`);
