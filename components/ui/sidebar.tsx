"use client";

import * as React from "react";
import { PanelLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
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
      className={cn(
        "h-full flex-col border-r border-[#DCE6F2] bg-white shadow-[8px_0_28px_rgba(15,23,42,0.04)] transition-[width,padding] duration-200 ease-out",
        collapsible ? (collapsed ? "w-[76px]" : "w-[264px]") : "w-full",
        className,
      )}
    >
      {children}
    </aside>
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
        "transition-[padding-left] duration-200 ease-out",
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
