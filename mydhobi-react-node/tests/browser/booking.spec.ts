import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { mkdir } from "node:fs/promises";

async function openBooking(page: Page) {
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "Mobile number", exact: true })
    .fill("9000000000");
  await page.getByLabel(/^Password/).fill("Test-only-123!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  await page.goto("/admin/orders/new");
  await expect(
    page.getByRole("button", { name: "General Booking", exact: true }),
  ).toBeVisible();
}

async function screenshot(page: Page, info: TestInfo, name: string) {
  await mkdir("artifacts/screenshots", { recursive: true });
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(1);
  await page.screenshot({
    path: `artifacts/screenshots/${info.project.name}-booking-${name}.png`,
    fullPage: true,
    animations: "disabled",
  });
}

test("general booking keeps stages, categories, services and customer details through checkout", async ({
  page,
}, info) => {
  await openBooking(page);
  await expect(
    page.getByRole("complementary", { name: "Item categories" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Place order", exact: true }),
  ).toHaveCount(0);
  const artwork = page.locator('img[src^="/booking/3d-v1/"]');
  await expect(artwork).toHaveCount(2);
  await expect
    .poll(() =>
      artwork.evaluateAll((images) =>
        images.every(
          (image) =>
            image instanceof HTMLImageElement &&
            image.complete &&
            image.naturalWidth > 0,
        ),
      ),
    )
    .toBe(true);
  await screenshot(page, info, "type");
  await page
    .getByRole("button", { name: "General Booking", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Review order", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Add Test Shirt", exact: true }),
  ).toBeVisible();
  const category = await page
    .getByRole("complementary", { name: "Item categories" })
    .boundingBox();
  const items = await page
    .getByRole("region", { name: "Available items" })
    .boundingBox();
  expect(category!.x + category!.width).toBeLessThanOrEqual(items!.x + 1);
  await expect(
    page.getByRole("combobox", { name: "Customer", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("textbox", { name: "Search items" })
    .fill("no-match-item");
  await expect(page.getByText("No items match your search.")).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  await screenshot(page, info, "items");
  await page
    .getByRole("button", { name: "Add Test Shirt", exact: true })
    .click();
  let dialog = page.getByRole("dialog", { name: "Test Shirt", exact: true });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Review order", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Add Test Shirt", exact: true })
    .click();
  dialog = page.getByRole("dialog", { name: "Test Shirt", exact: true });
  await dialog.getByRole("button", { name: /Dry clean/ }).click();
  await expect(
    dialog.getByRole("button", { name: /Dry clean/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await dialog
    .getByRole("spinbutton", { name: "Quantity", exact: true })
    .fill("2");
  await dialog.getByLabel("Fabric", { exact: true }).selectOption("Cotton");
  await dialog
    .getByLabel("Packaging type", { exact: true })
    .selectOption("Hanger");
  await dialog.getByLabel("Color", { exact: true }).fill("Blue");
  await expect(dialog.getByText("₹160", { exact: true })).toBeVisible();
  await screenshot(page, info, "item-details");
  await dialog.getByRole("button", { name: "Add & close" }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole("button", { name: "Women", exact: true }).click();
  await page
    .getByRole("button", { name: "Add Test Saree", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Test Saree" })
    .getByRole("button", { name: "Add & close" })
    .click();
  await page.getByRole("button", { name: "Review order", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Available items" }),
  ).toHaveCount(0);
  const review = page.getByRole("region", { name: "Order review" });
  await expect(review.getByText("Test Shirt · Dry clean")).toBeVisible();
  await expect(review.getByText("Hanger · Cotton · Blue")).toBeVisible();
  await expect(review.getByText("₹280", { exact: true }).first()).toBeVisible();
  await page
    .getByRole("combobox", { name: "Customer", exact: true })
    .selectOption({ label: "Test Customer · 9000000002" });
  await page
    .getByLabel("Instructions", { exact: true })
    .fill("Handle with care");
  await screenshot(page, info, "review");
  await page
    .getByRole("button", { name: "Back to items", exact: true })
    .click();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page
    .getByRole("button", { name: "Package Booking", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Clear added items?" })
    .getByRole("button", { name: "Keep items" })
    .click();
  await page
    .getByRole("button", { name: "General Booking", exact: true })
    .click();
  await page.getByRole("button", { name: "Review order", exact: true }).click();
  await expect(page.getByLabel("Instructions", { exact: true })).toHaveValue(
    "Handle with care",
  );
  await page
    .getByRole("button", { name: "Remove Test Saree", exact: true })
    .click();
  const saved = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/admin/orders") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Place order", exact: true }).click();
  const response = await saved;
  expect(response.status()).toBe(201);
  const submitted = response.request().postDataJSON();
  expect(submitted.bookingType).toBe("general");
  expect(submitted.items).toHaveLength(1);
  expect(submitted.items[0]).toMatchObject({
    quantity: 2,
    packingType: "Hanger",
    fabric: "Cotton",
    color: "Blue",
  });
  await expect(page).toHaveURL(/\/admin\/orders\/[^/]+$/);
});

test("package booking supports decimal weight and confirms clearing an order", async ({
  page,
}, info) => {
  await openBooking(page);
  await page
    .getByRole("button", { name: "Package Booking", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Add Test Shirt", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Add Test Laundry", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Test Laundry",
    exact: true,
  });
  await expect(
    dialog.getByRole("spinbutton", { name: "Quantity", exact: true }),
  ).toHaveCount(0);
  await dialog
    .getByRole("spinbutton", { name: "Weight (kg)", exact: true })
    .fill("2.5");
  await expect(dialog.getByText("₹150", { exact: true })).toBeVisible();
  await screenshot(page, info, "package");
  await dialog.getByRole("button", { name: "Add & close" }).click();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page
    .getByRole("button", { name: "General Booking", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Clear added items?" })
    .getByRole("button", { name: "Clear and change" })
    .click();
  await expect(
    page.getByRole("button", { name: "Review order", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page
    .getByRole("button", { name: "Package Booking", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add Test Laundry", exact: true })
    .click();
  await dialog
    .getByRole("spinbutton", { name: "Weight (kg)", exact: true })
    .fill("2.5");
  await dialog.getByRole("button", { name: "Add & close" }).click();
  await page.getByRole("button", { name: "Review order", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Customer", exact: true })
    .selectOption({ label: "Test Customer · 9000000002" });
  const saved = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/admin/orders") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Place order", exact: true }).click();
  const response = await saved;
  expect(response.status()).toBe(201);
  expect(response.request().postDataJSON()).toMatchObject({
    bookingType: "package",
    items: [{ quantity: 2.5 }],
  });
  await expect(page).toHaveURL(/\/admin\/orders\/[^/]+$/);
});
