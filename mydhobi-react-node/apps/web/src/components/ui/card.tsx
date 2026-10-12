import { Box, Card, CardContent, Typography } from "@mui/material";
import type { HTMLAttributes } from "react";
export { Card, CardContent };
export function CardHeader(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <Box
      sx={{ p: 2, display: "flex", alignItems: "center", gap: 1 }}
      {...props}
    />
  );
}
export function CardFooter(props: HTMLAttributes<HTMLDivElement>) {
  return <Box sx={{ p: 2, display: "flex", gap: 1 }} {...props} />;
}
export function CardTitle(props: HTMLAttributes<HTMLHeadingElement>) {
  return <Typography component="h3" variant="h3" {...props} />;
}
export function CardDescription(props: HTMLAttributes<HTMLParagraphElement>) {
  return <Typography component="p" color="text.secondary" {...props} />;
}
