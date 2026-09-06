import { cn } from "@bank/utils/cn";
import { formatSignedCurrency } from "@bank/utils/formatCurrency";

interface Props {
  className?: string;
  value: number;
}

export function SignedMoney({ className, value }: Props) {
  return (
    <span className={cn("font-bold", value < 0 ? "text-money-out" : "text-money-in", className)}>
      {formatSignedCurrency(value)}
    </span>
  );
}
