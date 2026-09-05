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
