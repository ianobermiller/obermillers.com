import { sumTransactions } from "@bank/core/balance";
import { listAccounts } from "@bank/core/familyBank";
import { Router } from "@bank/core/router";
import type { AccountSummary } from "@bank/core/types";
import { useAccountAccess } from "@bank/hooks/auth";
import { accountListSubscriptions, useLiveQuery } from "@bank/hooks/live";
import { Card } from "@bank/ui/Card";
import { PageTitle } from "@bank/ui/PageTitle";
import { accountColorClass } from "@bank/utils/accountColor";
import { cn } from "@bank/utils/cn";
import { formatCurrency } from "@bank/utils/formatCurrency";
import { Link } from "@zoontek/chicane";
import { PlusIcon } from "lucide-react";

export function AccountList() {
  const {
    canCreate: canCreateAccount,
    isLoading: isCanCreateLoading,
    isParent,
  } = useAccountAccess();
  const { data: bankAccounts } = useLiveQuery(listAccounts, {
    subscribe: accountListSubscriptions(),
  });
  const visibleAccounts = (bankAccounts ?? []).toSorted((a, b) => a.name.localeCompare(b.name));

  if (bankAccounts === undefined || isCanCreateLoading) {
    return null;
  }

  const onlyAccount = visibleAccounts[0];
  if (!isParent && visibleAccounts.length === 1 && onlyAccount !== undefined) {
    Router.replace("BankAccountDetails", { urlId: onlyAccount._id });
    return null;
  }

  if (visibleAccounts.length === 0 && !canCreateAccount) {
    return (
      <Card className="p-5 text-center">
        <p className="text-4xl">🔑</p>
        <p className="text-muted-foreground mt-3 font-semibold">
          Ask a parent to add your email to your account.
        </p>
      </Card>
    );
  }

  const total = sumTransactions(visibleAccounts.flatMap((account) => account.transactions));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <PageTitle>{isParent ? "Whose money?" : "Your money"}</PageTitle>
        <p className="text-muted-foreground font-semibold">
          {isParent
            ? "Tap a name to open their account."
            : "Tap to see everything you have saved up."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {visibleAccounts.map((account) => (
          <AccountCard account={account} key={account._id} />
        ))}

        {canCreateAccount && <NewAccountCard />}
      </div>

      {isParent && visibleAccounts.length > 1 && (
        <Card className="flex items-center gap-4 p-5">
          <span className="bg-brand-soft grid size-11 shrink-0 place-items-center rounded-md text-xl">
            🏦
          </span>
          <div>
            <p className="font-display text-xl font-bold">{formatCurrency(total)} in the bank</p>
            <p className="text-muted-foreground text-sm font-semibold">
              Everyone earns 4% a year, paid on the 1st.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

function AccountCard({ account }: { account: AccountSummary }) {
  return (
    <Link
      className="press border-border bg-card shadow-card flex flex-col items-center gap-1 rounded-xl border-2 p-4 text-center hover:-translate-y-[3px]"
      to={Router.BankAccountDetails({ urlId: account._id })}
    >
      <span
        className={cn(
          "mb-2 grid aspect-square w-full max-w-20 place-items-center rounded-full text-[15vw] sm:text-5xl",
          accountColorClass(account.color),
        )}
      >
        {account.emoji}
      </span>

      <span className="text-lg font-extrabold">{account.name}</span>
      <span className="text-brand-strong font-bold">
        {formatCurrency(sumTransactions(account.transactions))}
      </span>
    </Link>
  );
}

function NewAccountCard() {
  return (
    <Link
      className="press border-input text-muted-foreground hover:bg-accent flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed p-4 text-center"
      to={Router.BankNewAccount()}
    >
      <span className="bg-secondary mb-2 grid aspect-square w-full max-w-20 place-items-center rounded-full">
        <PlusIcon className="size-8" />
      </span>

      <span className="text-lg font-extrabold">New</span>
    </Link>
  );
}
