import { describe, expect, it } from "vitest";

import type { GiftCard } from "./data";
import { groupCardsByStore } from "./stores";

function card(id: string, fields: Partial<GiftCard> = {}): GiftCard {
  return {
    id,
    owner: "owner",
    merchant: "Domino’s",
    balance: 2500,
    currency: "USD",
    hasNumber: true,
    hasPin: true,
    balanceCheckedAt: "",
    updated: "2026-11-21 12:00:00.000Z",
    created: "2026-11-19 12:00:00.000Z",
    expires: "",
    ...fields,
  };
}

const costcoPack = () => [card("1"), card("2"), card("3"), card("4")];

describe("gift cards grouped by store", () => {
  it("shows a four-by-$25 pack as one $100 store while keeping four cards", () => {
    const stores = groupCardsByStore(costcoPack());
    expect(stores).toHaveLength(1);
    expect(stores[0]?.balance).toBe(10000);
    expect(stores[0]?.cards.map((item) => item.id)).toEqual(["1", "2", "3", "4"]);
  });

  it("updates the store total after one card is partially spent", () => {
    const pack = costcoPack();
    const updated = pack.map((item) => (item.id === "4" ? { ...item, balance: 1200 } : item));
    expect(groupCardsByStore(updated)[0]?.balance).toBe(8700);
    expect(groupCardsByStore(updated)[0]?.cards).toHaveLength(4);
    expect(pack[3]?.balance).toBe(2500);
  });

  it("combines retailer name variants and normalizes other store names", () => {
    const stores = groupCardsByStore([
      card("1", { merchant: "Domino's Pizza" }),
      card("2", { merchant: "DOMINO’S (Costco)" }),
      card("3", { merchant: "Local Shop" }),
      card("4", { merchant: " local   shop " }),
    ]);
    expect(stores).toHaveLength(2);
    expect(stores.find((store) => store.merchant === "Domino’s")?.balance).toBe(5000);
    expect(stores.find((store) => store.merchant === "Local Shop")?.cards).toHaveLength(2);
  });

  it("keeps different currencies and stores separate", () => {
    const stores = groupCardsByStore([
      card("1"),
      card("2", { currency: "CAD" }),
      card("3", { merchant: "Cinemark" }),
    ]);
    expect(stores).toHaveLength(3);
    expect(stores.map((store) => store.balance)).toEqual([2500, 2500, 2500]);
  });

  it("preserves each card's ownership and last-check date", () => {
    const stores = groupCardsByStore([
      card("2", { owner: "someone-else", balanceCheckedAt: "2026-11-21T15:00:00.000Z" }),
      card("1", { balanceCheckedAt: "2026-11-20 12:00:00.000Z" }),
      card("3"),
    ]);
    expect(stores[0]?.checkedCount).toBe(2);
    expect(stores[0]?.oldestCheckedAt).toBe("2026-11-20 12:00:00.000Z");
    expect(stores[0]?.cards.map((item) => item.owner)).toEqual(["owner", "someone-else", "owner"]);
  });

  it("keeps depleted cards available and handles an empty wallet", () => {
    const stores = groupCardsByStore([card("1", { balance: 0 }), card("2", { balance: 0 })]);
    expect(stores[0]?.balance).toBe(0);
    expect(stores[0]?.cards).toHaveLength(2);
    expect(groupCardsByStore([])).toEqual([]);
  });
});
