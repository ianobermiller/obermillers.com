import { Link } from "@zoontek/chicane";
import type { ReactNode } from "react";

export function PageShell({
  backTo,
  backLabel,
  title,
  description,
  children,
  wide = false,
  footer,
}: {
  backTo: string;
  backLabel: string;
  title?: string | undefined;
  description?: string | undefined;
  children: ReactNode;
  wide?: boolean | undefined;
  footer?: ReactNode | undefined;
}) {
  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-12 font-sans text-zinc-100 sm:px-8">
      <div className={`mx-auto w-full ${wide ? "max-w-5xl" : "max-w-3xl"}`}>
        <Link
          className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500 no-underline hover:text-white"
          to={backTo}
        >
          {backLabel}
        </Link>
        {title !== undefined && (
          <h1 className="mt-4 font-serif text-5xl leading-[0.95] tracking-tight sm:text-6xl">
            {title}
          </h1>
        )}
        {description !== undefined && (
          <p className="mt-6 max-w-lg text-sm leading-relaxed text-zinc-400">
            {description}
          </p>
        )}
        <div className={title !== undefined ? "mt-10" : "mt-8"}>{children}</div>
        {footer}
      </div>
    </main>
  );
}
