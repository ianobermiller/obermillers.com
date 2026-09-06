import { cn } from "@bank/utils/cn";
import type { ComponentProps } from "react";
import { forwardRef } from "react";

type HeadingProps = ComponentProps<"h3">;

export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <h3 className={cn("font-display text-xl font-bold tracking-tight", className)} ref={ref} {...props}>
        {children}
      </h3>
    );
  },
);
