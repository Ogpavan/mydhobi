import { mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("customer schedules pickup without adding garments", async ({
  page,
  browser,
}, info) => {
  await mkdir("artifacts/screenshots", { recursive: true });
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "Mobile number", exact: true })
    .fill("9000000002");
  await page.getByLabel(/^Password/).fill("Test-only-123!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/customer$/);
  await expect(
    page.getByRole("heading", { name: "Select Service" }),
  ).toBeVisible();
  const bottomNav = page.getByRole("navigation", {
    name: "Customer navigation",
  });
  await expect(
    bottomNav.getByRole("link", { name: "Packages" }),
  ).toHaveAttribute("href", "/customer/packages");
  await expect(
    bottomNav.getByRole("link", { name: "Profile" }),
  ).toHaveAttribute("href", "/customer/profile");
  await expect(bottomNav.getByRole("link", { name: "WhatsApp" })).toHaveCount(
    0,
  );
  await page.screenshot({
    path: `artifacts/screenshots/${info.project.name}-customer-home-pickup.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Open menu" }).click();
  const customerMenu = page.getByRole("navigation", {
    name: "Customer menu",
  });
  await expect(customerMenu).toBeVisible();
  await expect
    .poll(async () =>
      page
        .locator(".MuiDrawer-paper")
        .first()
        .evaluate((paper) => paper.getBoundingClientRect().x),
    )
    .toBe(0);
  await expect(
    customerMenu.getByRole("link", { name: "Request pickup" }),
  ).toBeVisible();
  await page.screenshot({
    path: `artifacts/screenshots/${info.project.name}-customer-sidebar.png`,
    fullPage: false,
  });
  await customerMenu.getByRole("link", { name: "Request pickup" }).click();
  await expect(
    page.getByRole("heading", { name: "Choose services" }),
  ).toBeVisible();
  await page.getByText("Not sure? Let our team inspect your items.").click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  await expect(
    page.getByRole("heading", { name: "Pickup Address" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Test Customer Home/ }).first(),
  ).toBeVisible();
  await page.screenshot({
    path: `artifacts/screenshots/${info.project.name}-customer-addresses.png`,
    fullPage: true,
  });
  await page.getByRole("link", { name: "Continue", exact: true }).click();

  await expect(
    page.getByRole("heading", { name: "Pickup date & time" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Tomorrow/ }).click();
  await page.getByRole("button", { name: /10:00 AM - 12:00 PM/ }).click();
  await expect(
    page.getByRole("button", { name: "Confirm pickup", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: `artifacts/screenshots/${info.project.name}-customer-pickup-schedule.png`,
    fullPage: true,
  });

  await page
    .getByRole("button", { name: "Confirm pickup", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Please keep your items ready/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Order placed successfully" }),
  ).toBeVisible();
  await expect(page.locator(".order-success-confetti > span")).toHaveCount(12);
  const trackLink = page.getByRole("link", { name: "View pickup details" });
  await expect(trackLink).toBeVisible();
  await page.screenshot({
    path: `artifacts/screenshots/${info.project.name}-customer-pickup-confirmed.png`,
    fullPage: true,
  });
  const orderPath = await trackLink.getAttribute("href");
  expect(orderPath).toBeTruthy();

  const staffContext = await browser.newContext({
    viewport:
      info.project.name === "mobile"
        ? { width: 390, height: 844 }
        : { width: 1440, height: 1000 },
  });
  const staffPage = await staffContext.newPage();
  await staffPage.goto("/");
  await staffPage
    .getByRole("textbox", { name: "Mobile number", exact: true })
    .fill("9000000000");
  await staffPage.getByLabel(/^Password/).fill("Test-only-123!");
  await staffPage.getByRole("button", { name: "Sign in", exact: true }).click();
  await staffPage.goto(`/admin/orders/${orderPath!.split("/").at(-1)}`);
  await staffPage.getByRole("button", { name: "Inspect items" }).click();
  await expect(
    staffPage.getByText("Inspect items", { exact: true }),
  ).toBeVisible();
  await staffPage.getByLabel("Quantity").first().fill("2");
  await staffPage.getByRole("button", { name: "Send final order" }).click();
  await expect(
    staffPage.getByText("Awaiting Confirmation", { exact: true }).first(),
  ).toBeVisible();
  await staffContext.close();

  await page.goto(orderPath!);
  await expect(
    page.getByRole("heading", { name: "Order Details" }),
  ).toBeVisible();
  await expect(
    page.getByText("Awaiting Confirmation", { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirm · Pay Later" }).click();
  await expect(
    page.getByText("Confirmed", { exact: true }).first(),
  ).toBeVisible();
  await page.goto("/customer/orders");
  await expect(page.getByRole("heading", { name: "My Orders" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Track order", exact: false }).first(),
  ).toBeVisible();
  await page.screenshot({
    path: `artifacts/screenshots/${info.project.name}-customer-orders.png`,
    fullPage: false,
  });
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(1);
  await page.goto("/customer/packages");
  await expect(
    page.getByRole("heading", { name: "Laundry Packages" }),
  ).toBeVisible();
  const packageGrid = page.getByRole("region", {
    name: "Available packages",
  });
  await expect(packageGrid.getByRole("article").first()).toBeVisible();
  await page.screenshot({
    path: `artifacts/screenshots/${info.project.name}-customer-packages.png`,
    fullPage: true,
  });
  await page
    .getByRole("navigation", { name: "Customer navigation" })
    .getByRole("link", { name: "Profile" })
    .click();
  await expect(page.getByRole("heading", { name: "My Profile" })).toBeVisible();
  const profileLinks = page.getByRole("region", { name: "Profile links" });
  await expect(profileLinks.getByRole("link")).toHaveCount(7);
  await expect(
    profileLinks.getByRole("link", { name: "My Requests" }),
  ).toHaveCount(0);
  await page.screenshot({
    path: `artifacts/screenshots/${info.project.name}-customer-profile.png`,
    fullPage: false,
  });
});
