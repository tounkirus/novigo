import { test, expect } from "@playwright/test";
import { mockApi, seedAuth } from "./fixtures/api-mock";

test.beforeEach(async ({ page }) => {
  await mockApi(page);
  await seedAuth(page);
});

test("la table des commandes se charge et pagine", async ({ page }) => {
  await page.goto("/orders");
  // Le titre figure dans la barre supérieure ET dans le contenu : on cible le premier.
  await expect(page.getByRole("heading", { name: "Commandes" }).first()).toBeVisible();
  await expect(page.getByText("MLP-2026-000001")).toBeVisible();
  await page.getByRole("button", { name: "Suivant" }).click();
  await expect(page.getByText(/page 2\//)).toBeVisible();
});

test("le filtre statut est appliqué", async ({ page }) => {
  await page.goto("/orders");
  await page.getByRole("combobox").selectOption("DELIVERED");
  await expect(page.getByText("Livrée").first()).toBeVisible();
});
