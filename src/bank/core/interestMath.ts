export const INTEREST_NOTE = "Interest";

const APY = 0.04;
const DAILY_INTEREST_RATE = (((1 + APY) ** (1 / 12) - 1) * 12) / 365;

export function isInterestTransaction(transaction: { note: string }): boolean {
  return transaction.note === INTEREST_NOTE;
}

function startOfLocalDay(timestamp: number): number {
  const day = new Date(timestamp);
  day.setHours(0, 0, 0, 0);
  return day.getTime();
}

export function planInterest(
  transactions: { note: string; timestamp: number; value: number }[],
): Map<number, number> {
  const sorted = transactions.toSorted((a, b) => a.timestamp - b.timestamp);
  const otherTx = sorted.filter((tx) => !isInterestTransaction(tx));
  const newInterestTx = new Map<number, number>();
  const firstTx = otherTx[0];
  if (!firstTx) {
    return newInterestTx;
  }

  let day = startOfLocalDay(firstTx.timestamp);
  const today = Date.now();
  let txIndex = 0;
  let balance = 0;
  let interestForMonth = 0;
  while (day < today) {
    const date = new Date(day);
    if (date.getDate() === 1) {
      balance += interestForMonth;
      newInterestTx.set(day, interestForMonth);
      interestForMonth = 0;
    }

    while (txIndex < otherTx.length) {
      const tx = otherTx[txIndex];
      if (tx === undefined || tx.timestamp >= day) {
        break;
      }

      balance += tx.value;
      txIndex++;
    }

    const dailyInterest = Math.round(balance * DAILY_INTEREST_RATE);
    interestForMonth += dailyInterest;

    date.setDate(date.getDate() + 1);
    day = date.getTime();
  }

  return newInterestTx;
}
