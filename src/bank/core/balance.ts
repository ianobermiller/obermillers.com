/** Interest is stored as a normal ledger entry, identified by its note. */
const INTEREST_NOTE = "Interest";

function isInterestTransaction(transaction: { note: string }): boolean {
  return transaction.note === INTEREST_NOTE;
}

export function sumTransactions(transactions: { value: number }[]): number {
  return transactions.reduce((sum, transaction) => sum + transaction.value, 0);
}

export function interestEarned(transactions: { note: string; value: number }[]): number {
  return sumTransactions(transactions.filter(isInterestTransaction));
}
