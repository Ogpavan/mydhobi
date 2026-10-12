import { getCustomerItemPrice } from './item-master';
import { resolveCustomerStoreId } from './customer-portal';
import { validateOffer } from './offers';
import { getPendingReferralDiscount } from './referrals';

export async function quoteCustomerOrder(userId: string, body: Record<string, unknown>) {
  const storeId = await resolveCustomerStoreId(userId);
  if (!storeId || (body.storeId && body.storeId !== storeId)) throw new Error('Your store changed. Choose your items again.');
  if (!Array.isArray(body.items) || !body.items.length || body.items.length > 50) throw new Error('Add between 1 and 50 items.');
  const items = await Promise.all(body.items.map(async (raw: unknown) => {
    if (!raw || typeof raw !== 'object') throw new Error('Choose valid items.');
    const item = raw as Record<string, unknown>;
    if (typeof item.garmentId !== 'string' || !/^\d+$/.test(item.garmentId) || typeof item.serviceId !== 'string' || !/^\d+$/.test(item.serviceId) || typeof item.quantity !== 'number' || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) throw new Error('Choose valid items and quantities.');
    const price = await getCustomerItemPrice(Number(item.garmentId), Number(item.serviceId), storeId);
    if (!price) throw new Error('An item is unavailable. Please update your cart.');
    return { garmentId: item.garmentId, serviceId: item.serviceId, quantity: item.quantity, garmentName: price.garmentName, serviceName: price.serviceName, unitPrice: price.price };
  }));
  const subtotal = Math.round(items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) * 100) / 100;
  const code = typeof body.couponCode === 'string' ? body.couponCode.trim().toUpperCase() : '';
  const offer = code ? await validateOffer(code, subtotal, storeId) : null;
  if (offer && !offer.valid) throw new Error('Coupon is not valid.');
  const referral = await getPendingReferralDiscount(userId);
  const referralDiscount = referral ? Math.round(subtotal * referral.percent) / 100 : 0;
  const discount = Math.max(referralDiscount, offer?.valid ? offer.discount : 0);
  // Customer orders currently use standard pickup/delivery with no added charges.
  return { storeId, items, subtotal, discount, deliveryFee: 0, tax: 0, total: Math.max(0, subtotal - discount), discountLabel: referral && referralDiscount >= (offer?.valid ? offer.discount : 0) ? 'Referral discount' : 'Coupon discount' };
}
