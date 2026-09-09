// Local-only sample data for Family Bank, used by `npm run dev`.

import { bankCollections } from "./pocketbase.schema.mjs";

export async function seedBank(pb, { ensureUser, kidEmail, parentEmail }) {
  const existing = await pb.collection(bankCollections.accounts).getList(1, 1);
  if (existing.totalItems > 0) {
    return;
  }

  const parent = await ensureUser(parentEmail, "Parent");
  const kid = await ensureUser(kidEmail, "Kid");
  const now = Date.now();
  const account = await pb.collection(bankCollections.accounts).create({
    childEmail: kidEmail,
    color: "teal",
    emoji: "🦖",
    member: kid.id,
    name: "Maya",
    owner: parent.id,
  });
  await pb.collection(bankCollections.presets).create({
    account: account.id,
    note: "Allowance",
    owner: parent.id,
    value: 500,
  });
  await pb.collection(bankCollections.transactions).create({
    account: account.id,
    isFromParent: true,
    note: "Starting balance",
    owner: parent.id,
    timestamp: now - 86_400_000,
    value: 2000,
  });
  await pb.collection(bankCollections.transactions).create({
    account: account.id,
    isFromParent: true,
    note: "Allowance",
    owner: parent.id,
    timestamp: now,
    value: 500,
  });

  console.log("Seeded Family Bank account");
}
