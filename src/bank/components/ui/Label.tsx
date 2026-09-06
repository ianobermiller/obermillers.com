import { cn } from "@bank/utils/cn";
import { Root as LabelPrimitive } from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

const labelVariants = cva(
  "text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

type Props = Omit<ComponentProps<typeof LabelPrimitive>, "ref"> &
  VariantProps<typeof labelVariants> & {
    required?: boolean;
  };

export function Label({ children, className, required, ...props }: Props) {
  return (
    <LabelPrimitive className={cn(labelVariants(), className)} {...props}>
      {children}
      {required ? <span className="text-destructive"> *</span> : null}
    </LabelPrimitive>
  );
}
