import * as v from "valibot";

import { pb } from "../auth/pb";
const cardSchema = v.object({
  id: v.string(),
  owner: v.string(),
  merchant: v.string(),
  balanceCheckedAt: v.string(),
  updated: v.string(),
  balance: v.pipe(v.number(), v.integer(), v.minValue(0)),
  currency: v.picklist(["USD", "CAD", "EUR", "GBP"]),
  hasNumber: v.boolean(),
  hasPin: v.boolean(),
  expires: v.string(),
  notes: v.string(),
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
const accessSchema = v.object({ id: v.string(), card: v.string(), email: v.string() });
export type CardAccess = v.InferOutput<typeof accessSchema>;
export async function loadCards() {
  return v.parse(
    v.array(cardSchema),
    await pb.collection("giftcards").getFullList({ sort: "merchant" }),
  );
}
export async function loadAccess(card: string) {
  return v.parse(
    v.array(accessSchema),
    await pb
      .collection("giftcard_access")
      .getFullList({ filter: pb.filter("card = {:card}", { card }) }),
  );
}
export function money(card: Pick<GiftCard, "balance" | "currency">) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: card.currency }).format(
    card.balance / 100,
  );
}
