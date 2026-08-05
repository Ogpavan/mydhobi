import { ensureCustomerPortalSchema } from "@/lib/customer-portal";
import { ensureCustomerTable } from "@/lib/customers";
import { syncDeliveryTasks } from "@/lib/deliveries";
import { pool } from "@/lib/db";
import { ensureInventoryTable } from "@/lib/inventory";
import { syncPickupTasks } from "@/lib/pickups";
import { ensureServiceCatalogSchema } from "@/lib/service-catalog";

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

const titles: Record<OperationalReportKey, string> = {
  orders: "Order Report",
  sales: "Sales Report",
  payments: "Payment Report",
  customers: "Customer Report",
  services: "Service Report",
  pickups: "Pickup Report",
  deliveries: "Delivery Report",
  riders: "Rider Report",
  inventory: "Inventory Report",
  complaints: "Complaint Report",
};

export function isOperationalReportKey(
  value: string,
): value is OperationalReportKey {
  return operationalReportKeys.includes(value as OperationalReportKey);
}

export function normalizeOperationalReportRange(
  value: string | null,
): OperationalReportRange {
  const range = Number(value);
  return [7, 30, 90, 365].includes(range)
    ? range as OperationalReportRange
    : 30;
}

function iso(value: unknown) {
  return value ? new Date(String(value)).toISOString() : "";
}

function base(
  key: OperationalReportKey,
  range: OperationalReportRange,
  data: Omit<OperationalReportData, "key" | "title" | "range">,
): OperationalReportData {
  return { key, title: titles[key], range, ...data };
}

async function orderReport(range: OperationalReportRange, storeId?: string | null) {
  await ensureCustomerPortalSchema();
  const [summaryResult, rowsResult] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status='Delivered')::int AS completed,
        COUNT(*) FILTER (WHERE status NOT IN ('Delivered','Cancelled'))::int AS pending,
        COUNT(*) FILTER (WHERE status='Cancelled')::int AS cancelled
       FROM customer_orders
       WHERE created_at >= NOW() - ($1::int * interval '1 day')
         AND ($2::uuid IS NULL OR store_id=$2)`,
      [range, storeId ?? null],
    ),
    pool.query(
      `SELECT orders.id,orders.created_at,users.name AS customer,users.mobile,
        orders.service,orders.item_count,orders.status,orders.payment_status,
        orders.amount
       FROM customer_orders orders
       INNER JOIN app_users users ON users.id=orders.user_id
       WHERE orders.created_at >= NOW() - ($1::int * interval '1 day')
         AND ($2::uuid IS NULL OR orders.store_id=$2)
       ORDER BY orders.created_at DESC LIMIT 2000`,
      [range, storeId ?? null],
    ),
  ]);
  const summary = summaryResult.rows[0];
  return base("orders", range, {
    supportsRange: true,
    metrics: [
      { label: "Orders", value: Number(summary.total), format: "number" },
      { label: "Delivered", value: Number(summary.completed), format: "number" },
      { label: "Pending", value: Number(summary.pending), format: "number" },
      { label: "Cancelled", value: Number(summary.cancelled), format: "number" },
    ],
    columns: [
      { key: "date", label: "Date", format: "date" },
      { key: "order", label: "Order" },
      { key: "customer", label: "Customer" },
      { key: "mobile", label: "Mobile" },
      { key: "service", label: "Service" },
      { key: "items", label: "Items", format: "number", align: "right" },
      { key: "status", label: "Status", format: "status" },
      { key: "payment", label: "Payment", format: "status" },
      { key: "amount", label: "Amount", format: "money", align: "right" },
    ],
    rows: rowsResult.rows.map((row) => ({
      id: String(row.id),
      values: {
        date: iso(row.created_at),
        order: String(row.id),
        customer: String(row.customer),
        mobile: String(row.mobile),
        service: String(row.service),
        items: Number(row.item_count),
        status: String(row.status),
        payment: String(row.payment_status),
        amount: Number(row.amount),
      },
    })),
  });
}

async function salesReport(range: OperationalReportRange, storeId?: string | null) {
  await ensureCustomerPortalSchema();
  const [summaryResult, rowsResult] = await Promise.all([
    pool.query(
      `SELECT
        COALESCE(SUM(amount) FILTER (WHERE payment_status='Paid'),0) AS revenue,
        COALESCE(SUM(discount_amount),0) AS discounts,
        COALESCE(AVG(amount),0) AS average_order,
        COALESCE(SUM(amount) FILTER (WHERE payment_status<>'Paid'),0) AS unpaid
       FROM customer_orders
       WHERE created_at >= NOW() - ($1::int * interval '1 day')
         AND ($2::uuid IS NULL OR store_id=$2)`,
      [range, storeId ?? null],
    ),
    pool.query(
      `SELECT orders.id,orders.created_at,users.name AS customer,
        orders.amount + orders.discount_amount AS gross_amount,
        orders.discount_amount,orders.amount AS net_amount,
        orders.payment_method,orders.payment_status
       FROM customer_orders orders
       INNER JOIN app_users users ON users.id=orders.user_id
       WHERE orders.created_at >= NOW() - ($1::int * interval '1 day')
         AND ($2::uuid IS NULL OR orders.store_id=$2)
       ORDER BY orders.created_at DESC LIMIT 2000`,
      [range, storeId ?? null],
    ),
  ]);
  const summary = summaryResult.rows[0];
  return base("sales", range, {
    supportsRange: true,
    metrics: [
      { label: "Paid Sales", value: Number(summary.revenue), format: "money" },
      { label: "Discounts", value: Number(summary.discounts), format: "money" },
      { label: "Average Order", value: Number(summary.average_order), format: "money" },
      { label: "Unpaid Amount", value: Number(summary.unpaid), format: "money" },
    ],
    columns: [
      { key: "date", label: "Date", format: "date" },
      { key: "order", label: "Order" },
      { key: "customer", label: "Customer" },
      { key: "method", label: "Method" },
      { key: "status", label: "Status", format: "status" },
      { key: "gross", label: "Gross", format: "money", align: "right" },
      { key: "discount", label: "Discount", format: "money", align: "right" },
      { key: "net", label: "Net", format: "money", align: "right" },
    ],
    rows: rowsResult.rows.map((row) => ({
      id: String(row.id),
      values: {
        date: iso(row.created_at),
        order: String(row.id),
        customer: String(row.customer),
        method: String(row.payment_method),
        status: String(row.payment_status),
        gross: Number(row.gross_amount),
        discount: Number(row.discount_amount),
        net: Number(row.net_amount),
      },
    })),
  });
}

async function paymentReport(range: OperationalReportRange, storeId?: string | null) {
  await ensureCustomerPortalSchema();
  const [summaryResult, rowsResult] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS transactions,
        COALESCE(SUM(amount) FILTER (WHERE status='Paid'),0) AS paid,
        COALESCE(SUM(amount) FILTER (WHERE status<>'Paid'),0) AS pending,
        COUNT(*) FILTER (WHERE status='Failed')::int AS failed
       FROM customer_payments payments
       LEFT JOIN customer_orders orders ON orders.id=payments.order_id
       WHERE payments.created_at >= NOW() - ($1::int * interval '1 day')
         AND ($2::uuid IS NULL OR orders.store_id=$2)`,
      [range, storeId ?? null],
    ),
    pool.query(
      `SELECT payments.id,payments.created_at,payments.reference,
        payments.order_id,users.name AS customer,users.mobile,payments.kind,
        payments.method,payments.status,payments.amount
       FROM customer_payments payments
       INNER JOIN app_users users ON users.id=payments.user_id
       LEFT JOIN customer_orders orders ON orders.id=payments.order_id
       WHERE payments.created_at >= NOW() - ($1::int * interval '1 day')
         AND ($2::uuid IS NULL OR orders.store_id=$2)
       ORDER BY payments.created_at DESC LIMIT 2000`,
      [range, storeId ?? null],
    ),
  ]);
  const summary = summaryResult.rows[0];
  return base("payments", range, {
    supportsRange: true,
    metrics: [
      { label: "Transactions", value: Number(summary.transactions), format: "number" },
      { label: "Paid", value: Number(summary.paid), format: "money" },
      { label: "Pending", value: Number(summary.pending), format: "money" },
      { label: "Failed", value: Number(summary.failed), format: "number" },
    ],
    columns: [
      { key: "date", label: "Date", format: "date" },
      { key: "reference", label: "Reference" },
      { key: "order", label: "Order" },
      { key: "customer", label: "Customer" },
      { key: "mobile", label: "Mobile" },
      { key: "kind", label: "Type" },
      { key: "method", label: "Method" },
      { key: "status", label: "Status", format: "status" },
      { key: "amount", label: "Amount", format: "money", align: "right" },
    ],
    rows: rowsResult.rows.map((row) => ({
      id: String(row.id),
      values: {
        date: iso(row.created_at),
        reference: String(row.reference),
        order: row.order_id ? String(row.order_id) : "—",
        customer: String(row.customer),
        mobile: String(row.mobile),
        kind: String(row.kind),
        method: String(row.method),
        status: String(row.status),
        amount: Number(row.amount),
      },
    })),
  });
}

async function customerReport(range: OperationalReportRange, storeId?: string | null) {
  await Promise.all([ensureCustomerTable(), ensureCustomerPortalSchema()]);
  const [summaryResult, rowsResult] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS new_customers,
        COUNT(*) FILTER (WHERE status='active')::int AS active,
        COUNT(*) FILTER (WHERE status='inactive')::int AS inactive,
        COUNT(*) FILTER (WHERE customer_type='business')::int AS business
       FROM customers
       WHERE created_at >= NOW() - ($1::int * interval '1 day')
         AND ($2::uuid IS NULL OR store_id=$2)`,
      [range, storeId ?? null],
    ),
    pool.query(
      `SELECT customers.id,customers.created_at,customers.full_name,
        customers.mobile,customers.city,customers.customer_type,customers.status,
        COUNT(orders.id)::int AS orders,
        COALESCE(SUM(orders.amount),0) AS spent,
        COALESCE(wallet.balance,0) AS wallet_balance
       FROM customers
       LEFT JOIN customer_orders orders ON orders.user_id=customers.user_id
         AND ($2::uuid IS NULL OR orders.store_id=$2)
       LEFT JOIN customer_wallets wallet ON wallet.user_id=customers.user_id
       WHERE customers.created_at >= NOW() - ($1::int * interval '1 day')
         AND ($2::uuid IS NULL OR customers.store_id=$2)
       GROUP BY customers.id,wallet.balance
       ORDER BY customers.created_at DESC LIMIT 2000`,
      [range, storeId ?? null],
    ),
  ]);
  const summary = summaryResult.rows[0];
  return base("customers", range, {
    supportsRange: true,
    metrics: [
      { label: "New Customers", value: Number(summary.new_customers), format: "number" },
      { label: "Active", value: Number(summary.active), format: "number" },
      { label: "Inactive", value: Number(summary.inactive), format: "number" },
      { label: "Business", value: Number(summary.business), format: "number" },
    ],
    columns: [
      { key: "date", label: "Joined", format: "date" },
      { key: "customer", label: "Customer" },
      { key: "mobile", label: "Mobile" },
      { key: "city", label: "City" },
      { key: "type", label: "Type" },
      { key: "status", label: "Status", format: "status" },
      { key: "orders", label: "Orders", format: "number", align: "right" },
      { key: "spent", label: "Spent", format: "money", align: "right" },
      { key: "wallet", label: "Wallet", format: "money", align: "right" },
    ],
    rows: rowsResult.rows.map((row) => ({
      id: String(row.id),
      values: {
        date: iso(row.created_at),
        customer: String(row.full_name),
        mobile: String(row.mobile),
        city: String(row.city),
        type: String(row.customer_type),
        status: String(row.status),
        orders: Number(row.orders),
        spent: Number(row.spent),
        wallet: Number(row.wallet_balance),
      },
    })),
  });
}

async function serviceReport(range: OperationalReportRange, storeId?: string | null) {
  await Promise.all([ensureServiceCatalogSchema(), ensureCustomerPortalSchema()]);
  const rowsResult = await pool.query(
    `SELECT orders.service,COUNT(*)::int AS orders,
      COALESCE(SUM(orders.item_count),0)::int AS items,
      COALESCE(SUM(orders.amount),0) AS revenue,
      COALESCE(AVG(orders.amount),0) AS average_order,
      MAX(orders.created_at) AS last_order
     FROM customer_orders orders
     WHERE orders.created_at >= NOW() - ($1::int * interval '1 day')
       AND ($2::uuid IS NULL OR orders.store_id=$2)
     GROUP BY orders.service
     ORDER BY revenue DESC,orders DESC`,
    [range, storeId ?? null],
  );
  const revenue = rowsResult.rows.reduce((sum, row) => sum + Number(row.revenue), 0);
  const orders = rowsResult.rows.reduce((sum, row) => sum + Number(row.orders), 0);
  const items = rowsResult.rows.reduce((sum, row) => sum + Number(row.items), 0);
  return base("services", range, {
    supportsRange: true,
    metrics: [
      { label: "Services Used", value: rowsResult.rowCount ?? 0, format: "number" },
      { label: "Orders", value: orders, format: "number" },
      { label: "Items", value: items, format: "number" },
      { label: "Revenue", value: revenue, format: "money" },
    ],
    columns: [
      { key: "service", label: "Service" },
      { key: "orders", label: "Orders", format: "number", align: "right" },
      { key: "items", label: "Items", format: "number", align: "right" },
      { key: "revenue", label: "Revenue", format: "money", align: "right" },
      { key: "average", label: "Average Order", format: "money", align: "right" },
      { key: "lastOrder", label: "Last Order", format: "date" },
    ],
    rows: rowsResult.rows.map((row, index) => ({
      id: `${index}-${row.service}`,
      values: {
        service: String(row.service),
        orders: Number(row.orders),
        items: Number(row.items),
        revenue: Number(row.revenue),
        average: Number(row.average_order),
        lastOrder: iso(row.last_order),
      },
    })),
  });
}

async function pickupReport(range: OperationalReportRange, storeId?: string | null) {
  await syncPickupTasks();
  const [summaryResult, rowsResult] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status='Completed')::int AS completed,
        COUNT(*) FILTER (WHERE status NOT IN ('Completed','Failed'))::int AS pending,
        COUNT(*) FILTER (WHERE status='Failed')::int AS failed
       FROM order_pickups pickups
       INNER JOIN customer_orders orders ON orders.id=pickups.order_id
       WHERE pickups.scheduled_at >= NOW() - ($1::int * interval '1 day')
         AND ($2::uuid IS NULL OR orders.store_id=$2)`,
      [range, storeId ?? null],
    ),
    pool.query(
      `SELECT pickups.id,pickups.scheduled_at,pickups.order_id,
        users.name AS customer,users.mobile,orders.service,pickups.status,
        COALESCE(riders.name,'Unassigned') AS rider,pickups.notes
       FROM order_pickups pickups
       INNER JOIN customer_orders orders ON orders.id=pickups.order_id
       INNER JOIN app_users users ON users.id=orders.user_id
       LEFT JOIN riders ON riders.id=pickups.rider_id
       WHERE pickups.scheduled_at >= NOW() - ($1::int * interval '1 day')
         AND ($2::uuid IS NULL OR orders.store_id=$2)
       ORDER BY pickups.scheduled_at DESC LIMIT 2000`,
      [range, storeId ?? null],
    ),
  ]);
  const summary = summaryResult.rows[0];
  return base("pickups", range, {
    supportsRange: true,
    metrics: [
      { label: "Pickups", value: Number(summary.total), format: "number" },
      { label: "Completed", value: Number(summary.completed), format: "number" },
      { label: "Pending", value: Number(summary.pending), format: "number" },
      { label: "Failed", value: Number(summary.failed), format: "number" },
    ],
    columns: [
      { key: "date", label: "Scheduled", format: "date" },
      { key: "order", label: "Order" },
      { key: "customer", label: "Customer" },
      { key: "mobile", label: "Mobile" },
      { key: "service", label: "Service" },
      { key: "rider", label: "Rider" },
      { key: "status", label: "Status", format: "status" },
      { key: "notes", label: "Notes" },
    ],
    rows: rowsResult.rows.map((row) => ({
      id: String(row.id),
      values: {
        date: iso(row.scheduled_at),
        order: String(row.order_id),
        customer: String(row.customer),
        mobile: String(row.mobile),
        service: String(row.service),
        rider: String(row.rider),
        status: String(row.status),
        notes: String(row.notes || "—"),
      },
    })),
  });
}

async function deliveryReport(range: OperationalReportRange, storeId?: string | null) {
  await syncDeliveryTasks();
  const [summaryResult, rowsResult] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status='Delivered')::int AS delivered,
        COUNT(*) FILTER (WHERE status NOT IN ('Delivered','Failed'))::int AS pending,
        COUNT(*) FILTER (WHERE status='Failed')::int AS failed
       FROM order_deliveries deliveries
       INNER JOIN customer_orders orders ON orders.id=deliveries.order_id
       WHERE deliveries.scheduled_at >= NOW() - ($1::int * interval '1 day')
         AND ($2::uuid IS NULL OR orders.store_id=$2)`,
      [range, storeId ?? null],
    ),
    pool.query(
      `SELECT deliveries.id,deliveries.scheduled_at,deliveries.order_id,
        users.name AS customer,users.mobile,orders.amount,
        COALESCE(riders.name,'Unassigned') AS rider,deliveries.status,
        orders.payment_status,deliveries.notes
       FROM order_deliveries deliveries
       INNER JOIN customer_orders orders ON orders.id=deliveries.order_id
       INNER JOIN app_users users ON users.id=orders.user_id
       LEFT JOIN riders ON riders.id=deliveries.rider_id
       WHERE deliveries.scheduled_at >= NOW() - ($1::int * interval '1 day')
         AND ($2::uuid IS NULL OR orders.store_id=$2)
       ORDER BY deliveries.scheduled_at DESC LIMIT 2000`,
      [range, storeId ?? null],
    ),
  ]);
  const summary = summaryResult.rows[0];
  return base("deliveries", range, {
    supportsRange: true,
    metrics: [
      { label: "Deliveries", value: Number(summary.total), format: "number" },
      { label: "Delivered", value: Number(summary.delivered), format: "number" },
      { label: "Pending", value: Number(summary.pending), format: "number" },
      { label: "Failed", value: Number(summary.failed), format: "number" },
    ],
    columns: [
      { key: "date", label: "Scheduled", format: "date" },
      { key: "order", label: "Order" },
      { key: "customer", label: "Customer" },
      { key: "mobile", label: "Mobile" },
      { key: "rider", label: "Rider" },
      { key: "status", label: "Status", format: "status" },
      { key: "payment", label: "Payment", format: "status" },
      { key: "amount", label: "Amount", format: "money", align: "right" },
      { key: "notes", label: "Notes" },
    ],
    rows: rowsResult.rows.map((row) => ({
      id: String(row.id),
      values: {
        date: iso(row.scheduled_at),
        order: String(row.order_id),
        customer: String(row.customer),
        mobile: String(row.mobile),
        rider: String(row.rider),
        status: String(row.status),
        payment: String(row.payment_status),
        amount: Number(row.amount),
        notes: String(row.notes || "—"),
      },
    })),
  });
}

async function riderReport(range: OperationalReportRange, storeId?: string | null) {
  await Promise.all([syncPickupTasks(), syncDeliveryTasks()]);
  const rowsResult = await pool.query(
    `SELECT riders.id,riders.name,riders.mobile,riders.area,riders.status,
      COUNT(DISTINCT pickups.id) FILTER (WHERE $2::uuid IS NULL OR pickup_orders.store_id=$2) AS pickups,
      COUNT(DISTINCT pickups.id) FILTER (WHERE pickups.status='Completed' AND ($2::uuid IS NULL OR pickup_orders.store_id=$2)) AS pickups_done,
      COUNT(DISTINCT deliveries.id) FILTER (WHERE $2::uuid IS NULL OR delivery_orders.store_id=$2) AS deliveries,
      COUNT(DISTINCT deliveries.id) FILTER (WHERE deliveries.status='Delivered' AND ($2::uuid IS NULL OR delivery_orders.store_id=$2)) AS deliveries_done,
      COUNT(DISTINCT pickups.id) FILTER (WHERE pickups.status='Failed' AND ($2::uuid IS NULL OR pickup_orders.store_id=$2)) +
        COUNT(DISTINCT deliveries.id) FILTER (WHERE deliveries.status='Failed' AND ($2::uuid IS NULL OR delivery_orders.store_id=$2)) AS failed
     FROM riders
     LEFT JOIN order_pickups pickups ON pickups.rider_id=riders.id
       AND pickups.scheduled_at >= NOW() - ($1::int * interval '1 day')
     LEFT JOIN customer_orders pickup_orders ON pickup_orders.id=pickups.order_id
     LEFT JOIN order_deliveries deliveries ON deliveries.rider_id=riders.id
       AND deliveries.scheduled_at >= NOW() - ($1::int * interval '1 day')
     LEFT JOIN customer_orders delivery_orders ON delivery_orders.id=deliveries.order_id
     WHERE ($2::uuid IS NULL OR riders.store_id=$2)
     GROUP BY riders.id
     ORDER BY deliveries_done DESC,pickups_done DESC,riders.name`,
    [range, storeId ?? null],
  );
  const active = rowsResult.rows.filter((row) => row.status !== "Off Duty").length;
  const pickupDone = rowsResult.rows.reduce(
    (sum, row) => sum + Number(row.pickups_done), 0,
  );
  const deliveryDone = rowsResult.rows.reduce(
    (sum, row) => sum + Number(row.deliveries_done), 0,
  );
  return base("riders", range, {
    supportsRange: true,
    metrics: [
      { label: "Riders", value: rowsResult.rowCount ?? 0, format: "number" },
      { label: "Available / On Duty", value: active, format: "number" },
      { label: "Pickups Completed", value: pickupDone, format: "number" },
      { label: "Deliveries Completed", value: deliveryDone, format: "number" },
    ],
    columns: [
      { key: "rider", label: "Rider" },
      { key: "mobile", label: "Mobile" },
      { key: "area", label: "Area" },
      { key: "status", label: "Status", format: "status" },
      { key: "pickups", label: "Pickups", format: "number", align: "right" },
      { key: "pickupsDone", label: "Picked Up", format: "number", align: "right" },
      { key: "deliveries", label: "Deliveries", format: "number", align: "right" },
      { key: "deliveriesDone", label: "Delivered", format: "number", align: "right" },
      { key: "failed", label: "Failed", format: "number", align: "right" },
    ],
    rows: rowsResult.rows.map((row) => ({
      id: String(row.id),
      values: {
        rider: String(row.name),
        mobile: String(row.mobile),
        area: String(row.area),
        status: String(row.status),
        pickups: Number(row.pickups),
        pickupsDone: Number(row.pickups_done),
        deliveries: Number(row.deliveries),
        deliveriesDone: Number(row.deliveries_done),
        failed: Number(row.failed),
      },
    })),
  });
}

async function inventoryReport(range: OperationalReportRange, storeId?: string | null) {
  await ensureInventoryTable();
  const rowsResult = await pool.query(
    `SELECT id,name,category,brand,unit_type,current_stock,minimum_stock,
      reorder_quantity,supplier,purchase_price,
      current_stock * purchase_price AS stock_value,status,updated_at
     FROM inventory_items
     WHERE ($1::uuid IS NULL OR store_id=$1)
     ORDER BY
       CASE WHEN current_stock <= minimum_stock THEN 0 ELSE 1 END,
      name`,
    [storeId ?? null],
  );
  const active = rowsResult.rows.filter((row) => row.status === "active").length;
  const lowStock = rowsResult.rows.filter(
    (row) => Number(row.current_stock) <= Number(row.minimum_stock),
  ).length;
  const value = rowsResult.rows.reduce(
    (sum, row) => sum + Number(row.stock_value), 0,
  );
  return base("inventory", range, {
    supportsRange: false,
    metrics: [
      { label: "Items", value: rowsResult.rowCount ?? 0, format: "number" },
      { label: "Active Items", value: active, format: "number" },
      { label: "Low Stock", value: lowStock, format: "number" },
      { label: "Stock Value", value, format: "money" },
    ],
    columns: [
      { key: "item", label: "Item" },
      { key: "category", label: "Category" },
      { key: "brand", label: "Brand" },
      { key: "stock", label: "Stock", format: "number", align: "right" },
      { key: "minimum", label: "Minimum", format: "number", align: "right" },
      { key: "unit", label: "Unit" },
      { key: "reorder", label: "Reorder", format: "number", align: "right" },
      { key: "supplier", label: "Supplier" },
      { key: "value", label: "Value", format: "money", align: "right" },
      { key: "status", label: "Status", format: "status" },
    ],
    rows: rowsResult.rows.map((row) => ({
      id: String(row.id),
      values: {
        item: String(row.name),
        category: String(row.category),
        brand: String(row.brand || "—"),
        stock: Number(row.current_stock),
        minimum: Number(row.minimum_stock),
        unit: String(row.unit_type),
        reorder: row.reorder_quantity === null ? null : Number(row.reorder_quantity),
        supplier: String(row.supplier || "—"),
        value: Number(row.stock_value),
        status: Number(row.current_stock) <= Number(row.minimum_stock)
          ? "Low Stock"
          : String(row.status),
      },
    })),
  });
}

async function complaintReport(range: OperationalReportRange, storeId?: string | null) {
  await ensureCustomerPortalSchema();
  const [summaryResult, rowsResult] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status='Open')::int AS open,
        COUNT(*) FILTER (WHERE status='In Progress')::int AS progress,
        COUNT(*) FILTER (WHERE status='Resolved')::int AS resolved
       FROM customer_complaints
       WHERE created_at >= NOW() - ($1::int * interval '1 day')
         AND ($2::uuid IS NULL OR store_id=$2)`,
      [range, storeId ?? null],
    ),
    pool.query(
      `SELECT complaints.id,complaints.created_at,users.name AS customer,
        users.mobile,complaints.subject,complaints.status,
        complaints.response,complaints.resolved_at,
        CASE WHEN complaints.resolved_at IS NOT NULL
          THEN EXTRACT(EPOCH FROM (complaints.resolved_at-complaints.created_at))/3600
          ELSE NULL END AS resolution_hours
       FROM customer_complaints complaints
       INNER JOIN app_users users ON users.id=complaints.user_id
       WHERE complaints.created_at >= NOW() - ($1::int * interval '1 day')
         AND ($2::uuid IS NULL OR complaints.store_id=$2)
       ORDER BY complaints.created_at DESC LIMIT 2000`,
      [range, storeId ?? null],
    ),
  ]);
  const summary = summaryResult.rows[0];
  return base("complaints", range, {
    supportsRange: true,
    metrics: [
      { label: "Complaints", value: Number(summary.total), format: "number" },
      { label: "Open", value: Number(summary.open), format: "number" },
      { label: "In Progress", value: Number(summary.progress), format: "number" },
      { label: "Resolved", value: Number(summary.resolved), format: "number" },
    ],
    columns: [
      { key: "date", label: "Date", format: "date" },
      { key: "reference", label: "Reference" },
      { key: "customer", label: "Customer" },
      { key: "mobile", label: "Mobile" },
      { key: "subject", label: "Issue" },
      { key: "status", label: "Status", format: "status" },
      { key: "response", label: "Response" },
      { key: "hours", label: "Resolution Hours", format: "number", align: "right" },
    ],
    rows: rowsResult.rows.map((row) => ({
      id: String(row.id),
      values: {
        date: iso(row.created_at),
        reference: `COMP${String(row.id).padStart(4, "0")}`,
        customer: String(row.customer),
        mobile: String(row.mobile),
        subject: String(row.subject),
        status: String(row.status),
        response: String(row.response || "—"),
        hours: row.resolution_hours === null
          ? null
          : Math.round(Number(row.resolution_hours) * 10) / 10,
      },
    })),
  });
}

export async function getOperationalReport(
  key: OperationalReportKey,
  range: OperationalReportRange,
  storeId?: string | null,
) {
  switch (key) {
    case "orders": return orderReport(range, storeId);
    case "sales": return salesReport(range, storeId);
    case "payments": return paymentReport(range, storeId);
    case "customers": return customerReport(range, storeId);
    case "services": return serviceReport(range, storeId);
    case "pickups": return pickupReport(range, storeId);
    case "deliveries": return deliveryReport(range, storeId);
    case "riders": return riderReport(range, storeId);
    case "inventory": return inventoryReport(range, storeId);
    case "complaints": return complaintReport(range, storeId);
  }
}
