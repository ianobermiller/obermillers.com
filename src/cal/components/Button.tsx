import { Link } from "@zoontek/chicane";
import { clsx } from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "danger" | "ghost" | "primary" | "secondary";

const base =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg text-sm font-medium " +
  "transition-colors focus-visible:ring-2 focus-visible:ring-cc-accent focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-cc-page focus-visible:outline-none disabled:cursor-default disabled:opacity-40";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-cc-accent text-cc-accent-text hover:bg-cc-accent-hover",
  secondary:
    "border border-cc-border bg-cc-surface text-cc-text shadow-xs hover:bg-cc-surface-2 " +
    "disabled:hover:bg-cc-surface",
  ghost: "text-cc-muted hover:bg-cc-surface-2 hover:text-cc-text",
  danger: "border border-cc-border bg-cc-surface text-cc-danger shadow-xs hover:bg-cc-surface-2",
};

export function Button({
  className,
  variant = "secondary",
  ...props
}: { variant?: ButtonVariant } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={clsx(base, "h-9 px-3.5", variants[variant], className)} {...props} />;
}

export function ButtonLink({
  children,
  className,
  href,
  variant = "secondary",
}: {
  children: ReactNode;
  className?: string;
  href: string;
  variant?: ButtonVariant;
}) {
  return (
    <Link className={clsx(base, "h-9 px-3.5", variants[variant], className)} to={href}>
      {children}
    </Link>
  );
}

export function IconButton({
  className,
  variant = "secondary",
  ...props
}: { variant?: ButtonVariant } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={clsx(base, "size-9", variants[variant], className)} {...props} />;
}

export function LinkButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        "cursor-pointer text-cc-muted underline decoration-cc-rule underline-offset-2",
        "hover:text-cc-text hover:decoration-cc-text disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}
