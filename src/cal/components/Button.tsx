import { Link } from "@zoontek/chicane";
import { clsx } from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const commonClasses = "cursor-pointer disabled:opacity-50";
const commonButtonClasses =
  "inline-flex items-center rounded bg-slate-200 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600";
const buttonClasses = "h-8 gap-2 px-3";

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(buttonClasses, commonButtonClasses, commonClasses, className)}
      {...props}
    />
  );
}

export function ButtonLink({
  className,
  href,
  children,
}: {
  children: ReactNode;
  className?: string;
  href: string;
}) {
  return (
    <Link className={clsx(buttonClasses, commonButtonClasses, commonClasses, className)} to={href}>
      {children}
    </Link>
  );
}

export function IconButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(commonButtonClasses, commonClasses, "size-8 justify-center", className)}
      {...props}
    />
  );
}

export function LinkButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={clsx(commonClasses, "underline", className)} {...props} />;
}
