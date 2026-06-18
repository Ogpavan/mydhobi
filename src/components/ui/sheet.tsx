"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;

function SheetOverlay({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return <SheetPrimitive.Overlay className={cn("fixed inset-0 z-50 bg-emerald-950/45 backdrop-blur-sm", className)} {...props} />;
}

const sheetVariants = cva("fixed z-50 gap-4 bg-card p-6 shadow-soft transition ease-in-out", {
  variants: {
    side: {
      top: "inset-x-0 top-0 border-b rounded-b-md",
      bottom: "inset-x-0 bottom-0 border-t rounded-t-md",
      left: "inset-y-0 left-0 h-full w-80 border-r rounded-r-md",
      right: "inset-y-0 right-0 h-full w-80 border-l rounded-l-md",
    },
  },
  defaultVariants: {
    side: "right",
  },
});

interface SheetContentProps extends React.ComponentProps<typeof SheetPrimitive.Content>, VariantProps<typeof sheetVariants> {}

function SheetContent({ side = "right", className, children, ...props }: SheetContentProps) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content className={cn(sheetVariants({ side }), className)} {...props}>
        {children}
        <SheetPrimitive.Close className="absolute right-5 top-5 rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-2 text-left", className)} {...props} />;
}

function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-auto flex flex-col gap-2", className)} {...props} />;
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return <SheetPrimitive.Title className={cn("text-xl font-bold text-foreground", className)} {...props} />;
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return <SheetPrimitive.Description className={cn("text-sm leading-6 text-muted-foreground", className)} {...props} />;
}

export { Sheet, SheetPortal, SheetOverlay, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription };
