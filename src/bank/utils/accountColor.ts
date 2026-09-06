/**
 * Pastel avatar backgrounds. Class strings are written literally so Tailwind
 * picks them up when scanning source.
 */
export const ACCOUNT_COLORS = [
  { id: "pink", label: "Pink", swatch: "bg-[#f6e2f7] dark:bg-[#3a2740]" },
  { id: "blue", label: "Blue", swatch: "bg-[#dbeafe] dark:bg-[#22354d]" },
  { id: "peach", label: "Peach", swatch: "bg-[#fde8cf] dark:bg-[#43331f]" },
  { id: "green", label: "Green", swatch: "bg-[#dcf3e4] dark:bg-[#233d31]" },
  { id: "lavender", label: "Lavender", swatch: "bg-[#e6e2fb] dark:bg-[#302b4a]" },
  { id: "teal", label: "Teal", swatch: "bg-[#d8f2ee] dark:bg-[#24413d]" },
] as const;

export type AccountColorId = (typeof ACCOUNT_COLORS)[number]["id"];

export const DEFAULT_ACCOUNT_COLOR: AccountColorId = "teal";

const COLOR_IDS = new Set<string>(ACCOUNT_COLORS.map((color) => color.id));

function isAccountColorId(value: string): value is AccountColorId {
  return COLOR_IDS.has(value);
}

/** Resolves a stored color id (or missing/legacy value) to a Tailwind swatch class. */
export function accountColorClass(color: string | undefined | null): string {
  const id = color && isAccountColorId(color) ? color : DEFAULT_ACCOUNT_COLOR;
  return ACCOUNT_COLORS.find((entry) => entry.id === id)!.swatch;
}
