# EasyDry customer flow API gaps

The customer UI uses the existing MyDhobi API and real customer records. These flows need backend work before the reference design can show them as completed features.

## Pickup availability and request management

Current booking uses POST /api/customer/orders. It validates the pickup date and supported slot values, then creates a customer order. The catalog exposes available services, but there is no customer endpoint for date-specific slot capacity, express pickup eligibility, or express pricing.

There is no customer pickup-request list separate from order history, and no customer operation to reschedule or cancel a scheduled pickup. PATCH /api/customer/orders/:id currently only confirms an order and selects cash or wallet payment.

Suggested API contracts:

- GET /api/customer/pickup-slots?date=YYYY-MM-DD&addressId=ID returns date-specific slots with availability and any service restrictions.
- POST /api/customer/pickups accepts a service selection, address, slot, express choice, instructions, and idempotency key; returns the created pickup request.
- GET /api/customer/pickups returns the signed-in customer's pickup requests.
- PATCH /api/customer/pickups/:id supports an explicit reschedule action with a new slot and an explicit cancel action with a reason and optional note.

The server must enforce ownership, availability, cancellation windows, express pricing, and idempotency. The UI must wait for the server response before showing confirmation.

## Recharge packages

The current customer API provides subscription plans through GET/POST /api/customer/subscription. The current customer API does not provide configurable recharge tiers with bonus service value, validity, eligible services, balance, or package transactions.

Suggested API contracts:

- GET /api/customer/packages returns the configured package catalog and the customer's active plans.
- GET /api/customer/packages/:id returns benefits, terms, validity, and eligible services.
- POST /api/customer/packages/:id/purchase creates a purchase using a supported payment method and returns a payment or wallet result.
- GET /api/customer/package-transactions returns package credits and debits.

Recharge amount and bonus value must come from server configuration; the sample values in the design reference are not production data.

## Payment provider

The project README states that payment-provider integration has not been introduced. Existing order booking supports the current cash/wallet choices. Card or UPI provider checkout, payment callbacks, and payment-result verification need a provider integration before those screens can report a real payment outcome.
