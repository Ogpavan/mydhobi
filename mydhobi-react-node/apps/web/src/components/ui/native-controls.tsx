/** MUI compositions preserve existing domain form contracts during migration. */
import {
  Button,
  Checkbox,
  OutlinedInput,
  Radio,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  type InputBaseComponentProps,
} from "@mui/material";
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ThHTMLAttributes,
} from "react";

export function controlClasses(value?: string) {
  return value
    ?.split(/\s+/)
    .filter(
      (token) =>
        !/^(?:hover:|focus:|disabled:)?(?:rounded|shadow|px-|py-|p-)/.test(
          token,
        ),
    )
    .join(" ");
}
export const MuiAction = forwardRef<
  HTMLButtonElement,
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color">
>(function MuiAction({ className, ...props }, ref) {
  const variant = className?.includes("text-white")
    ? "contained"
    : className?.includes("border")
      ? "outlined"
      : "text";
  return (
    <Button
      ref={ref}
      type="submit"
      variant={variant}
      className={controlClasses(className)}
      {...props}
    />
  );
});
export const MuiInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function MuiInput({ className, type = "text", style, ...props }, ref) {
  if (type === "checkbox" || type === "radio") {
    const Component = type === "checkbox" ? Checkbox : Radio;
    return (
      <Component
        inputRef={ref}
        checked={props.checked}
        defaultChecked={props.defaultChecked}
        disabled={props.disabled}
        required={props.required}
        name={props.name}
        value={props.value}
        size="small"
        inputProps={props}
        className={controlClasses(className)}
        style={style}
      />
    );
  }
  return (
    <OutlinedInput
      inputRef={ref}
      type={type}
      value={props.value}
      defaultValue={props.defaultValue}
      disabled={props.disabled}
      required={props.required}
      fullWidth
      className={controlClasses(className)}
      style={style}
      inputProps={props}
      sx={type === "hidden" || props.hidden ? { display: "none" } : undefined}
    />
  );
});
export const MuiSelect = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(function MuiSelect({ children, className, style, ...props }, ref) {
  return (
    <Select
      native
      size="small"
      fullWidth
      inputRef={ref}
      value={props.value}
      defaultValue={props.defaultValue}
      disabled={props.disabled}
      required={props.required}
      inputProps={props as unknown as InputBaseComponentProps}
      className={controlClasses(className)}
      style={style}
    >
      {children}
    </Select>
  );
});
export const MuiTextarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function MuiTextarea({ className, rows, style, ...props }, ref) {
  return (
    <OutlinedInput
      multiline
      fullWidth
      inputRef={ref}
      rows={rows ?? 3}
      value={props.value}
      defaultValue={props.defaultValue}
      disabled={props.disabled}
      required={props.required}
      inputProps={props}
      className={controlClasses(className)}
      style={style}
    />
  );
});
export {
  Table as MuiTable,
  TableBody as MuiTableBody,
  TableCell as MuiTableCell,
  TableHead as MuiTableHead,
  TableRow as MuiTableRow,
};
export function MuiTableHeaderCell({
  align,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <TableCell
      component="th"
      align={align === "char" ? "left" : align}
      {...props}
    />
  );
}
