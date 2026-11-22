import * as v from "valibot";

import { pb } from "../auth/pb";
const cardSchema = v.object({
  id: v.string(),
  owner: v.string(),
  merchant: v.string(),
  balanceCheckedAt: v.string(),
  updated: v.string(),
  created: v.string(),
  balance: v.pipe(v.number(), v.integer(), v.minValue(0)),
  currency: v.picklist(["USD", "CAD", "EUR", "GBP"]),
  hasNumber: v.boolean(),
  numberLast4: v.string(),
  hasPin: v.boolean(),
  expires: v.string(),
});
const secretsSchema = v.object({ number: v.string(), pin: v.string() });

export async function revealCard(id: string) {
  return v.parse(
    secretsSchema,
    await pb.send<unknown>(`/api/giftcards/${encodeURIComponent(id)}/reveal`, {
      method: "POST",
      cache: "no-store",
    }),
  );
}

export async function confirmBalance(card: GiftCard, balance: number) {
  return v.parse(
    cardSchema,
    await pb.send<unknown>(`/api/giftcards/${encodeURIComponent(card.id)}/balance-check`, {
      method: "POST",
      body: { balance, expectedUpdated: card.updated },
    }),
  );
}

export type GiftCard = v.InferOutput<typeof cardSchema>;
const shareSchema = v.object({ id: v.string(), owner: v.string(), email: v.string() });
export type WalletShare = v.InferOutput<typeof shareSchema>;
export async function loadCards() {
  return v.parse(
    v.array(cardSchema),
    await pb.collection("giftcards").getFullList({ sort: "merchant" }),
  );
}
export async function loadShares() {
  return v.parse(
    v.array(shareSchema),
    await pb.collection("giftcard_shares").getFullList({ sort: "email" }),
  );
}
export function money(card: Pick<GiftCard, "balance" | "currency">) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: card.currency }).format(
    card.balance / 100,
  );
}
