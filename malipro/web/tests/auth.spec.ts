import { test, expect } from "@playwright/test";
import { mockApi } from "./fixtures/api-mock";

test.describe("Authentification", () => {
  test("connexion réussie redirige vers le tableau de bord", async ({ page }) => {
    await mockApi(page);
    await page.goto("/login");
    await page.getByPlaceholder("+22370000000").fill("+22370000000");
    await page.getByLabel("Mot de passe").fill("secret");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
  });

  test("identifiants invalides affichent une erreur", async ({ page }) => {
    await mockApi(page, { authFail: true });
    await page.goto("/login");
    await page.getByPlaceholder("+22370000000").fill("+22370000000");
    await page.getByLabel("Mot de passe").fill("wrong");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page.getByText("Identifiants invalides.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
