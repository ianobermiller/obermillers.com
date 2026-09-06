import { ACCOUNT_COLORS } from "@bank/utils/accountColor";
import { DEFAULT_ACCOUNT_EMOJI } from "@bank/utils/accountEmojis";
import * as v from "valibot";

const OPTIONAL_CHILD_EMAIL = v.optional(
  v.pipe(v.string(), v.trim(), v.union([v.literal(""), v.pipe(v.string(), v.email())])),
);

const ACCOUNT_COLOR = v.pipe(
  v.string(),
  v.picklist(
    ACCOUNT_COLORS.map((color) => color.id),
    "Pick a color.",
  ),
);

export const ACCOUNT_SCHEMA = v.object({
  childEmail: OPTIONAL_CHILD_EMAIL,
  color: ACCOUNT_COLOR,
  emoji: v.pipe(
    v.string(),
    v.trim(),
    v.transform((emoji) => emoji || DEFAULT_ACCOUNT_EMOJI),
  ),
  name: v.pipe(v.string(), v.trim(), v.minLength(1, "Name is required.")),
});

export const ACCOUNT_APPEARANCE_SCHEMA = v.pick(ACCOUNT_SCHEMA, ["color", "emoji"]);

export const TRANSACTION_SCHEMA = v.object({
  note: v.pipe(v.string(), v.trim(), v.minLength(1, "Note is required.")),
  timestamp: v.pipe(
    v.union([v.string(), v.number()]),
    v.transform((s) => {
      const d = new Date(String(s));
      d.setMinutes(d.getTimezoneOffset());
      return d.getTime();
    }),
  ),
  value: v.pipe(
    v.string(),
    v.transform(Number),
    v.transform((amount) => amount * 100),
    v.integer(),
  ),
});
