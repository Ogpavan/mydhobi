import { pool } from './db';
import { getCustomerItemPrice } from './item-master';

// Inspection uses the order's captured store, never prices supplied by a client.
export async function finalizeQuickPickup(orderId: string, rawItems: unknown) {
  if (!Array.isArray(rawItems) || !rawItems.length || rawItems.length > 50) throw new Error('Add between 1 and 50 items.');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const order = (await client.query('SELECT * FROM customer_orders WHERE id=$1 FOR UPDATE', [orderId])).rows[0];
    if (!order || order.booking_kind !== 'quick' || !order.invoice_pending || !['Picked Up', 'In Cleaning'].includes(String(order.status))) throw new Error('This pickup is not ready for an invoice.');
    const services = order.requested_services as Array<{ id: string; name: string }>;
    const seen = new Set<string>();
    const items = await Promise.all(rawItems.map(async (raw: unknown) => {
      if (!raw || typeof raw !== 'object') throw new Error('Choose valid items.');
      const item = raw as Record<string, unknown>;
      const key = `${item.garmentId}:${item.serviceId}`;
      if (typeof item.garmentId !== 'string' || !/^\d+$/.test(item.garmentId) || typeof item.serviceId !== 'string' || !services.some(service => service.id === item.serviceId) || typeof item.quantity !== 'number' || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100 || seen.has(key)) throw new Error('Choose valid items and quantities.');
      seen.add(key);
      const price = await getCustomerItemPrice(Number(item.garmentId), Number(item.serviceId), String(order.store_id));
      if (!price) throw new Error('Item price is unavailable at this store.');
      return { ...price, garmentId: item.garmentId, serviceId: item.serviceId, quantity: item.quantity };
    }));
    const total = Math.round(items.reduce((sum,item) => sum + item.price * item.quantity,0) * 100)/100;
    for (const item of items) await client.query(`INSERT INTO customer_order_items
      (order_id,item_name,quantity,unit_price,base_unit_price,garment_id,garment_name,service_id,service_name)
      VALUES ($1,$2,$3,$4,$4,$5,$6,$7,$8)`, [orderId, `${item.garmentName} · ${item.serviceName}`, item.quantity, item.price, item.garmentId, item.garmentName, item.serviceId, item.serviceName]);
    await client.query('UPDATE customer_orders SET amount=$2,item_count=$3,invoice_pending=false,updated_at=NOW() WHERE id=$1', [orderId,total,items.reduce((sum,item)=>sum+item.quantity,0)]);
    await client.query("UPDATE customer_payments SET amount=$2 WHERE order_id=$1 AND kind='Order'", [orderId,total]);
    await client.query("INSERT INTO customer_notifications(user_id,title,message) VALUES($1,'Invoice ready',$2)", [order.user_id, `Your order #${orderId} has been counted. Final amount: ₹${total}.`]);
    await client.query('INSERT INTO customer_order_status_history(order_id,status,note) VALUES($1,$2,$3)', [orderId,order.status,`Items counted. Invoice total: ₹${total}.`]);
    await client.query('COMMIT');
    return { orderId, total };
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
