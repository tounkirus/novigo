import { test, expect } from "@playwright/test";
import { mockApi, seedAuth } from "./fixtures/api-mock";

test.beforeEach(async ({ page }) => {
  await mockApi(page);
  await seedAuth(page);
});

test("la réconciliation affiche synthèse et écarts", async ({ page }) => {
  await page.goto("/payments/reconciliation");
  await expect(page.getByRole("heading", { name: "Réconciliation" })).toBeVisible();
  await expect(page.getByText("Total opérateur")).toBeVisible();
  // Par défaut : écarts seulement -> la ligne MATCHED est masquée.
  await expect(page.getByText("Écart montant")).toBeVisible();
  await expect(page.getByText("Absent opérateur")).toBeVisible();
});

test("le lien depuis Paiements ouvre la réconciliation", async ({ page }) => {
  await page.goto("/payments");
  await page.getByRole("link", { name: "Réconciliation" }).click();
  await expect(page).toHaveURL(/\/payments\/reconciliation/);
});
