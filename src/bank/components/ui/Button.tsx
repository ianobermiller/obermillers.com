import { cn } from "@bank/utils/cn";
import { Link } from "@zoontek/chicane";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { forwardRef } from "react";

const buttonVariants = cva(
  "press inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-bold whitespace-nowrap focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "h-11 px-5",
        icon: "size-11 rounded-full",
        lg: "h-13 px-8 text-lg",
        sm: "h-9 rounded-sm px-3 text-sm",
      },
      variant: {
        default: "bg-primary text-primary-foreground shadow-press hover:brightness-105",
        destructive:
          "bg-destructive text-destructive-foreground shadow-press-danger hover:brightness-105",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-brand-strong underline-offset-4 hover:underline",
        outline: "border-2 border-input bg-card shadow-press-neutral hover:bg-accent",
        secondary:
          "bg-secondary text-secondary-foreground shadow-press-neutral hover:brightness-[0.98]",
      },
    },
  },
);

export interface ButtonProps extends ComponentProps<"button">, SharedProps {}

type SharedProps = VariantProps<typeof buttonVariants>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size, variant, ...props }, ref) => (
    <button className={cn(buttonVariants({ className, size, variant }))} ref={ref} {...props} />
  ),
);

export interface ButtonLinkProps extends SharedProps {
  children?: ComponentProps<"a">["children"];
  className?: string | undefined;
  title?: string | undefined;
  to: string;
}

export function ButtonLink({ children, className, size, title, to, variant }: ButtonLinkProps) {
  return (
    <Link className={cn(buttonVariants({ className, size, variant }))} title={title} to={to}>
      {children}
    </Link>
  );
}
