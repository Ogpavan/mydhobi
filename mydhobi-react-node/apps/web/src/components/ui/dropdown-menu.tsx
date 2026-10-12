import { Divider, Menu, MenuItem, Typography } from "@mui/material";
import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useId,
  useState,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { Button } from "./button";
type State = {
  anchor: HTMLElement | null;
  setAnchor: (anchor: HTMLElement | null) => void;
  id: string;
};
const Context = createContext<State | null>(null);
function useMenu() {
  const state = useContext(Context);
  if (!state) throw new Error("Menu state is missing");
  return state;
}
export function DropdownMenu({
  children,
  onOpenChange,
}: {
  children: ReactNode;
  onOpenChange?: (open: boolean) => void;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const id = useId();
  return (
    <Context.Provider
      value={{
        anchor,
        setAnchor: (value) => {
          setAnchor(value);
          onOpenChange?.(Boolean(value));
        },
        id,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function DropdownMenuTrigger({
  asChild,
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  const state = useMenu();
  const bindings = {
    "aria-haspopup": "menu" as const,
    "aria-expanded": Boolean(state.anchor),
    "aria-controls": state.anchor ? state.id : undefined,
    onClick: (event: React.MouseEvent<HTMLElement>) =>
      state.setAnchor(event.currentTarget),
  };
  if (asChild && isValidElement(children))
    return cloneElement(
      children as ReactElement<Record<string, unknown>>,
      bindings,
    );
  return (
    <Button {...props} {...bindings}>
      {children}
    </Button>
  );
}
export function DropdownMenuContent({
  children,
  align = "start",
  sideOffset: _sideOffset,
  className,
}: HTMLAttributes<HTMLDivElement> & {
  align?: "start" | "end" | "center";
  sideOffset?: number;
}) {
  const state = useMenu();
  const horizontal = align === "end" ? "right" : "left";
  return (
    <Menu
      id={state.id}
      anchorEl={state.anchor}
      open={Boolean(state.anchor)}
      onClose={() => state.setAnchor(null)}
      anchorOrigin={{ vertical: "bottom", horizontal }}
      transformOrigin={{ vertical: "top", horizontal }}
      slotProps={{ paper: { className, sx: { boxShadow: 3, minWidth: 160 } } }}
    >
      {children}
    </Menu>
  );
}
export function DropdownMenuItem({
  children,
  onSelect,
  onClick,
  disabled,
  asChild,
  ...props
}: Omit<HTMLAttributes<HTMLLIElement>, "onSelect"> & {
  onSelect?: (event: Event) => void;
  disabled?: boolean;
  asChild?: boolean;
}) {
  const state = useMenu();
  const handleClick = (event: React.MouseEvent<HTMLLIElement>) => {
    onClick?.(event);
    onSelect?.(event.nativeEvent);
    state.setAnchor(null);
  };
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<Record<string, unknown>>;
    return (
      <MenuItem
        component={child.type as React.ElementType}
        {...child.props}
        disabled={disabled}
        onClick={handleClick}
        {...props}
      >
        {child.props.children as ReactNode}
      </MenuItem>
    );
  }
  return (
    <MenuItem disabled={disabled} onClick={handleClick} {...props}>
      {children}
    </MenuItem>
  );
}
export function DropdownMenuSeparator() {
  return <Divider />;
}
export function DropdownMenuLabel(
  props: HTMLAttributes<HTMLDivElement> & { inset?: boolean },
) {
  const { inset: _inset, ...rest } = props;
  return (
    <Typography
      component="div"
      sx={{ px: 2, py: 1, fontWeight: 600 }}
      {...rest}
    />
  );
}
export function DropdownMenuGroup({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
