"use client";

import * as React from "react";
import { PanelLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type SidebarContextValue = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const context = React.useContext(SidebarContext);

  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }

  return context;
}

export function SidebarProvider({
  defaultOpen = true,
  children,
}: {
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  const value = React.useMemo(
    () => ({
      open,
      setOpen,
      toggleSidebar: () => setOpen((current) => !current),
    }),
    [open],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function Sidebar({
  className,
  collapsible = true,
  children,
}: React.HTMLAttributes<HTMLElement> & {
  collapsible?: boolean;
}) {
  const { open } = useSidebar();
  const collapsed = collapsible && !open;

  return (
    <aside
      data-state={collapsed ? "collapsed" : "expanded"}
      data-slot="sidebar"
      className={cn(
        "h-full min-h-0 flex-col overflow-hidden border-r border-[#DCE6F2] bg-white shadow-[8px_0_28px_rgba(15,23,42,0.04)] transition-[width,padding] duration-200 ease-out",
        collapsible ? (collapsed ? "w-[76px]" : "w-[264px]") : "w-full",
        className,
      )}
    >
      {children}
    </aside>
  );
}

export function SidebarHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn("flex shrink-0 flex-col", className)}
      {...props}
    />
  );
}

export function SidebarContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain [scrollbar-color:#C9D8E8_transparent] [scrollbar-width:thin]",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarMenu({
  className,
  ...props
}: React.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul
      data-slot="sidebar-menu"
      className={cn("flex w-full min-w-0 flex-col", className)}
      {...props}
    />
  );
}

export function SidebarMenuItem({
  className,
  ...props
}: React.HTMLAttributes<HTMLLIElement>) {
  return (
    <li
      data-slot="sidebar-menu-item"
      className={cn("relative", className)}
      {...props}
    />
  );
}

export function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      className={cn("w-full bg-[#DCE6F2]", className)}
      {...props}
    />
  );
}

export function SidebarInset({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  const { open } = useSidebar();

  return (
    <div
      className={cn(
        "min-w-0 transition-[padding-left] duration-200 ease-out",
        open ? "lg:pl-[264px]" : "lg:pl-[76px]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SidebarTrigger({
  className,
}: {
  className?: string;
}) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn("h-[36px] w-[36px] rounded border-[#DCE6F2] bg-white", className)}
      onClick={toggleSidebar}
      aria-label="Toggle sidebar"
    >
      <PanelLeft className="h-4 w-4 text-[#385071]" />
    </Button>
  );
}
