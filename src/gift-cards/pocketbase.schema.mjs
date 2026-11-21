const AUTH = '@request.auth.id != ""';
const OWNER = `${AUTH} && owner = @request.auth.id`;
const SHARED =
  "(@request.auth.verified = true && giftcard_access_via_card.email ?= @request.auth.email)";
const READ = `${AUTH} && (owner = @request.auth.id || ${SHARED})`;

export const giftCardSchema = [
  {
    name: "giftcards",
    fields: [
      { name: "owner", relation: "users", required: true },
      { name: "merchant", type: "text", required: true, max: 120 },
      { name: "balanceCheckedAt", type: "date" },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      { name: "balance", type: "number", min: 0, max: 100000000, onlyInt: true },
      {
        name: "currency",
        type: "select",
        required: true,
        values: ["USD", "CAD", "EUR", "GBP"],
        maxSelect: 1,
      },
      { name: "number", type: "text", hidden: true, max: 512, pattern: "^$|^gcv1:[A-Za-z0-9+/]+$" },
      { name: "pin", type: "text", hidden: true, max: 512, pattern: "^$|^gcv1:[A-Za-z0-9+/]+$" },
      { name: "expires", type: "text", pattern: "^$|^\\d{4}-\\d{2}-\\d{2}$", max: 10 },
      { name: "notes", type: "text", max: 2000 },
    ],
    indexes: ["owner"],
    rules: {
      listRule: READ,
      viewRule: READ,
      createRule: `${AUTH} && @request.body.owner = @request.auth.id`,
      updateRule: `${OWNER} && @request.body.owner:changed = false`,
      deleteRule: OWNER,
    },
  },
  {
    name: "giftcard_access",
    fields: [
      { name: "card", relation: "giftcards", required: true, cascadeDelete: true },
      { name: "email", type: "email", required: true },
    ],
    indexes: [{ columns: ["card", "email"], unique: true }],
    rules: {
      listRule: `${AUTH} && card.owner = @request.auth.id`,
      viewRule: `${AUTH} && card.owner = @request.auth.id`,
      createRule: `${AUTH} && @request.body.card.owner = @request.auth.id`,
      updateRule: null,
      deleteRule: `${AUTH} && card.owner = @request.auth.id`,
    },
  },
];
