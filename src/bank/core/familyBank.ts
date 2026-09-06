import { INTEREST_NOTE, isInterestTransaction, planInterest } from "@bank/core/interestMath";
import { normalizeEmail } from "@bank/core/normalizeEmail";
import { pb, pbMessage, quoteFilter } from "@bank/core/pb";
import { pbCollections } from "@bank/core/pbCollections";
import type {
  AccountDetail,
  AccountSummary,
  InterestSummary,
  Preset,
  Transaction,
  User,
} from "@bank/core/types";
import { ClientResponseError, type RecordModel } from "pocketbase";

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function relationId(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function numberField(value: unknown): number {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function boolField(value: unknown): boolean {
  return Boolean(value);
}

function creationTime(record: RecordModel): number {
  const created = optionalString(record["created"]);
  return created ? Date.parse(created) : 0;
}

function requireUser(): User {
  const record = pb.authStore.record;
  if (!record) {
    throw new Error("Not authenticated");
  }
  return { _id: record.id, email: optionalString(record["email"]) };
}

function mapPreset(record: RecordModel): Preset {
  return {
    _creationTime: creationTime(record),
    _id: record.id,
    accountId: relationId(record["account"]),
    note: String(record["note"] ?? ""),
    ownerId: relationId(record["owner"]),
    value: numberField(record["value"]),
  };
}

function mapTransaction(record: RecordModel): Transaction {
  return {
    _creationTime: creationTime(record),
    _id: record.id,
    accountId: relationId(record["account"]),
    isFromParent: boolField(record["isFromParent"]),
    note: String(record["note"] ?? ""),
    ownerId: relationId(record["owner"]),
    timestamp: numberField(record["timestamp"]),
    value: numberField(record["value"]),
  };
}

function mapAccountBase(record: RecordModel) {
  return {
    _creationTime: creationTime(record),
    _id: record.id,
    childEmail: optionalString(record["childEmail"]),
    color: optionalString(record["color"]),
    emoji: String(record["emoji"] ?? ""),
    memberId: optionalString(record["member"]),
    name: String(record["name"] ?? ""),
    ownerId: relationId(record["owner"]),
  };
}

function isParentOf(userId: string, account: { ownerId: string }): boolean {
  return account.ownerId === userId;
}

function currentUser(): undefined | User {
  const record = pb.authStore.record;
  if (!record || !pb.authStore.isValid) {
    return undefined;
  }
  return { _id: record.id, email: optionalString(record["email"]) };
}

export async function listAccounts(): Promise<AccountSummary[]> {
  const accounts = await pb.collection(pbCollections.accounts).getFullList();
  const accountIds = accounts.map((account) => account.id);
  const transactions =
    accountIds.length === 0
      ? []
      : await pb.collection(pbCollections.transactions).getFullList({
          filter: accountIds.map((id) => `account = ${quoteFilter(id)}`).join(" || "),
        });

  const txsByAccount = new Map<string, { value: number }[]>();
  for (const transaction of transactions) {
    const accountId = relationId(transaction["account"]);
    const list = txsByAccount.get(accountId) ?? [];
    list.push({ value: numberField(transaction["value"]) });
    txsByAccount.set(accountId, list);
  }

  return accounts
    .map((account) =>
      Object.assign(mapAccountBase(account), {
        transactions: txsByAccount.get(account.id) ?? [],
      }),
    )
    .toSorted((a, b) => a.name.localeCompare(b.name));
}

export async function getSession(): Promise<null | {
  canCreate: boolean;
  isParent: boolean;
  user: User;
}> {
  const user = currentUser();
  if (!user) {
    return null;
  }

  const accounts = await pb.collection(pbCollections.accounts).getFullList();
  const owned = accounts.some((account) => relationId(account["owner"]) === user._id);
  if (owned) {
    return { canCreate: true, isParent: true, user };
  }
  return { canCreate: accounts.length === 0, isParent: false, user };
}

export async function getAccount(accountId: string): Promise<AccountDetail | null> {
  const user = requireUser();
  try {
    const [account, presets, transactions] = await Promise.all([
      pb.collection(pbCollections.accounts).getOne(accountId),
      pb
        .collection(pbCollections.presets)
        .getFullList({ filter: `account = ${quoteFilter(accountId)}` }),
      pb
        .collection(pbCollections.transactions)
        .getFullList({ filter: `account = ${quoteFilter(accountId)}` }),
    ]);
    const mapped = mapAccountBase(account);
    return {
      ...mapped,
      isParent: isParentOf(user._id, mapped),
      member: mapped.memberId ? { _id: mapped.memberId } : null,
      presets: presets.map(mapPreset),
      transactions: transactions.map(mapTransaction),
    };
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) {
      return null;
    }
    throw new Error(pbMessage(error), { cause: error });
  }
}

export async function createAccount(args: {
  childEmail?: string | undefined;
  color: string;
  emoji: string;
  name: string;
}): Promise<string> {
  const user = requireUser();
  const record = await pb.collection(pbCollections.accounts).create({
    childEmail: normalizeEmail(args.childEmail) ?? "",
    color: args.color,
    emoji: args.emoji,
    name: args.name,
    owner: user._id,
  });
  return record.id;
}

export async function updateAccount(args: {
  accountId: string;
  childEmail?: string | undefined;
  color: string;
  emoji: string;
  name: string;
}): Promise<void> {
  const account = await pb.collection(pbCollections.accounts).getOne(args.accountId);
  const childEmail = normalizeEmail(args.childEmail);
  const currentMember = optionalString(account["member"]);
  const previousEmail = optionalString(account["childEmail"]);
  const keepCurrentMember = Boolean(currentMember && childEmail && childEmail === previousEmail);
  await pb.collection(pbCollections.accounts).update(args.accountId, {
    childEmail: childEmail ?? "",
    color: args.color,
    emoji: args.emoji,
    member: keepCurrentMember ? currentMember : "",
    name: args.name,
  });
}

export async function updateAppearance(args: {
  accountId: string;
  color: string;
  emoji: string;
}): Promise<void> {
  await pb.collection(pbCollections.accounts).update(args.accountId, {
    color: args.color,
    emoji: args.emoji,
  });
}

export async function removeAccount(args: { accountId: string }): Promise<void> {
  await pb.collection(pbCollections.accounts).delete(args.accountId);
}

export async function claimPending(): Promise<number> {
  const user = requireUser();
  const email = normalizeEmail(user.email);
  if (!email) {
    return 0;
  }

  const owned = await pb
    .collection(pbCollections.accounts)
    .getFullList({ filter: `owner = ${quoteFilter(user._id)}` });
  if (owned.length > 0) {
    return 0;
  }

  const pending = await pb
    .collection(pbCollections.accounts)
    .getFullList({ filter: `childEmail = ${quoteFilter(email)}` });
  let claimed = 0;
  for (const account of pending) {
    if (optionalString(account["member"]) !== user._id) {
      await pb.collection(pbCollections.accounts).update(account.id, { member: user._id });
      claimed += 1;
    }
  }
  return claimed;
}

export async function createTransaction(args: {
  accountId: string;
  note: string;
  value: number;
}): Promise<string> {
  const user = requireUser();
  const account = await pb.collection(pbCollections.accounts).getOne(args.accountId);
  const ownerId = relationId(account["owner"]);
  const record = await pb.collection(pbCollections.transactions).create({
    account: args.accountId,
    isFromParent: ownerId === user._id,
    note: args.note,
    owner: ownerId,
    timestamp: Date.now(),
    value: args.value,
  });
  return record.id;
}

export async function updateTransaction(args: {
  isFromParent?: boolean;
  note: string;
  timestamp: number;
  transactionId: string;
  value: number;
}): Promise<void> {
  await pb.collection(pbCollections.transactions).update(args.transactionId, {
    isFromParent: args.isFromParent ?? true,
    note: args.note,
    timestamp: args.timestamp,
    value: args.value,
  });
}

export async function removeTransaction(args: { transactionId: string }): Promise<void> {
  await pb.collection(pbCollections.transactions).delete(args.transactionId);
}

export async function createPreset(args: {
  accountId: string;
  note: string;
  value: number;
}): Promise<string> {
  const account = await pb.collection(pbCollections.accounts).getOne(args.accountId);
  const record = await pb.collection(pbCollections.presets).create({
    account: args.accountId,
    note: args.note,
    owner: relationId(account["owner"]),
    value: args.value,
  });
  return record.id;
}

export async function updatePreset(args: {
  note: string;
  presetId: string;
  value: number;
}): Promise<void> {
  await pb.collection(pbCollections.presets).update(args.presetId, {
    note: args.note,
    value: args.value,
  });
}

export async function removePreset(args: { presetId: string }): Promise<void> {
  await pb.collection(pbCollections.presets).delete(args.presetId);
}

async function accrueForAccount(account: RecordModel): Promise<InterestSummary> {
  const transactions = (
    await pb.collection(pbCollections.transactions).getFullList({
      filter: `account = ${quoteFilter(account.id)}`,
    })
  ).map(mapTransaction);

  const planned = planInterest(transactions);
  const existingByTimestamp = new Map(
    transactions.filter(isInterestTransaction).map((tx) => [tx.timestamp, tx]),
  );

  const added: { timestamp: number; value: number }[] = [];
  const updated: { timestamp: number; value: number }[] = [];
  const ownerId = relationId(account["owner"]);
  const batch = pb.createBatch();
  let queued = 0;

  for (const [timestamp, value] of planned) {
    const existing = existingByTimestamp.get(timestamp);
    if (!existing) {
      batch.collection(pbCollections.transactions).create({
        account: account.id,
        isFromParent: true,
        note: INTEREST_NOTE,
        owner: ownerId,
        timestamp,
        value,
      });
      added.push({ timestamp, value });
      queued += 1;
      continue;
    }
    if (existing.value !== value) {
      batch.collection(pbCollections.transactions).update(existing._id, { value });
      updated.push({ timestamp, value });
      queued += 1;
    }
  }

  if (queued > 0) {
    await batch.send();
  }

  return {
    accountId: account.id,
    accountName: String(account["name"] ?? ""),
    added,
    updated,
  };
}

export async function accrueAccount(args: { accountId: string }): Promise<InterestSummary> {
  const account = await pb.collection(pbCollections.accounts).getOne(args.accountId);
  return await accrueForAccount(account);
}

export async function accrueAll(): Promise<InterestSummary[]> {
  const user = requireUser();
  const accounts = await pb.collection(pbCollections.accounts).getFullList({
    filter: `owner = ${quoteFilter(user._id)}`,
  });
  return await Array.fromAsync(accounts, (account) => accrueForAccount(account));
}

export async function removeAllInterest(): Promise<number> {
  const user = requireUser();
  const accounts = await pb.collection(pbCollections.accounts).getFullList({
    filter: `owner = ${quoteFilter(user._id)}`,
  });
  let removed = 0;
  for (const account of accounts) {
    const transactions = await pb.collection(pbCollections.transactions).getFullList({
      filter: `account = ${quoteFilter(account.id)} && note = ${quoteFilter(INTEREST_NOTE)}`,
    });
    for (const transaction of transactions) {
      await pb.collection(pbCollections.transactions).delete(transaction.id);
      removed += 1;
    }
  }
  return removed;
}
