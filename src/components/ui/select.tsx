"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

function SelectTrigger({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "flex h-12 w-full items-center justify-between gap-2 rounded-md border border-input bg-white px-4 py-2 text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="size-4 opacity-60" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectScrollUpButton({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return <SelectPrimitive.ScrollUpButton className={cn("flex cursor-default items-center justify-center py-1", className)} {...props}><ChevronUp className="size-4" /></SelectPrimitive.ScrollUpButton>;
}

function SelectScrollDownButton({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return <SelectPrimitive.ScrollDownButton className={cn("flex cursor-default items-center justify-center py-1", className)} {...props}><ChevronDown className="size-4" /></SelectPrimitive.ScrollDownButton>;
}

function SelectContent({ className, children, position = "popper", ...props }: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={cn(
          "relative z-50 max-h-80 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-soft data-[state=open]:animate-in",
          position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
          className,
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport className={cn("p-1", position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]")}>
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return <SelectPrimitive.Label className={cn("px-3 py-2 text-xs font-bold text-muted-foreground", className)} {...props} />;
}

function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn("relative flex w-full cursor-default select-none items-center rounded-md py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:bg-secondary data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className)}
      {...props}
    >
      <span className="absolute left-3 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="size-4 text-primary" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return <SelectPrimitive.Separator className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />;
}

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton };
