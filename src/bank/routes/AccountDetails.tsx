import { interestEarned, sumTransactions } from "@bank/core/balance";
import { createTransaction, getAccount } from "@bank/core/familyBank";
import { Router } from "@bank/core/router";
import { TRANSACTION_SCHEMA } from "@bank/core/schemas";
import type { Transaction } from "@bank/core/types";
import { accountDetailSubscriptions, useLiveQuery } from "@bank/hooks/live";
import { useForm } from "@bank/hooks/useForm";
import { Button, ButtonLink } from "@bank/ui/Button";
import { Card } from "@bank/ui/Card";
import { Heading } from "@bank/ui/Heading";
import { Input } from "@bank/ui/Input";
import { SignedMoney } from "@bank/ui/Money";
import { PageTitle } from "@bank/ui/PageTitle";
import { accountColorClass } from "@bank/utils/accountColor";
import { cn } from "@bank/utils/cn";
import { formatCurrency } from "@bank/utils/formatCurrency";
import { transactionEmoji } from "@bank/utils/transactionEmoji";
import { Settings } from "lucide-react";
import { useCallback } from "react";
import * as v from "valibot";

import {
  TransactionFeedbackProvider,
  useTransactionFeedback,
} from "../components/TransactionFeedback";
import { EditTransaction } from "./EditTransaction";

interface Props {
  urlId: string;
}

export function AccountDetails({ urlId }: Props) {
  return (
    <TransactionFeedbackProvider>
      <AccountDetailsInner urlId={urlId} />
    </TransactionFeedbackProvider>
  );
}

function AccountDetailsInner({ urlId }: Props) {
  const { data: account, reload } = useLiveQuery(() => getAccount(urlId), {
    key: urlId,
    subscribe: accountDetailSubscriptions(urlId),
  });
  const transactions = (account?.transactions ?? []).toSorted((a, b) => b.timestamp - a.timestamp);
  const presets = account?.presets ?? [];

  if (!account) return null;

  const balance = sumTransactions(transactions);
  const interest = interestEarned(transactions);
  const latest = transactions[0];

  return (
    <div className="flex flex-grow flex-col gap-6">
      <div className="flex place-items-center justify-between gap-2">
        <div>
          <PageTitle>{account.name}&rsquo;s money</PageTitle>
          <p className="text-muted-foreground font-semibold">
            {latest
              ? `Last change ${new Date(latest.timestamp).toLocaleDateString()}`
              : "Nothing here yet"}
          </p>
        </div>

        <ButtonLink
          size="icon"
          title={account.isParent ? "Edit account" : "Change look"}
          to={Router.BankEditAccount({ urlId: account._id })}
          variant="ghost"
        >
          <Settings />
        </ButtonLink>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="flex flex-col gap-6 sm:w-80 sm:shrink-0">
          <Balance
            balance={balance}
            color={account.color}
            emoji={account.emoji}
            interest={interest}
          />

          <section className="flex flex-col gap-3">
            <Heading>Quick buttons</Heading>

            {presets.length === 0 ? (
              <p className="text-muted-foreground text-sm font-semibold">
                {account.isParent
                  ? "Add presets in account settings for one-tap allowance and chores."
                  : "Add your own in settings — tap the gear up top."}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {presets.map((preset) => (
                  <PresetButton
                    accountId={account._id}
                    key={preset._id}
                    note={preset.note}
                    onChanged={reload}
                    value={preset.value}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <Heading>Something else?</Heading>
            <CustomTransaction accountId={account._id} onChanged={reload} />
          </section>
        </div>

        <section className="flex grow flex-col gap-3">
          <Heading>{transactions.length ? "What happened" : "Nothing has happened yet"}</Heading>
          <TransactionList
            canManage={account.isParent}
            onChanged={reload}
            transactions={transactions}
          />
        </section>
      </div>
    </div>
  );
}

function Balance({
  balance,
  color,
  emoji,
  interest,
}: {
  balance: number;
  color?: string | undefined;
  emoji: string;
  interest: number;
}) {
  const { coinRef, motion } = useTransactionFeedback();
  const polarity = motion?.polarity;

  return (
    <Card className="from-brand-soft to-card flex flex-col items-center bg-linear-to-b p-6 text-center">
      <span
        className={cn(
          "mb-4 grid size-24 place-items-center rounded-full border-4 border-brand text-5xl",
          accountColorClass(color),
          polarity === "in" && "anim-coin-in",
          polarity === "out" && "anim-coin-out",
        )}
        key={motion ? `coin-${motion.key}` : "coin"}
        ref={(node) => {
          coinRef.current = node;
        }}
      >
        {emoji}
      </span>

      <span className="text-muted-foreground text-sm font-bold tracking-widest uppercase">
        You have
      </span>
      <span
        className={cn(
          "inline-block font-display text-4xl font-bold tracking-tight",
          polarity === "in" && "anim-amt-in",
          polarity === "out" && "anim-amt-out",
        )}
        key={motion ? `amt-${motion.key}` : "amt"}
      >
        {formatCurrency(balance)}
      </span>

      {interest > 0 && (
        <span className="bg-gold-soft text-gold-strong mt-3 rounded-full px-4 py-1.5 text-sm font-bold">
          ✨ {formatCurrency(interest)} earned from interest
        </span>
      )}
    </Card>
  );
}

function CustomTransaction({ accountId, onChanged }: { accountId: string; onChanged: () => void }) {
  const { celebrate } = useTransactionFeedback();
  const { errors, handleSubmit } = useForm({
    async onSubmit({ data, form }) {
      form.reset();
      const txId = await createTransaction({
        accountId,
        note: data.note,
        value: data.value,
      });
      onChanged();
      celebrate({ id: txId, note: data.note, value: data.value });
    },
    schema: v.pick(TRANSACTION_SCHEMA, ["note", "value"]),
  });

  return (
    <>
      <form
        className="border-input bg-secondary grid grid-cols-[6rem_1fr] gap-3 rounded-xl border-2 border-dashed p-4"
        onSubmit={handleSubmit}
      >
        <Input
          aria-label="Value (required)"
          name="value"
          placeholder="0"
          required
          step={0.01}
          type="number"
        />
        <Input aria-label="Note (required)" name="note" placeholder="Note" required type="text" />
        <Button className="col-span-2" type="submit">
          Add it
        </Button>
      </form>
      {errors}
    </>
  );
}

function PresetButton({
  accountId,
  note,
  onChanged,
  value,
}: {
  accountId: string;
  note: string;
  onChanged: () => void;
  value: number;
}) {
  const { celebrate } = useTransactionFeedback();
  const handleClick = useCallback(async () => {
    const txId = await createTransaction({ accountId, note, value });
    onChanged();
    celebrate({ id: txId, note, value });
  }, [accountId, celebrate, note, onChanged, value]);

  const isPositive = value > 0;

  return (
    <button
      className="press border-border bg-card shadow-card hover:border-brand/50 flex items-center gap-3 rounded-xl border-2 p-3 text-left"
      onClick={handleClick}
      type="button"
    >
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-full text-xl font-extrabold text-white",
          isPositive ? "bg-money-in-solid" : "bg-money-out-solid",
        )}
      >
        {isPositive ? "+" : "–"}
      </span>

      <span className="min-w-0">
        <span className="block font-extrabold">{formatCurrency(Math.abs(value))}</span>
        <span className="text-muted-foreground line-clamp-2 block text-sm font-bold">{note}</span>
      </span>
    </button>
  );
}

function TransactionList({
  canManage,
  onChanged,
  transactions,
}: {
  canManage: boolean;
  onChanged: () => void;
  transactions: Transaction[];
}) {
  const { flashId } = useTransactionFeedback();
  const rows = transactions.reduce<
    { balanceAfter: number; transaction: Transaction }[]
  >((acc, transaction) => {
    const previous = acc.at(-1);
    const balanceAfter =
      previous === undefined
        ? sumTransactions(transactions)
        : previous.balanceAfter - previous.transaction.value;
    acc.push({ balanceAfter, transaction });
    return acc;
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {rows.map(({ balanceAfter, transaction }) => {
        const flashing = flashId === transaction._id;

        return (
          <Card
            className={cn(
              "flex items-center gap-3 p-3",
              flashing && transaction.value > 0 && "anim-row-flash-in",
              flashing && transaction.value < 0 && "anim-row-flash-out",
            )}
            key={transaction._id}
          >
            <span
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-md text-lg",
                transaction.value < 0 ? "bg-destructive/10" : "bg-brand-soft",
              )}
            >
              {transactionEmoji(transaction.note, transaction.value)}
            </span>

            <div className="min-w-0 grow">
              <div className="truncate font-extrabold">{transaction.note}</div>
              <div className="text-muted-foreground flex items-center gap-2 text-sm font-semibold">
                {new Date(transaction.timestamp).toLocaleDateString()}
                {canManage && transaction.isFromParent && (
                  <span className="text-muted-foreground/80 text-xs font-semibold">· verified</span>
                )}
              </div>
            </div>

            <div className="shrink-0 text-right">
              <SignedMoney value={transaction.value} />
              <div className="text-muted-foreground text-xs font-bold">
                {formatCurrency(balanceAfter)}
              </div>
            </div>

            {canManage && <EditTransaction onChanged={onChanged} transaction={transaction} />}
          </Card>
        );
      })}
    </div>
  );
}
