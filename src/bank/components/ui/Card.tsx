import { cn } from "@bank/utils/cn";
import type { ComponentProps } from "react";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-xl border-2 border-border bg-card shadow-card", className)}
      {...props}
    />
  );
}
