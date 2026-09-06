const NOTE_EMOJI: [RegExp, string][] = [
  [/interest/i, "✨"],
  [/allowance/i, "💵"],
  [/tooth\s*fairy|toothfairy|tooth|first tooth/i, "🦷"],
  [/lawn|mow|edg(e|ing)|rak(e|ing)/i, "🌿"],
  [/pool/i, "🌊"],
  [/dog|poop|franklin|walking/i, "🐕"],
  [/car wash|detailing|powerwash/i, "🚗"],
  [/bike|biking/i, "🚲"],
  [/lemonade/i, "🍋"],
  [/fidelity|wealthfront|invest/i, "📈"],
  [/dish/i, "🍽️"],
  [/chore|trash|laundry|clean|recycl|garbage/i, "🧹"],
  [/book|read|library/i, "📚"],
  [/gift|birthday|christmas/i, "🎁"],
  [/lego|toy|doll|squishmallow|jenga|catan|airsoft|spider-?man/i, "🧱"],
  [/candy|ice cream|treat|snack|cookie|haribo/i, "🍦"],
  [/game|roblox|minecraft|xbox|nintendo|switch/i, "🎮"],
  [/deposit|bank|save/i, "🏦"],
  [/change|quarters|cash|yen/i, "🪙"],
  [/school|lunch/i, "🎒"],
  [/shirt|shoe|cloth/i, "👕"],
  [/movie|ticket/i, "🎟️"],
];

/** Decorative only — falls back to a generic in/out emoji for unknown notes. */
export function transactionEmoji(note: string, value: number): string {
  for (const [pattern, emoji] of NOTE_EMOJI) {
    if (pattern.test(note)) return emoji;
  }

  return value < 0 ? "🛍️" : "💰";
}
