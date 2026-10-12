import { Skeleton as MaterialSkeleton } from "@mui/material";
import type { HTMLAttributes } from "react";
export function Skeleton(props: HTMLAttributes<HTMLSpanElement>) {
  return <MaterialSkeleton variant="rounded" {...props} />;
}
