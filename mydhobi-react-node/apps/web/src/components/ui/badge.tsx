import { Chip } from "@mui/material";
import type { HTMLAttributes } from "react";
export interface BadgeProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "color"
> {
  variant?: "default" | "secondary" | "destructive" | "outline" | null;
}
export function Badge({ children, variant, ...props }: BadgeProps) {
  return (
    <Chip
      label={children}
      color={
        variant === "destructive"
          ? "error"
          : variant === "default"
            ? "primary"
            : "default"
      }
      variant={variant === "outline" ? "outlined" : "filled"}
      {...props}
    />
  );
}
