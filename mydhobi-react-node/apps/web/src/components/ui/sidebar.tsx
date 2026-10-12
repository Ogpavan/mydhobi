import { cn } from "@/lib/utils";
import {
  Box,
  Divider,
  IconButton,
  List,
  ListItem,
  Paper,
  Tooltip,
} from "@mui/material";
import { PanelLeft } from "lucide-react";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type HTMLAttributes,
  type ReactNode,
  type SetStateAction,
} from "react";
type State = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  toggleSidebar: () => void;
};
const Context = createContext<State | null>(null);
export function useSidebar() {
  const state = useContext(Context);
  if (!state) throw new Error("Sidebar state is missing");
  return state;
}
export function SidebarProvider({
  defaultOpen = true,
  children,
}: {
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const state = useMemo(
    () => ({ open, setOpen, toggleSidebar: () => setOpen((value) => !value) }),
    [open],
  );
  return <Context.Provider value={state}>{children}</Context.Provider>;
}
export function Sidebar({
  className,
  collapsible = true,
  children,
}: HTMLAttributes<HTMLElement> & { collapsible?: boolean }) {
  const { open } = useSidebar();
  const collapsed = collapsible && !open;
  return (
    <Paper
      component="aside"
      square
      data-state={collapsed ? "collapsed" : "expanded"}
      data-slot="sidebar"
      className={cn(
        "h-full min-h-0 flex-col overflow-hidden",
        collapsible ? (collapsed ? "w-[76px]" : "w-[264px]") : "w-full",
        className,
      )}
      sx={{ borderRight: 1, borderColor: "divider" }}
    >
      {children}
    </Paper>
  );
}
export function SidebarHeader(props: HTMLAttributes<HTMLDivElement>) {
  return <Box data-slot="sidebar-header" {...props} />;
}
export function SidebarContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <Box
      data-slot="sidebar-content"
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overflow-x-hidden",
        className,
      )}
      {...props}
    />
  );
}
export function SidebarMenu(props: HTMLAttributes<HTMLUListElement>) {
  return <List disablePadding data-slot="sidebar-menu" {...props} />;
}
export function SidebarMenuItem(props: HTMLAttributes<HTMLLIElement>) {
  return <ListItem disablePadding data-slot="sidebar-menu-item" {...props} />;
}
export const SidebarSeparator = Divider;
export function SidebarInset({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { open } = useSidebar();
  return (
    <Box
      className={cn(
        "min-w-0",
        open ? "lg:pl-[264px]" : "lg:pl-[76px]",
        className,
      )}
      {...props}
    />
  );
}
export function SidebarTrigger({ className }: { className?: string }) {
  const { toggleSidebar } = useSidebar();
  return (
    <Tooltip title="Toggle menu">
      <IconButton
        className={className}
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        <PanelLeft size={20} />
      </IconButton>
    </Tooltip>
  );
}
