import { Button as MaterialButton } from "@mui/material";
import {
  forwardRef,
  isValidElement,
  type ButtonHTMLAttributes,
  type ElementType,
  type ReactElement,
} from "react";
import { controlClasses } from "./native-controls";
export interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "color"
> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | null;
  size?: "default" | "sm" | "lg" | "icon" | null;
  asChild?: boolean;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "default", size, asChild, children, className, ...props },
    ref,
  ) {
    const styles = {
      variant:
        variant === "outline"
          ? ("outlined" as const)
          : variant === "ghost" || variant === "link"
            ? ("text" as const)
            : ("contained" as const),
      color:
        variant === "destructive" ? ("error" as const) : ("primary" as const),
      size: size === "lg" ? ("large" as const) : ("small" as const),
    };
    if (asChild && isValidElement(children)) {
      const child = children as ReactElement<Record<string, unknown>>;
      return (
        <MaterialButton
          component={child.type as ElementType}
          {...styles}
          {...props}
          {...child.props}
          className={controlClasses(className)}
        >
          {child.props.children as React.ReactNode}
        </MaterialButton>
      );
    }
    return (
      <MaterialButton
        type="button"
        ref={ref}
        {...styles}
        {...props}
        className={controlClasses(className)}
        sx={
          size === "icon" ? { minWidth: 36, width: 36, padding: 0 } : undefined
        }
      >
        {children}
      </MaterialButton>
    );
  },
);
