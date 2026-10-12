import { HttpResponse } from '@/server/http-response';
import { getCurrentUser } from '@/lib/session';
import { canAccessAdminPage } from '@/lib/role-permissions';
import { getAdminOrder } from '@/lib/admin-orders';
import { finalizeQuickPickup } from '../../../../../services/quick-pickup-invoice';
export async function POST(request: Request, { params }: { params: Promise<{id: string}> }) {
  const user = await getCurrentUser();
  if (!user || user.role === 'customer') return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!(await canAccessAdminPage(user, 'orders'))) return HttpResponse.json({ message: 'You do not have access to orders.' }, { status: 403 });
  const { id } = await params;
  // Non-admin operators must belong to the order's store.
  const globalAccess = user.role === 'admin';
  if (!globalAccess && !user.storeId) return HttpResponse.json({ message: 'Store access required.' }, { status: 403 });
  const order = await getAdminOrder(id, globalAccess ? null : user.storeId);
  if (!order) return HttpResponse.json({ message: 'Order not found.' }, { status: 404 });
  try {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json(await finalizeQuickPickup(id, body?.items));
  } catch (error) { return HttpResponse.json({ message: error instanceof Error ? error.message : 'Unable to create invoice.' }, { status: 400 }); }
}
