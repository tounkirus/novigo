import { test, expect } from "@playwright/test";
import { mockApi, seedAuth } from "./fixtures/api-mock";

test.beforeEach(async ({ page }) => {
  await mockApi(page);
  await seedAuth(page);
});

test("le détail d'une commande affiche articles, total et suivi", async ({ page }) => {
  await page.goto("/orders/order-1");
  await expect(page.getByRole("heading", { name: "Détail commande" })).toBeVisible();
  await expect(page.getByText("Poulet braisé")).toBeVisible();
  await expect(page.getByText("8 000 FCFA").first()).toBeVisible();
  await expect(page.getByText("Suivi en temps réel")).toBeVisible();
  await expect(page.getByText("12 min")).toBeVisible();
});

test("depuis la liste, cliquer une référence ouvre le détail", async ({ page }) => {
  await page.goto("/orders");
  await page.getByText("MLP-2026-000001").click();
  await expect(page).toHaveURL(/\/orders\/order-1/);
});
