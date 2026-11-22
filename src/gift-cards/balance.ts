const retailerChecks = [
  {
    aliases: ["dominos"],
    name: "Domino’s",
    url: "https://wbiprod.storedvalue.com/wbir/clients/dominos",
    instructions:
      "Enter the card number and PIN, then complete the retailer’s verification to see the balance.",
  },
  {
    aliases: ["shakeshack"],
    name: "Shake Shack",
    url: "https://shakeshack.com/gift-card-balance",
    instructions:
      "Enter the card number and PIN on Shake Shack’s balance page. The retailer may ask you to complete verification.",
  },
  {
    aliases: ["steaknshake", "steakandshake"],
    name: "Steak ’n Shake",
    url: "https://www.steaknshake.com/gift-card/",
    instructions:
      "Call the number on the back of your card or ask at a Steak ’n Shake. Their official site directs balance inquiries to phone or in-store support.",
  },
  {
    aliases: ["cinemark"],
    name: "Cinemark",
    url: "https://www.cinemark.com/guest-services?check-balance=",
    instructions: "Use the Check Gift Card Balance form on Cinemark’s Guest Services page.",
  },
];

export const knownMerchants = retailerChecks.map((retailer) => retailer.name);

export function balanceLookup(merchant: string) {
  const normalized = merchant
    .toLowerCase()
    .replaceAll("&", "and")
    .replace(/[^a-z0-9]/g, "");
  return retailerChecks.find((retailer) =>
    retailer.aliases.some((alias) => normalized.includes(alias)),
  );
}

export function parseBalance(value: string): number | null {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const [whole = "", fraction = ""] = value.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return cents <= 100000000 ? cents : null;
}
