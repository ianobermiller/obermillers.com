// Family Bank's PocketBase collections. Applied by scripts/setup-pocketbase.mjs,
// which resolves `relation` names to collection ids. Keep in sync with
// src/bank/core/pbCollections.ts.

const ACCOUNT_ACCESS = `@request.auth.id != "" && (owner = @request.auth.id || member = @request.auth.id || childEmail = @request.auth.email)`;
const NESTED_ACCOUNT_ACCESS = `@request.auth.id != "" && (@request.body.account.owner = @request.auth.id || @request.body.account.member = @request.auth.id || @request.body.account.childEmail = @request.auth.email)`;
const PARENT_OF_ACCOUNT = `account.owner = @request.auth.id`;
const CREATE_ACCOUNT = `@request.auth.id != "" && @request.body.owner = @request.auth.id`;
const UPDATE_ACCOUNT = `owner = @request.auth.id || (childEmail = @request.auth.email && @request.body.member = @request.auth.id) || (member = @request.auth.id && @request.body.name:isset = false && @request.body.owner:isset = false && @request.body.member:isset = false && @request.body.childEmail:isset = false)`;
const CREATE_TRANSACTION = `${NESTED_ACCOUNT_ACCESS} && @request.body.owner = @request.body.account.owner && ((@request.body.account.owner = @request.auth.id && @request.body.isFromParent = true) || (@request.body.account.owner != @request.auth.id && @request.body.isFromParent = false))`;
const CREATE_PRESET = `${NESTED_ACCOUNT_ACCESS} && @request.body.owner = @request.body.account.owner`;
const PRESET_MUTATE = `account.owner = @request.auth.id || account.member = @request.auth.id || account.childEmail = @request.auth.email`;

export const bankCollections = {
  accounts: "familybank_accounts",
  presets: "familybank_presets",
  transactions: "familybank_transactions",
};

const owner = { name: "owner", relation: "users", required: true };

export const bankSchema = [
  {
    fields: [
      { name: "name", required: true, type: "text" },
      { name: "emoji", required: true, type: "text" },
      { name: "color", type: "text" },
      { name: "childEmail", type: "email" },
      owner,
      { name: "member", relation: "users", required: false },
    ],
    indexes: ["owner", "member", "childEmail"],
    legacyName: "accounts",
    name: bankCollections.accounts,
    rules: {
      createRule: CREATE_ACCOUNT,
      deleteRule: "owner = @request.auth.id",
      listRule: ACCOUNT_ACCESS,
      updateRule: UPDATE_ACCOUNT,
      viewRule: ACCOUNT_ACCESS,
    },
  },
  {
    fields: [
      { cascadeDelete: true, name: "account", relation: bankCollections.accounts, required: true },
      owner,
      { name: "note", required: true, type: "text" },
      { name: "value", required: true, type: "number" },
    ],
    indexes: ["account"],
    legacyName: "presets",
    name: bankCollections.presets,
    rules: {
      createRule: CREATE_PRESET,
      deleteRule: PRESET_MUTATE,
      listRule: PRESET_MUTATE,
      updateRule: PRESET_MUTATE,
      viewRule: PRESET_MUTATE,
    },
  },
  {
    fields: [
      { cascadeDelete: true, name: "account", relation: bankCollections.accounts, required: true },
      owner,
      { name: "note", required: true, type: "text" },
      { name: "value", required: true, type: "number" },
      { name: "timestamp", required: true, type: "number" },
      { name: "isFromParent", required: true, type: "bool" },
    ],
    indexes: ["account", ["account", "timestamp"]],
    legacyName: "transactions",
    name: bankCollections.transactions,
    rules: {
      createRule: CREATE_TRANSACTION,
      deleteRule: PARENT_OF_ACCOUNT,
      listRule: PRESET_MUTATE,
      updateRule: PARENT_OF_ACCOUNT,
      viewRule: PRESET_MUTATE,
    },
  },
];
