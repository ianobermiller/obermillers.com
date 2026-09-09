import { clsx } from "clsx";
import type { ReactNode } from "react";

/**
 * The small uppercase label that carries most of the hierarchy in this design,
 * used for section headings and as a kicker above titles.
 */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        "text-[11px] font-semibold tracking-[0.09em] text-cc-muted uppercase",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A labelled block of content, e.g. "Trip notes". */
export function Section({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title: string;
}) {
  return (
    <section className={className}>
      <Eyebrow className="mb-2.5">{title}</Eyebrow>
      {children}
    </section>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border border-cc-border bg-cc-surface-2",
        "px-2 py-0.5 text-[11px] font-medium text-cc-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}
