import { cn } from "@bank/utils/cn";
import type { ComponentProps } from "react";
import { forwardRef } from "react";

type HeadingProps = ComponentProps<"h2">;

export const PageTitle = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <h2
        className={cn(
          "mb-1 font-display text-3xl font-bold tracking-tight text-balance",
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </h2>
    );
  },
);
