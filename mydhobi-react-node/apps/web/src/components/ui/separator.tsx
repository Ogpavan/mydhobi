import type { DividerProps } from "@mui/material";
import { Divider } from "@mui/material";
export function Separator({
  decorative: _decorative,
  ...props
}: DividerProps & { decorative?: boolean }) {
  return <Divider {...props} />;
}
