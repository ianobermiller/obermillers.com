import PocketBase from "pocketbase";

import {
  isLocalPocketBaseUrl,
  LOCAL_ADMIN_EMAIL,
  LOCAL_ADMIN_PASSWORD,
} from "../localPocketbase.mjs";

export function argument(name) {
  const i = process.argv.indexOf(name);
  return i === -1 ? undefined : process.argv[i + 1];
}

export const applying = process.argv.includes("--apply");

export async function adminClient() {
  const url = argument("--url") ?? process.env.POCKETBASE_URL ?? process.env.VITE_POCKETBASE_URL;
  if (!url) throw new Error("Set POCKETBASE_URL or pass --url.");
  const local = isLocalPocketBaseUrl(url);
  const email = process.env.POCKETBASE_ADMIN_EMAIL ?? (local ? LOCAL_ADMIN_EMAIL : undefined);
  const password =
    process.env.POCKETBASE_ADMIN_PASSWORD ?? (local ? LOCAL_ADMIN_PASSWORD : undefined);
  if (!email || !password)
    throw new Error(
      "Load POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD from your private .env.local.",
    );
  const pb = new PocketBase(url);
  pb.autoCancellation(false);
  await pb.collection("_superusers").authWithPassword(email, password);
  return { pb, local };
}

export async function findRecord(pb, collection, filter) {
  const result = await pb.collection(collection).getList(1, 1, { filter });
  return result.items[0];
}
