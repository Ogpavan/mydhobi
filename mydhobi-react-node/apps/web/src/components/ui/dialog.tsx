import {
  Box,
  IconButton,
  Dialog as MaterialDialog,
  DialogTitle as MaterialDialogTitle,
  Tooltip,
} from "@mui/material";
import { X } from "lucide-react";
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
  open: boolean;
  setOpen: (open: boolean) => void;
  titleId: string;
};
export const DialogState = createContext<State | null>(null);
export function useDialogState() {
  const state = useContext(DialogState);
  if (!state) throw new Error("Dialog state is missing");
  return state;
}
export function Dialog({
  open,
  defaultOpen = false,
  onOpenChange,
  children,
}: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}) {
  const [internal, setInternal] = useState(defaultOpen);
  const titleId = useId();
  return (
    <DialogState.Provider
      value={{
        open: open ?? internal,
        setOpen: (value) => {
          setInternal(value);
          onOpenChange?.(value);
        },
        titleId,
      }}
    >
      {children}
    </DialogState.Provider>
  );
}
export function DialogContent({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const state = useDialogState();
  const paperClassName = className
    ?.split(/\s+/)
    .filter((token) => token.startsWith("max-w-") || token.startsWith("w-"))
    .join(" ");
  return (
    <MaterialDialog
      open={state.open}
      onClose={() => state.setOpen(false)}
      aria-labelledby={state.titleId}
      slotProps={{
        paper: {
          className: paperClassName,
          sx: {
            boxSizing: "border-box",
            maxHeight: "90dvh",
            maxWidth: "calc(100% - 32px)",
            overflowX: "hidden",
            m: 2,
            width: "calc(100% - 32px)",
          },
        },
      }}
    >
      <Box
        {...props}
        sx={{
          position: "relative",
          minWidth: 0,
          width: "100%",
          boxSizing: "border-box",
        }}
        className={className?.replace(
          /\b(?:top-\S+|fixed|left-\S+|-translate-\S+)\b/g,
          "",
        )}
      >
        {children}
        <Tooltip title="Close">
          <IconButton
            aria-label="Close"
            onClick={() => state.setOpen(false)}
            sx={{ position: "absolute", top: 8, right: 8 }}
          >
            <X size={18} />
          </IconButton>
        </Tooltip>
      </Box>
    </MaterialDialog>
  );
}
export function DialogHeader(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        borderBottom: 1,
        borderColor: "divider",
        p: 2,
        pr: 6,
      }}
      {...props}
    />
  );
}
export function DialogTitle(props: HTMLAttributes<HTMLHeadingElement>) {
  const { titleId } = useDialogState();
  return <MaterialDialogTitle id={titleId} sx={{ p: 0 }} {...props} />;
}
function StateButton({
  asChild,
  children,
  close,
  ...props
}: React.ComponentProps<typeof Button> & { close?: boolean }) {
  const state = useDialogState();
  const onClick = () => state.setOpen(!close);
  if (asChild && isValidElement(children))
    return cloneElement(children as ReactElement<{ onClick?: () => void }>, {
      onClick,
    });
  return (
    <Button {...props} onClick={onClick}>
      {children}
    </Button>
  );
}
export function DialogTrigger(props: React.ComponentProps<typeof Button>) {
  return <StateButton {...props} />;
}
export function DialogClose(props: React.ComponentProps<typeof Button>) {
  return <StateButton close {...props} />;
}
