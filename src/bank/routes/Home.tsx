import { Router } from "@bank/core/router";

export function Home() {
  Router.replace("BankAccountList");
  return null;
}
