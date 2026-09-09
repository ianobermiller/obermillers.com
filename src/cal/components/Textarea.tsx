import { clsx } from "clsx";
import type { TextareaHTMLAttributes } from "react";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(
        "box-border block w-full resize-y rounded-lg border border-cc-border bg-cc-surface p-3",
        "text-sm leading-relaxed text-cc-text shadow-xs placeholder:text-cc-faint",
        "focus-visible:border-cc-accent focus-visible:ring-1 focus-visible:ring-cc-accent",
        "focus-visible:outline-none read-only:text-cc-muted",
        className,
      )}
      {...props}
    />
  );
}
