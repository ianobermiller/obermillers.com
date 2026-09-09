import { Router } from "@bank/core/router";
import { BANK_ROUTE_NAMES } from "@bank/core/routes";
import { AuthProvider, useAccountAccess, useClaimAccount, useUser } from "@bank/hooks/auth";
import { AppMenu } from "@bank/ui/AppMenu";
import { Link } from "@zoontek/chicane";
import { match } from "ts-pattern";

import { ColorSchemeToggle } from "../theme/ColorSchemeToggle";
import { NotFound } from "./NotFound";
import { AccountDetails } from "./routes/AccountDetails";
import { AccountList } from "./routes/AccountList";
import { EditAccount } from "./routes/EditAccount";
import { Home } from "./routes/Home";
import { Login } from "./routes/Login";
import { NewAccount } from "./routes/NewAccount";
import { Settings } from "./routes/Settings";

export function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

function AppShell() {
  const { isLoading, queryError } = useAccountAccess();
  const user = useUser();

  let children = <Login />;

  if (user) {
    children = <AuthenticatedApp />;
  } else if (isLoading) {
    children = <p className="text-muted-foreground p-8 text-center font-semibold">Loading…</p>;
  } else if (queryError) {
    children = (
      <p className="text-destructive p-8 text-center font-semibold">Uh oh! {queryError}</p>
    );
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="bg-brand text-brand-foreground rounded-b-xl py-2">
        <div className="flex w-full items-center justify-between px-3 sm:mx-auto sm:max-w-5xl">
          <Link className="block cursor-pointer" to={Router.Bank()}>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">💰 Family Bank</h1>
          </Link>

          <div className="flex items-center gap-1">
            <ColorSchemeToggle className="hover:bg-brand-foreground/15 size-11 rounded-full" />
            <AppMenu />
          </div>
        </div>
      </header>

      <main className="w-full grow overflow-auto p-4 sm:mx-auto sm:max-w-5xl">{children}</main>
    </div>
  );
}

function AuthenticatedApp() {
  useClaimAccount();

  const route = Router.useRoute(BANK_ROUTE_NAMES);

  return match(route)
    .with({ name: "Bank" }, () => <Home />)
    .with({ name: "BankAccountList" }, () => <AccountList />)
    .with({ name: "BankAccountDetails" }, ({ params: { urlId } }) => (
      <AccountDetails urlId={urlId} />
    ))
    .with({ name: "BankNewAccount" }, () => <NewAccount />)
    .with({ name: "BankEditAccount" }, ({ params: { urlId } }) => <EditAccount urlId={urlId} />)
    .with({ name: "BankSettings" }, () => <Settings />)
    .otherwise(() => <NotFound />);
}
