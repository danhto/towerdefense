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

  const canvas = page.locator("canvas");
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();
  if (!box) return;

  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.58);
  await expect(page.getByTestId("build-status")).toHaveText(/Play scene ready/i, {
    timeout: 10_000,
  });
  expect(errors).toEqual([]);
});

test("?tutorial=1 auto-enters play with the coach armed", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  // Pretend the player already finished the tour once.
  await page.addInitScript(() => {
    localStorage.setItem("daily-hold-tutorial-v1", "1");
    localStorage.removeItem("daily-hold-tutorial-force-v1");
  });

  await page.goto("./?tutorial=1");
  await expect(page.getByTestId("build-status")).toHaveText(/Play scene ready/i, {
    timeout: 20_000,
  });
  await expect(page.getByTestId("build-status")).toHaveAttribute("data-tutorial", "1", {
    timeout: 10_000,
  });

  const forced = await page.evaluate(
    () => localStorage.getItem("daily-hold-tutorial-force-v1") === "1",
  );
  expect(forced).toBe(true);
  expect(errors).toEqual([]);
});

test("burning 3 official attempts flips home to Practice (T6)", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByTestId("build-status")).toHaveAttribute("data-ready", "true", {
    timeout: 20_000,
  });

  // Seed attempt state as if 3 official runs were used today.
  await page.evaluate(() => {
    const now = new Date();
    const dateKey = now.toISOString().slice(0, 10);
    localStorage.setItem(
      "daily-hold-attempts-v1",
      JSON.stringify({ dateKey, officialStarted: 3 }),
    );
  });

  await page.reload();
  await expect(page.getByTestId("build-status")).toHaveAttribute("data-ready", "true", {
    timeout: 20_000,
  });

  // Status line in HTML shell should reflect Practice after reload.
  await expect(page.locator("#dare-label")).toHaveText(/Practice/i, {
    timeout: 10_000,
  });

  const canvas = page.locator("canvas");
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();
  if (!box) return;

  // Enter Practice CTA (same relative position as start).
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.58);
  await expect(page.getByTestId("build-status")).toHaveText(/Play scene ready/i, {
    timeout: 10_000,
  });
});
