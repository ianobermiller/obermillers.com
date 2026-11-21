import * as v from "valibot";

import { pb } from "../auth/pb";
const cardSchema = v.object({
  id: v.string(),
  owner: v.string(),
  merchant: v.string(),
  balance: v.pipe(v.number(), v.integer(), v.minValue(0)),
  currency: v.picklist(["USD", "CAD", "EUR", "GBP"]),
  number: v.string(),
  pin: v.string(),
  expires: v.string(),
  notes: v.string(),
});
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
