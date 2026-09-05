import { expect, test } from "@playwright/test";

test("home shell loads without page errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("./");
  await expect(page.getByRole("heading", { name: "Daily Hold" })).toBeVisible();
  await expect(page.getByTestId("build-status")).toHaveAttribute("data-ready", "true", {
    timeout: 20_000,
  });
  await expect(page.locator("canvas")).toBeVisible({ timeout: 20_000 });
  expect(errors).toEqual([]);
});

test("starting an attempt enters the play scene", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("./");
  await expect(page.getByTestId("build-status")).toHaveAttribute("data-ready", "true", {
    timeout: 20_000,
  });

  // Click through Phaser canvas center-bottom CTA region approximately.
  const canvas = page.locator("canvas");
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();
  if (!box) return;

  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.66);
  await expect(page.getByTestId("build-status")).toHaveText(/Play scene ready/i, {
    timeout: 10_000,
  });
  expect(errors).toEqual([]);
});
