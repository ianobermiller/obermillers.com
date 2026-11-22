import { balanceLookup } from "./balance";
import type { GiftCard } from "./data";

export type StoreGroup = {
  key: string;
  merchant: string;
  currency: GiftCard["currency"];
  balance: number;
  cards: GiftCard[];
  checkedCount: number;
  oldestCheckedAt: string;
};

export function groupCardsByStore(cards: GiftCard[]): StoreGroup[] {
  const stores = new Map<string, StoreGroup>();
  for (const card of cards) {
    const merchant =
      balanceLookup(card.merchant)?.name ?? card.merchant.trim().replace(/\s+/g, " ");
    const normalized = merchant
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[’']/g, "");
    const key = `${normalized}\u0000${card.currency}`;
    let store = stores.get(key);
    if (!store) {
      store = {
        key,
        merchant,
        currency: card.currency,
        balance: 0,
        cards: [],
        checkedCount: 0,
        oldestCheckedAt: "",
      };
      stores.set(key, store);
    }
    store.cards.push(card);
    store.balance += card.balance;
    if (card.balanceCheckedAt) {
      store.checkedCount++;
      if (
        !store.oldestCheckedAt ||
        card.balanceCheckedAt.replace(" ", "T") < store.oldestCheckedAt.replace(" ", "T")
      )
        store.oldestCheckedAt = card.balanceCheckedAt;
    }
  }
  for (const store of stores.values())
    store.cards = store.cards.toSorted((a, b) => a.id.localeCompare(b.id));
  return [...stores.values()].toSorted(
    (a, b) => a.merchant.localeCompare(b.merchant) || a.currency.localeCompare(b.currency),
  );
}
