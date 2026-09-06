import { cn } from "@bank/utils/cn";
import type { ComponentProps } from "react";
import { forwardRef } from "react";
import { Drawer as DrawerPrimitive } from "vaul";

export const Drawer = ({
  shouldScaleBackground = true,
  ...props
}: ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...props} />
);

export const DrawerTrigger = DrawerPrimitive.Trigger;

export const DrawerClose = DrawerPrimitive.Close;

const DrawerPortal = DrawerPrimitive.Portal;

const DrawerOverlay = forwardRef<HTMLDivElement, ComponentProps<typeof DrawerPrimitive.Overlay>>(
  ({ className, ...props }, ref) => {
    return (
      <DrawerPrimitive.Overlay
        className={cn("fixed inset-0 z-50 bg-black/80", className)}
        {...props}
        ref={ref}
      />
    );
  },
);

export function DrawerContent({
  children,
  className,
  ...props
}: ComponentProps<typeof DrawerPrimitive.Content>) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-xl border-2 bg-background",
          className,
        )}
        {...props}
      >
        <div className="bg-muted mx-auto mt-4 h-2 w-[100px] rounded-full" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}

export function DrawerFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />;
}

export function DrawerHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)} {...props} />;
}

export function DrawerTitle({ className, ...props }: ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      className={cn("text-lg leading-none font-semibold tracking-tight", className)}
      {...props}
    />
  );
}
