import { test, expect } from "@playwright/test";
import { mockApi, seedAuth } from "./fixtures/api-mock";

test.beforeEach(async ({ page }) => {
  await mockApi(page);
  await seedAuth(page);
});

test("la grille des commissions se charge avec les taux", async ({ page }) => {
  await page.goto("/commissions");
  await expect(page.getByRole("heading", { name: "Commissions" }).first()).toBeVisible();
  await expect(page.getByRole("spinbutton").first()).toHaveValue("12.5");
});

test("modifier un taux et enregistrer affiche la confirmation", async ({ page }) => {
  await page.goto("/commissions");
  const first = page.getByRole("spinbutton").first();
  await first.fill("14");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Enregistré ✓")).toBeVisible();
});

test("un taux hors bornes bloque l'enregistrement", async ({ page }) => {
  await page.goto("/commissions");
  await page.getByRole("spinbutton").first().fill("150");
  await expect(page.getByText(/entre 0 et 100/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Enregistrer" })).toBeDisabled();
});
