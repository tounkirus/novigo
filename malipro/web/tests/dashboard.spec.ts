import { test, expect } from "@playwright/test";
import { mockApi, seedAuth } from "./fixtures/api-mock";

test.beforeEach(async ({ page }) => {
  await mockApi(page);
  await seedAuth(page);
});

test("les cartes KPI affichent les valeurs du contrat", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByText("GMV")).toBeVisible();
  // Scopé au contenu principal : « Commandes » existe aussi dans la nav latérale.
  await expect(page.getByRole("main").getByText("Commandes", { exact: true })).toBeVisible();
  await expect(page.getByText("Livreurs actifs")).toBeVisible();
  await expect(page.getByText("Dernières commandes")).toBeVisible();
});
