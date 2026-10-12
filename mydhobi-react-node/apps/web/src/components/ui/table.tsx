import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead as TableHeader,
  TableRow,
} from "@mui/material";
import type { ComponentProps, HTMLAttributes } from "react";
export { TableBody, TableCell, TableFooter, TableHeader, TableRow };
export function TableHead(props: ComponentProps<typeof TableCell>) {
  return <TableCell component="th" {...props} />;
}
export function TableCaption(props: HTMLAttributes<HTMLTableCaptionElement>) {
  return <caption {...props} />;
}
export function ResponsiveTable(props: ComponentProps<typeof Table>) {
  return (
    <TableContainer>
      <Table size="small" {...props} />
    </TableContainer>
  );
}
export { ResponsiveTable as Table };
