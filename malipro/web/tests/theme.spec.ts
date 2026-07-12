import { test, expect } from "@playwright/test";
import { mockApi, seedAuth } from "./fixtures/api-mock";

test.beforeEach(async ({ page }) => {
  await mockApi(page);
  await seedAuth(page);
});

const hasDark = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.classList.contains("dark"));

test("la bascule de thème active le mode sombre, le persiste et survit au rechargement", async ({ page }) => {
  await page.goto("/dashboard");

  // État initial : ni clair ni sombre forcés (mode système).
  expect(await hasDark(page)).toBe(false);

  const toggle = page.getByRole("button", { name: /Thème/ });
  await expect(toggle).toBeVisible();

  // système -> clair
  await toggle.click();
  await expect(page.getByRole("button", { name: /Thème : Clair/ })).toBeVisible();
  expect(await hasDark(page)).toBe(false);

  // clair -> sombre
  await toggle.click();
  await expect(page.getByRole("button", { name: /Thème : Sombre/ })).toBeVisible();
  expect(await hasDark(page)).toBe(true);

  // Persistance du choix.
  expect(await page.evaluate(() => localStorage.getItem("novigo-theme"))).toBe("dark");

  // Anti-FOUC : le thème sombre est réappliqué au rechargement.
  await page.reload();
  expect(await hasDark(page)).toBe(true);
});

test("le mode sombre applique réellement un fond sombre au corps", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /Thème/ }).click(); // -> clair
  const lightBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

  await page.getByRole("button", { name: /Thème : Clair/ }).click(); // -> sombre
  await expect(page.getByRole("button", { name: /Thème : Sombre/ })).toBeVisible();

  // Le fond change réellement entre clair et sombre (jetons CSS pilotés par --paper).
  // On sonde car la transition CSS (0.2s) interpole la couleur.
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor))
    .not.toBe(lightBg);
});
