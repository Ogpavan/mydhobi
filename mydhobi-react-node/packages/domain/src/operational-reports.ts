export const operationalReportKeys = [
  "orders",
  "sales",
  "payments",
  "customers",
  "services",
  "pickups",
  "deliveries",
  "riders",
  "inventory",
  "complaints",
] as const;
export type OperationalReportKey = (typeof operationalReportKeys)[number];
export type OperationalReportRange = 7 | 30 | 90 | 365;
export type ReportValue = string | number | null;
export type OperationalReportColumn = {
  key: string;
  label: string;
  format?: "text" | "number" | "money" | "date" | "status";
  align?: "left" | "right";
};
export type OperationalReportData = {
  key: OperationalReportKey;
  title: string;
  range: OperationalReportRange;
  supportsRange: boolean;
  metrics: Array<{
    label: string;
    value: number;
    format: "number" | "money";
  }>;
  columns: OperationalReportColumn[];
  rows: Array<{
    id: string;
    values: Record<string, ReportValue>;
  }>;
};
