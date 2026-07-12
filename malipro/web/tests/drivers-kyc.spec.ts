import { test, expect } from "@playwright/test";
import { mockApi, seedAuth } from "./fixtures/api-mock";

test.beforeEach(async ({ page }) => {
  await mockApi(page);
  await seedAuth(page);
});

test("la file KYC liste les livreurs à valider", async ({ page }) => {
  await page.goto("/drivers");
  await expect(page.getByRole("heading", { name: "Livreurs" }).first()).toBeVisible();
  await expect(page.getByText("Moussa Keïta")).toBeVisible();
  // « À valider » est l'option du filtre KYC (dans un <select> natif, donc non « visible »).
  await expect(page.getByRole("option", { name: "À valider" })).toBeAttached();
});

test("la revue affiche les documents et permet d'approuver", async ({ page }) => {
  await page.goto("/drivers/driver-1");
  await expect(page.getByRole("heading", { name: "Validation KYC" }).first()).toBeVisible();
  await expect(page.getByText("Pièce d'identité")).toBeVisible();
  await page.getByRole("button", { name: "Approuver" }).click();
  await expect(page.getByText("Approuvé").first()).toBeVisible();
});
