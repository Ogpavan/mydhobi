import type { SwitchProps } from "@mui/material";
import { Switch as MaterialSwitch } from "@mui/material";
export function Switch({
  onCheckedChange,
  ...props
}: Omit<SwitchProps, "onChange"> & {
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    <MaterialSwitch
      {...props}
      onChange={(_, checked) => onCheckedChange?.(checked)}
    />
  );
}
