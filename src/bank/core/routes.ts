import { createGroup } from "@zoontek/chicane";

/** Hub `useRoute` name: any `/bank` URL, including nested screens. */
export const BANK_AREA = "BankArea" as const;

export const bankPages = createGroup("Bank", "/bank", {
  "": "/",
  AccountList: "/accounts",
  NewAccount: "/accounts/new",
  AccountDetails: "/accounts/:urlId",
  EditAccount: "/accounts/:urlId/edit",
  Settings: "/settings",
});

export const BANK_ROUTE_NAMES = Object.keys(bankPages) as Array<keyof typeof bankPages>;

export const bankRoutes = {
  [BANK_AREA]: "/bank/*",
  ...bankPages,
};
