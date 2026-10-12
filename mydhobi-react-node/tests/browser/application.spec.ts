import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";

async function login(page: Page, role: "admin" | "customer" = "admin") {
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "Mobile number", exact: true })
    .fill(role === "admin" ? "9000000000" : "9000000002");
  await page.getByLabel(/^Password/).fill("Test-only-123!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(
    role === "admin" ? /\/admin\/dashboard$/ : /\/customer$/,
  );
  await expect(page.getByRole("progressbar", { name: /Loading/ })).toHaveCount(
    0,
  );
}
async function noOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(widths.content).toBeLessThanOrEqual(widths.viewport + 1);
}
test("sign-in uses MUI, accepts digits only, and shows an error", async ({
  page,
}, info) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await page
    .getByRole("textbox", { name: "Mobile number", exact: true })
    .fill("12ab34");
  await expect(
    page.getByRole("textbox", { name: "Mobile number", exact: true }),
  ).toHaveValue("1234");
  await page
    .getByRole("textbox", { name: "Mobile number", exact: true })
    .fill("1234567890");
  await page.getByLabel(/^Password/).fill("wrong-password");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(page.getByLabel(/^Password/)).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Invalid mobile number or password.",
  );
  await noOverflow(page);
  await mkdir("artifacts/screenshots", { recursive: true });
  await page.screenshot({
    path: `artifacts/screenshots/${info.project.name}-login.png`,
    fullPage: true,
  });
});
test("admin screens load and the customer form opens", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await login(page);
  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true }),
  ).toBeVisible();
  await noOverflow(page);
  await page.screenshot({
    path: `artifacts/screenshots/${info.project.name}-dashboard.png`,
    fullPage: true,
  });
  if (info.project.name === "mobile") {
    await page.getByRole("button", { name: "Toggle menu" }).click();
    await expect(
      page.getByRole("navigation", { name: "Main menu" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Customers", exact: true }).click();
  } else
    await page.getByRole("link", { name: "Customers", exact: true }).click();
  await expect(
    page.getByText("Test Customer", { exact: true }).first(),
  ).toBeVisible();
  await noOverflow(page);
  await page.screenshot({
    path: `artifacts/screenshots/${info.project.name}-customers.png`,
    fullPage: true,
  });
  const add = page.getByRole("button", { name: /add customer/i });
  await add.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCSS("transform", "none");
  if (info.project.name === "mobile")
    await expect
      .poll(() =>
        page
          .getByRole("dialog")
          .evaluate((element) => element.getBoundingClientRect().width),
      )
      .toBe(390);
  await page.screenshot({
    path: `artifacts/screenshots/${info.project.name}-customer-form.png`,
    fullPage: true,
    animations: "disabled",
  });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await add.click();
  const dialog = page.getByRole("dialog");
  const customerName = `Browser ${info.project.name} ${Date.now()}`;
  const mobile = `9${String(Date.now()).slice(-9)}`;
  await dialog.getByLabel(/^Full Name/).fill(customerName);
  await dialog.getByLabel(/^Mobile Number/).fill(mobile);
  await dialog.getByLabel(/^House\/Flat No/).fill("12");
  await dialog.getByLabel(/^Street\/Area/).fill("Test Road");
  await dialog.getByLabel(/^City/).fill("Pune");
  await dialog.getByLabel(/^Pincode/).fill("411001");
  await dialog.getByRole("combobox").selectOption("business");
  const saved = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/customers") &&
      response.request().method() === "POST",
  );
  await dialog
    .getByRole("button", { name: "Add Customer", exact: true })
    .click();
  expect((await saved).status()).toBe(201);
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText(customerName, { exact: true })).toBeVisible();
  for (const path of [
    "/admin/orders",
    "/admin/orders/new",
    "/admin/store",
    "/admin/rate-card",
    "/admin/inventory",
    "/admin/payments",
    "/admin/reports",
    "/admin/settings/basic-setup",
  ]) {
    await page.goto(path);
    await expect(page.getByRole("progressbar")).toHaveCount(0);
    await expect(
      page.getByText("Unable to open this page.", { exact: true }),
    ).toHaveCount(0);
    await noOverflow(page);
  }
  expect(errors).toEqual([]);
});
test("sidebar navigation keeps the layout and reuses cached page data", async ({
  page,
}, info) => {
  await login(page);
  const heading = await page
    .getByRole("heading", { name: "Dashboard", exact: true })
    .elementHandle();
  expect(heading).not.toBeNull();
  let customerRequests = 0;
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      url.pathname === "/api/admin/page-data" &&
      url.searchParams.get("key") === "customers"
    )
      customerRequests += 1;
  });
  async function openFromMenu(name: string) {
    if (info.project.name === "mobile")
      await page.getByRole("button", { name: "Toggle menu" }).click();
    await page
      .getByRole("navigation", { name: "Main menu" })
      .getByRole("link", { name, exact: true })
      .click();
    if (info.project.name === "mobile")
      await expect(
        page.getByRole("navigation", { name: "Main menu" }),
      ).toBeHidden();
  }
  if (info.project.name === "desktop")
    await page
      .getByRole("textbox", { name: "Search", exact: true })
      .fill("Keep this search");
  await openFromMenu("Customers");
  await expect(
    page.getByRole("heading", { name: "Customers", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Test Customer", { exact: true }).first(),
  ).toBeVisible();
  expect(await heading!.evaluate((element) => element.isConnected)).toBe(true);
  await openFromMenu("Dashboard");
  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true }),
  ).toBeVisible();
  await openFromMenu("Customers");
  await expect(
    page.getByText("Test Customer", { exact: true }).first(),
  ).toBeVisible();
  expect(customerRequests).toBe(1);
  expect(await heading!.evaluate((element) => element.isConnected)).toBe(true);
  await expect(
    page.getByRole("status", { name: "Loading page", exact: true }),
  ).toHaveCount(0);
  if (info.project.name === "desktop")
    await expect(
      page.getByRole("textbox", { name: "Search", exact: true }),
    ).toHaveValue("Keep this search");
  await noOverflow(page);
  await page.screenshot({
    path: `artifacts/screenshots/${info.project.name}-sidebar-navigation.png`,
    fullPage: true,
  });
});
test("sidebar artwork loads in the full and compact menus", async ({
  page,
}, info) => {
  await login(page);
  if (info.project.name === "mobile")
    await page.getByRole("button", { name: "Toggle menu" }).click();
  const menu = page.getByRole("navigation", { name: "Main menu" });
  const icons = menu.locator('img[src^="/sidebar/3d-v1/"]');
  await expect(icons).toHaveCount(16);
  await expect
    .poll(() =>
      icons.evaluateAll((images) =>
        images.every(
          (image) =>
            image instanceof HTMLImageElement &&
            image.complete &&
            image.naturalWidth > 0,
        ),
      ),
    )
    .toBe(true);
  await expect(
    menu.getByRole("link", { name: "Dashboard", exact: true }),
  ).toBeVisible();
  await noOverflow(page);
  await page.screenshot({
    path: `artifacts/screenshots/${info.project.name}-sidebar-3d.png`,
    fullPage: true,
    animations: "disabled",
  });
  if (info.project.name === "desktop") {
    await page.getByRole("button", { name: "Toggle menu" }).click();
    await expect(icons).toHaveCount(15);
    const dashboard = menu.getByRole("link", {
      name: "Dashboard",
      exact: true,
    });
    await expect(dashboard).toBeVisible();
    await expect(dashboard.locator("img")).toHaveCSS("width", "26px");
    await expect(dashboard.locator("img")).toHaveCSS("height", "26px");
    await dashboard.hover();
    await expect(
      page.getByRole("tooltip", { name: "Dashboard", exact: true }),
    ).toBeVisible();
    await noOverflow(page);
    await page.screenshot({
      path: "artifacts/screenshots/desktop-sidebar-3d-collapsed.png",
      fullPage: true,
      animations: "disabled",
    });
  }
});
test("customer pages and MUI bottom navigation work", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await login(page, "customer");
  await expect(
    page.getByRole("navigation", { name: "Customer navigation" }),
  ).toBeVisible();
  await noOverflow(page);
  await page.screenshot({
    path: `artifacts/screenshots/${info.project.name}-customer-home.png`,
    fullPage: true,
  });
  await page
    .getByRole("navigation", { name: "Customer navigation" })
    .getByRole("link", { name: "Orders", exact: true })
    .click();
  await expect(page).toHaveURL(/\/customer\/orders$/);
  for (const path of [
    "/customer/services",
    "/customer/wallet",
    "/customer/profile",
    "/customer/addresses",
    "/customer/addresses/new",
    "/customer/settings",
  ]) {
    await page.goto(path);
    await expect(page.getByRole("progressbar")).toHaveCount(0);
    await expect(
      page.getByText("Unable to open this page.", { exact: true }),
    ).toHaveCount(0);
    await noOverflow(page);
  }
  expect(errors).toEqual([]);
});
