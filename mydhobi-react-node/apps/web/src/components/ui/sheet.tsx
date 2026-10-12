import { Box, Drawer, IconButton, Tooltip, Typography } from "@mui/material";
import { X } from "lucide-react";
import type { HTMLAttributes } from "react";
import { Dialog, DialogClose, DialogTrigger, useDialogState } from "./dialog";
export {
  Dialog as Sheet,
  DialogClose as SheetClose,
  DialogTrigger as SheetTrigger,
};
export function SheetContent({
  side = "right",
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  side?: "left" | "right" | "top" | "bottom";
}) {
  const state = useDialogState();
  const desktopWidth =
    Number(className?.match(/sm:(?:max-)?w-\[(\d+)px\]/)?.[1]) || 440;
  return (
    <Drawer
      anchor={side}
      open={state.open}
      onClose={() => state.setOpen(false)}
      slotProps={{
        paper: {
          role: "dialog",
          "aria-labelledby": state.titleId,
          sx: { width: { xs: "100vw", sm: desktopWidth }, maxWidth: "100vw" },
        },
      }}
    >
      <Box
        className={className}
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: "100%",
          height: "100%",
        }}
        {...props}
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
    </Drawer>
  );
}
export function SheetHeader(props: HTMLAttributes<HTMLDivElement>) {
  return <Box sx={{ p: 2, pr: 6 }} {...props} />;
}
export function SheetFooter(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <Box
      sx={{ p: 2, display: "flex", justifyContent: "flex-end", gap: 1 }}
      {...props}
    />
  );
}
export function SheetTitle(props: HTMLAttributes<HTMLHeadingElement>) {
  const state = useDialogState();
  return (
    <Typography id={state.titleId} component="h2" variant="h3" {...props} />
  );
}
export function SheetDescription(props: HTMLAttributes<HTMLParagraphElement>) {
  return <Typography color="text.secondary" {...props} />;
}
