"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Panneau coulissant : Drawer (côtés) et Bottom Sheet (bas). */
export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

type Side = "right" | "left" | "bottom";

const sideClasses: Record<Side, string> = {
  right:
    "inset-y-0 right-0 h-full w-[calc(100%-2.5rem)] max-w-md border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
  left:
    "inset-y-0 left-0 h-full w-[calc(100%-2.5rem)] max-w-md border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
  bottom:
    "inset-x-0 bottom-0 max-h-[92vh] w-full rounded-t-3xl border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
};

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { side?: Side; hideClose?: boolean }
>(({ className, children, side = "right", hideClose, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 flex flex-col bg-surface shadow-lifted transition data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-300",
        sideClasses[side],
        className,
      )}
      {...props}
    >
      {side === "bottom" && (
        <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-line" />
      )}
      {children}
      {!hideClose && (
        <DialogPrimitive.Close className="focus-ring absolute right-4 top-4 rounded-full p-2 text-muted transition hover:bg-shell hover:text-ink">
          <X className="h-5 w-5" />
          <span className="sr-only">Fermer</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
SheetContent.displayName = "SheetContent";

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-line px-5 py-4", className)} {...props} />;
}
export function SheetTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("text-lg font-semibold text-ink", className)} {...props} />;
}
export function SheetDescription({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("text-sm text-muted", className)} {...props} />;
}
export function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-auto border-t border-line p-5", className)} {...props} />;
}
