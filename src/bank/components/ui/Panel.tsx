import { Card } from "@bank/ui/Card";
import { Heading } from "@bank/ui/Heading";
import { cn } from "@bank/utils/cn";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  icon: ReactNode;
  title: string;
  tone?: "danger" | "default";
}

export function Panel({ children, className, description, icon, title, tone = "default" }: Props) {
  return (
    <Card
      className={cn(
        "flex flex-col gap-4 p-5",
        tone === "danger" && "border-destructive/40",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-md text-xl",
            tone === "danger" ? "bg-destructive/10" : "bg-brand-soft",
          )}
        >
          {icon}
        </span>

        <div>
          <Heading>{title}</Heading>
          {description ? (
            <p className="text-muted-foreground mt-0.5 text-sm font-semibold">{description}</p>
          ) : null}
        </div>
      </div>

      {children}
    </Card>
  );
}
