import { HttpResponse } from '@/server/http-response';
import { getCurrentUser } from '@/lib/session';
import { quoteCustomerOrder } from '../../../services/customer-quote';
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'customer') return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid order.');
    return HttpResponse.json(await quoteCustomerOrder(user.id, body as Record<string, unknown>));
  } catch (error) {
    return HttpResponse.json({ message: error instanceof Error ? error.message : 'Unable to check prices.' }, { status: 400 });
  }
}
