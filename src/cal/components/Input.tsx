import { clsx } from "clsx";
import type { ComponentProps } from "react";

export function Input({ className, type, ref, ...props }: ComponentProps<"input">) {
  const isCheckbox = type === "checkbox";
  return (
    <input
      className={clsx(
        "box-border border-cc-border bg-cc-surface text-cc-text",
        isCheckbox
          ? "size-4 rounded accent-cc-accent"
          : "inline-block h-9 rounded-lg border px-3 text-sm shadow-xs placeholder:text-cc-faint " +
              "focus-visible:border-cc-accent focus-visible:ring-1 focus-visible:ring-cc-accent " +
              "focus-visible:outline-none read-only:text-cc-muted disabled:opacity-50",
        className,
      )}
      ref={ref}
      type={type}
      {...props}
    />
  );
}
