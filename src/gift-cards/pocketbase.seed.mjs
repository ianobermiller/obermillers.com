// Local demo cards contain deliberately invalid numbers and PINs.
export async function seedGiftCards(pb, { ensureUser, parentEmail }) {
  if (!["127.0.0.1", "localhost"].includes(new URL(pb.baseURL).hostname)) {
    throw new Error("Gift card samples can only be seeded into local PocketBase.");
  }
  const parent = await ensureUser(parentEmail, "Parent");
  const existing = await pb.collection("giftcards").getFullList({ fields: "id" });
  const ids = new Set(existing.map((card) => card.id));
  const merchants = ["Domino’s", "Shake Shack", "Steak ’n Shake", "Cinemark"];
  let count = 0;
  for (const [store, merchant] of merchants.entries()) {
    for (let slot = 0; slot < 4; slot++) {
      const index = store * 4 + slot;
      const id = `demogift${String(index).padStart(7, "0")}`;
      if (ids.has(id)) continue;
      await pb.collection("giftcards").create({
        id,
        owner: parent.id,
        merchant,
        balance: store === 1 && slot === 0 ? 1250 : store === 2 && slot === 0 ? 0 : 2500,
        currency: "USD",
        cardNumber: `DEMO-NOT-REDEEMABLE-${String(index + 1).padStart(4, "0")}`,
        cardPin: "DEMO",
      });
      count++;
    }
  }
  if (count) console.log(`Seeded ${count} demo gift cards for ${parentEmail}`);
}
