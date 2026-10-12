import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { Server } from "node:http";
import { calculateDiscountedPrice } from "@mydhobi/domain/discount-groups";
import { createFixtureDatabase } from "./support/database";
let fixture: Awaited<ReturnType<typeof createFixtureDatabase>>;
let server: Server;
let origin: string;
const cookies: Record<string, string> = {};
before(async () => {
  fixture = await createFixtureDatabase();
  const { createApp } = await import("../apps/api/src/app");
  server = createApp().listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  origin = `http://127.0.0.1:${address.port}`;
  for (const [role, mobile] of [
    ["admin", "9000000000"],
    ["customer", "9000000002"],
    ["store_manager", "9000000003"],
    ["staff", "9000000004"],
  ]) {
    const response = await fetch(origin + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, password: "Test-only-123!" }),
    });
    assert.equal(response.status, 200, `${role} login`);
    const cookie = response.headers.get("set-cookie");
    assert.ok(cookie?.includes("HttpOnly"));
    assert.ok(cookie.includes("SameSite=Lax"));
    cookies[role] = cookie.split(";")[0];
  }
});
after(async () => {
  if (server)
    await new Promise<void>((resolve) => server.close(() => resolve()));
  await fixture?.database.close();
});
test("discount pricing supports percentage, flat, and zero-floor rules", () => {
  assert.equal(
    calculateDiscountedPrice(100, {
      discountType: "Percentage",
      discountValue: 10,
    }).finalPrice,
    90,
  );
  assert.equal(
    calculateDiscountedPrice(100, { discountType: "Flat", discountValue: 25 })
      .finalPrice,
    75,
  );
  assert.equal(
    calculateDiscountedPrice(100, { discountType: "Flat", discountValue: 125 })
      .finalPrice,
    0,
  );
  assert.equal(calculateDiscountedPrice(100, undefined, false).finalPrice, 100);
});
test("health and unauthenticated API protection", async () => {
  assert.equal((await fetch(origin + "/api/health")).status, 200);
  assert.equal((await fetch(origin + "/api/admin/orders")).status, 401);
});
test("mobile validation runs before persistence", async () => {
  for (const mobile of ["123", "12345678901", "90000a0000"]) {
    const response = await fetch(origin + "/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "New User",
        mobile,
        password: "Test-only-123!",
      }),
    });
    assert.equal(response.status, 400);
    assert.match((await response.json()).message, /10-digit/);
  }
});
test("customer cannot read admin data and manager cannot access another store", async () => {
  assert.equal(
    (
      await fetch(origin + "/api/admin/orders", {
        headers: { Cookie: cookies.customer },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await fetch(
        origin + "/api/stores/00000000-0000-0000-0000-000000000099/team",
        { headers: { Cookie: cookies.store_manager } },
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await fetch(origin + "/api/admin/page-data?key=services", {
        headers: { Cookie: cookies.store_manager },
      })
    ).status,
    403,
  );
});
test("cross-origin writes are rejected", async () => {
  assert.equal(
    (
      await fetch(origin + "/api/auth/logout", {
        method: "POST",
        headers: { Origin: "https://other.invalid", Cookie: cookies.admin },
      })
    ).status,
    403,
  );
});
test("booking catalog includes item images and preserves tariff access", async () => {
  const response = await fetch(origin + "/api/admin/orders/booking-data", {
    headers: { Cookie: cookies.admin },
  });
  assert.equal(response.status, 200);
  const data = await response.json();
  const shirt = data.sheet.items.find(
    (item: { name: string }) => item.name === "Test Shirt",
  );
  assert.equal(shirt.imagePath, "/service-icons/wash-and-iron-shirt.png");
  assert.equal(
    (
      await fetch(origin + "/api/admin/orders/booking-data?tariffId=99999", {
        headers: { Cookie: cookies.store_manager },
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await fetch(origin + "/api/admin/orders/booking-data", {
        headers: { Cookie: cookies.customer },
      })
    ).status,
    403,
  );
});
test("charge master controls admin booking charges", async () => {
  const list = await fetch(origin + "/api/settings/order-charges", {
    headers: { Cookie: cookies.admin },
  });
  assert.equal(list.status, 200);
  const charges = (await list.json()).charges as Array<{
    id: string;
    code: string;
    amount: number;
  }>;
  const packing = charges.find((charge) => charge.code === "packing");
  assert.ok(packing);
  assert.equal(
    (
      await fetch(origin + "/api/settings/order-charges", {
        headers: { Cookie: cookies.customer },
      })
    ).status,
    403,
  );

  const update = await fetch(
    origin + `/api/settings/order-charges/${packing.id}`,
    {
      method: "PATCH",
      headers: { Cookie: cookies.admin, "Content-Type": "application/json" },
      body: JSON.stringify({
        code: packing.code,
        name: "Packing charge",
        type: "extra",
        amount: 35,
        isActive: true,
      }),
    },
  );
  assert.equal(update.status, 200, await update.text());
  const bookingData = await fetch(origin + "/api/admin/orders/booking-data", {
    headers: { Cookie: cookies.admin },
  });
  const bookingCharges = (await bookingData.json()).charges as Array<{
    code: string;
    amount: number;
  }>;
  assert.equal(
    bookingCharges.find((charge) => charge.code === "packing")?.amount,
    35,
  );

  const input = {
    ...fixture.bookingInput,
    idempotencyKey: "api-charge-master-booking-001",
    chargeCodes: ["packing"],
  };
  const order = await fetch(origin + "/api/admin/orders", {
    method: "POST",
    headers: { Cookie: cookies.admin, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  assert.equal(order.status, 201, await order.text());
  const saved = await fixture.database.query<{ amount: string }>(
    "SELECT amount FROM customer_orders WHERE idempotency_key=$1",
    [input.idempotencyKey],
  );
  assert.equal(Number(saved.rows[0].amount), 135);
});
test("discount groups assign to stores and change backend tariff prices", async () => {
  const services = await fixture.database.query<{ id: number; name: string }>(
    "SELECT id,name FROM services WHERE slug IN ('test-wash-iron','test-dry-clean') ORDER BY id",
  );
  const wash = services.rows.find(
    (service) => service.name === "Wash and iron",
  );
  const dry = services.rows.find((service) => service.name === "Dry clean");
  assert.ok(wash && dry);
  const create = await fetch(origin + "/api/admin/discount-groups", {
    method: "POST",
    headers: { Cookie: cookies.admin, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Standard Service Discount",
      description: "Store service discounts",
      isActive: true,
      rules: [
        { serviceId: wash.id, discountType: "Percentage", discountValue: 5 },
        { serviceId: dry.id, discountType: "Percentage", discountValue: 10 },
      ],
    }),
  });
  const createBody = (await create.json()) as {
    group: { id: number; rules: unknown[] };
  };
  assert.equal(create.status, 201);
  const group = createBody.group;
  assert.equal(group.rules.length, 2);
  assert.equal(
    (
      await fetch(origin + "/api/admin/discount-groups", {
        headers: { Cookie: cookies.customer },
      })
    ).status,
    403,
  );
  const assignment = await fetch(
    origin + "/api/admin/discount-groups/assignments",
    {
      method: "PATCH",
      headers: { Cookie: cookies.admin, "Content-Type": "application/json" },
      body: JSON.stringify({
        storeId: fixture.storeId,
        discountGroupId: group.id,
      }),
    },
  );
  assert.equal(assignment.status, 200, await assignment.text());
  const detail = await fetch(
    origin + `/api/admin/discount-groups/${group.id}`,
    { headers: { Cookie: cookies.admin } },
  );
  assert.equal(detail.status, 200);
  assert.equal((await detail.json()).group.stores.length, 1);
  const input = {
    ...fixture.bookingInput,
    idempotencyKey: "api-discount-group-booking-001",
    items: [
      {
        ...fixture.bookingInput.items[0],
        serviceId: Number(dry.id),
        quantity: 1,
      },
    ],
  };
  const order = await fetch(origin + "/api/admin/orders", {
    method: "POST",
    headers: { Cookie: cookies.admin, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  assert.equal(order.status, 201, await order.text());
  const saved = await fixture.database.query<{
    amount: string;
    discount_amount: string;
    unit_price: string;
    base_unit_price: string;
    discount_amount_item: string;
  }>(
    `SELECT orders.amount,orders.discount_amount,
       items.unit_price,items.base_unit_price,items.discount_amount AS discount_amount_item
     FROM customer_orders orders JOIN customer_order_items items ON items.order_id=orders.id
     WHERE orders.idempotency_key=$1`,
    [input.idempotencyKey],
  );
  assert.equal(Number(saved.rows[0].amount), 72);
  assert.equal(Number(saved.rows[0].discount_amount), 8);
  assert.equal(Number(saved.rows[0].base_unit_price), 80);
  assert.equal(Number(saved.rows[0].unit_price), 72);
  assert.equal(Number(saved.rows[0].discount_amount_item), 8);
  await fixture.database.query(
    "UPDATE stores SET discount_group_id=NULL WHERE id=$1",
    [fixture.storeId],
  );
});
test("migration is repeatable and page requests do not run schema setup", async () => {
  await fixture.migrateDatabase();
  const versions = await fixture.database.query(
    "SELECT * FROM mydhobi_schema_versions",
  );
  assert.equal(versions.rows.length, 1);
  const { isSchemaMigration } =
    await import("../apps/api/src/database/schema-mode");
  assert.equal(isSchemaMigration(), false);
  const start = fixture.queries.length;
  const response = await fetch(origin + "/api/admin/page-data?key=dashboard", {
    headers: { Cookie: cookies.admin },
  });
  assert.equal(response.status, 200);
  assert.equal(
    fixture.queries
      .slice(start)
      .some((sql) => /\b(CREATE|ALTER|DROP)\s+(TABLE|INDEX)\b/i.test(sql)),
    false,
  );
});
for (const key of [
  "dashboard",
  "customers",
  "stores",
  "store-create",
  "orders",
  "pickups",
  "deliveries",
  "services",
  "service-categories",
  "service-pricing",
  "service-mapping",
  "rate-card",
  "inventory",
  "riders",
  "payments",
  "offers",
  "referrals",
  "complaints",
  "reports",
  "wallet-report",
  "basic-setup",
  "charge-master",
  "discount-groups",
  "profile",
  "role-permissions",
]) {
  test(`admin page data: ${key}`, async () => {
    const response = await fetch(origin + `/api/admin/page-data?key=${key}`, {
      headers: { Cookie: cookies.admin },
    });
    assert.equal(response.status, 200, await response.text());
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
  });
}
for (const endpoint of [
  "home",
  "catalog",
  "orders",
  "wallet",
  "subscription",
  "addresses",
  "offers",
  "notifications",
  "settings",
  "referrals",
  "complaints",
]) {
  test(`customer data: ${endpoint}`, async () => {
    const response = await fetch(origin + `/api/customer/${endpoint}`, {
      headers: { Cookie: cookies.customer },
    });
    assert.equal(response.status, 200, await response.text());
  });
}
test("logout expires the session cookie", async () => {
  const response = await fetch(origin + "/api/auth/logout", {
    method: "POST",
    headers: { Cookie: cookies.admin },
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie") ?? "", /Max-Age=0/);
});
test("customer profile is returned by the account endpoint", async () => {
  const response = await fetch(origin + "/api/auth/me", {
    headers: { Cookie: cookies.customer },
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).user.mobile, "9000000002");
});
test("booking totals come from stored prices and repeated submission creates one order", async () => {
  const input = {
    ...fixture.bookingInput,
    idempotencyKey: "api-repeat-booking-001",
  };
  const submit = () =>
    fetch(origin + "/api/admin/orders", {
      method: "POST",
      headers: { Cookie: cookies.admin, "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  const first = await submit();
  assert.equal(first.status, 201, await first.clone().text());
  const second = await submit();
  assert.equal(second.status, 201, await second.clone().text());
  const orders = await fixture.database.query<{ amount: string }>(
    "SELECT amount FROM customer_orders WHERE idempotency_key=$1",
    [input.idempotencyKey],
  );
  assert.equal(orders.rows.length, 1);
  assert.equal(Number(orders.rows[0].amount), 100);
});
test("customer can schedule pickup with no garment list or estimated price", async () => {
  const addressResponse = await fetch(origin + "/api/customer/addresses", {
    method: "POST",
    headers: { Cookie: cookies.customer, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test Customer",
      phone: "9000000002",
      type: "Home",
      fullAddress: "1 Test Street",
      landmark: "",
      city: "Bengaluru",
      pincode: "560001",
      isDefault: true,
    }),
  });
  assert.equal(addressResponse.status, 201, await addressResponse.clone().text());
  const { address } = await addressResponse.json();
  const pickupResponse = await fetch(origin + "/api/customer/orders", {
    method: "POST",
    headers: {
      Cookie: cookies.customer,
      "Content-Type": "application/json",
      "Idempotency-Key": "customer-pickup-request-0001",
    },
    body: JSON.stringify({
      bookingKind: "quick",
      serviceIds: [],
      service: "Pickup request",
      items: [],
      addressId: address.id,
      pickupAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      pickupSlot: "10:00–12:00",
      deliveryOption: "standard",
      instructions: "",
      paymentMethod: "cash",
      couponCode: "",
    }),
  });
  assert.equal(pickupResponse.status, 201, await pickupResponse.clone().text());
  const { order } = await pickupResponse.json();
  assert.equal(order.status, "Pickup Scheduled");
  assert.equal(order.itemCount, 0);
  assert.equal(order.amount, 0);
  assert.equal(order.invoicePending, true);
  assert.equal(order.paymentStatus, "Unpaid");
  assert.deepEqual(order.items, []);

  const inspection = await fetch(`${origin}/api/admin/orders/${order.id}`, {
    method: "PATCH",
    headers: { Cookie: cookies.admin, "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "inspection",
      items: [{
        garmentId: String(fixture.bookingInput.items[0].garmentId),
        serviceId: String(fixture.bookingInput.items[0].serviceId),
        quantity: 3,
        stain: "Small coffee mark",
        fabric: "Cotton",
        instructions: "Wash separately",
      }],
    }),
  });
  assert.equal(inspection.status, 200, await inspection.clone().text());
  const { order: inspected } = await inspection.json();
  assert.equal(inspected.status, "Awaiting Confirmation");
  assert.equal(inspected.itemCount, 3);
  assert.equal(inspected.invoicePending, false);
  assert.equal(inspected.items[0].defect, "Stain: Small coffee mark");

  const confirmation = await fetch(`${origin}/api/customer/orders/${order.id}`, {
    method: "PATCH",
    headers: { Cookie: cookies.customer, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "confirm", paymentMethod: "cash" }),
  });
  assert.equal(confirmation.status, 200, await confirmation.clone().text());
  const { order: confirmed } = await confirmation.json();
  assert.equal(confirmed.status, "Confirmed");
  assert.equal(confirmed.paymentStatus, "Pending");
});
test("wallet credits persist and overdrafts are rejected", async () => {
  const path = `/api/customers/${fixture.bookingInput.customerId}/wallet`;
  const credit = await fetch(origin + path, {
    method: "POST",
    headers: { Cookie: cookies.admin, "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "add",
      amount: 100,
      reason: "Test adjustment",
    }),
  });
  assert.equal(credit.status, 200, await credit.clone().text());
  const overdraft = await fetch(origin + path, {
    method: "POST",
    headers: { Cookie: cookies.admin, "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "deduct",
      amount: 101,
      reason: "Test adjustment",
    }),
  });
  assert.equal(overdraft.status, 409);
  const balance = await fixture.database.query<{ balance: string }>(
    "SELECT balance FROM customer_wallets WHERE user_id=$1",
    [fixture.identities.customer],
  );
  assert.equal(Number(balance.rows[0].balance), 100);
});
test("customer subscription plans use wallet payment and prevent duplicates", async () => {
  const credit = await fetch(origin + "/api/customer/wallet", {
    method: "POST",
    headers: { Cookie: cookies.customer, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 599 }),
  });
  assert.equal(credit.status, 201, await credit.text());

  const plans = await fetch(origin + "/api/customer/subscription", {
    headers: { Cookie: cookies.customer },
  });
  assert.equal(plans.status, 200);
  const planData = await plans.json();
  assert.equal(planData.plans.length, 3);
  assert.equal(planData.active, null);

  const activate = await fetch(origin + "/api/customer/subscription", {
    method: "POST",
    headers: { Cookie: cookies.customer, "Content-Type": "application/json" },
    body: JSON.stringify({ planCode: "family-care" }),
  });
  assert.equal(activate.status, 201, await activate.clone().text());
  const activeData = await activate.json();
  assert.equal(activeData.subscription.planCode, "family-care");
  assert.equal(activeData.subscription.status, "active");

  const duplicate = await fetch(origin + "/api/customer/subscription", {
    method: "POST",
    headers: { Cookie: cookies.customer, "Content-Type": "application/json" },
    body: JSON.stringify({ planCode: "fresh-start" }),
  });
  assert.equal(duplicate.status, 409);
});
test("malformed bodies and non-string mobile numbers return validation errors", async () => {
  for (const body of [
    "{",
    "null",
    JSON.stringify({ mobile: 9000000000, password: "wrong-password" }),
  ]) {
    const response = await fetch(origin + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    assert.equal(response.status, 400);
  }
});

test("MsgClub OTP login and password reset flow", async () => {
  const originalFetch = globalThis.fetch;
  const originalAuthKey = process.env.MSGCLUB_AUTH_KEY;
  const originalApiUrl = process.env.MSGCLUB_API_URL;
  const originalSenderId = process.env.MSGCLUB_SENDER_ID;
  const originalTmid = process.env.MSGCLUB_TMID;
  const originalFailoverId = process.env.MSGCLUB_CONCENT_FAILOVER_ID;
  const smsUrls: URL[] = [];

  process.env.MSGCLUB_AUTH_KEY = "test-msgclub-key";
  process.env.MSGCLUB_API_URL =
    "https://msg.icloudsms.com/rest/services/sendSMS/sendGroupSms";
  process.env.MSGCLUB_SENDER_ID = "DEMOOS";
  process.env.MSGCLUB_TMID = "140200000022";
  process.env.MSGCLUB_CONCENT_FAILOVER_ID = "30";
  globalThis.fetch = async (input, init) => {
    const requestUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    if (requestUrl.startsWith("https://msg.icloudsms.com/")) {
      smsUrls.push(new URL(requestUrl));
      return new Response(JSON.stringify({ responseCode: 3001 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return originalFetch(input, init);
  };

  try {
    const loginRequest = await fetch(origin + "/api/auth/login/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile: "9000000000" }),
    });
    assert.equal(loginRequest.status, 200);
    assert.equal(smsUrls.length, 1);
    assert.equal(smsUrls[0].searchParams.get("AUTH_KEY"), "test-msgclub-key");
    assert.equal(smsUrls[0].searchParams.get("senderId"), "DEMOOS");
    assert.equal(smsUrls[0].searchParams.get("routeId"), "1");
    assert.equal(smsUrls[0].searchParams.get("mobileNos"), "9000000000");
    assert.equal(smsUrls[0].searchParams.get("smsContentType"), "english");
    assert.equal(smsUrls[0].searchParams.get("tmid"), "140200000022");
    assert.equal(smsUrls[0].searchParams.get("concentFailoverId"), "30");
    const loginCode = smsUrls[0].searchParams
      .get("message")
      ?.match(/\b\d{6}\b/)?.[0];
    assert.ok(loginCode);

    const loginVerify = await fetch(origin + "/api/auth/login/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile: "9000000000", otp: loginCode }),
    });
    assert.equal(loginVerify.status, 200, await loginVerify.text());
    assert.match(loginVerify.headers.get("set-cookie") ?? "", /HttpOnly/);

    const reusedCode = await fetch(origin + "/api/auth/login/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile: "9000000000", otp: loginCode }),
    });
    assert.equal(reusedCode.status, 401);

    const resetRequest = await fetch(
      origin + "/api/auth/password-reset/request-otp",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: "9000000002" }),
      },
    );
    assert.equal(resetRequest.status, 200);
    assert.equal(smsUrls.length, 2);
    const resetCode = smsUrls[1].searchParams
      .get("message")
      ?.match(/\b\d{6}\b/)?.[0];
    assert.ok(resetCode);

    const reset = await fetch(origin + "/api/auth/password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mobile: "9000000002",
        otp: resetCode,
        password: "Reset-only-123!",
      }),
    });
    assert.equal(reset.status, 200, await reset.text());

    const passwordLogin = await fetch(origin + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mobile: "9000000002",
        password: "Reset-only-123!",
      }),
    });
    assert.equal(passwordLogin.status, 200);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalAuthKey === undefined) delete process.env.MSGCLUB_AUTH_KEY;
    else process.env.MSGCLUB_AUTH_KEY = originalAuthKey;
    if (originalApiUrl === undefined) delete process.env.MSGCLUB_API_URL;
    else process.env.MSGCLUB_API_URL = originalApiUrl;
    if (originalSenderId === undefined) delete process.env.MSGCLUB_SENDER_ID;
    else process.env.MSGCLUB_SENDER_ID = originalSenderId;
    if (originalTmid === undefined) delete process.env.MSGCLUB_TMID;
    else process.env.MSGCLUB_TMID = originalTmid;
    if (originalFailoverId === undefined)
      delete process.env.MSGCLUB_CONCENT_FAILOVER_ID;
    else process.env.MSGCLUB_CONCENT_FAILOVER_ID = originalFailoverId;
  }
});
