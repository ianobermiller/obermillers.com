import { clsx } from "clsx";
import type { TextareaHTMLAttributes } from "react";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(
        "box-border block w-full resize-y rounded border border-slate-400 p-2 text-base dark:text-slate-400 dark:focus:text-slate-100",
        className,
      )}
      {...props}
    />
  );
}
