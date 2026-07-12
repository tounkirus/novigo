import { test, expect } from "@playwright/test";
import { mockApi, seedAuth } from "./fixtures/api-mock";

test("une session absente redirige vers /login", async ({ page }) => {
  await mockApi(page);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("la déconnexion ramène à /login", async ({ page }) => {
  await mockApi(page);
  await seedAuth(page);
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Déconnexion" }).click();
  await expect(page).toHaveURL(/\/login/);
});
