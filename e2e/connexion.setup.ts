// Connexion, jouée une fois pour toutes les suites.
//
// L'écran de login vient de `@happykiller/sunny-ui` (LoginPage n'est qu'un
// câblage d'icônes et de usecases) : les libellés sont ceux de
// src/locales/fr/translation.json, section `login`. On cible par libellé plutôt
// que par structure — un id de MUI change au gré des versions, pas le texte que
// l'utilisateur lit.
import { test as setup, expect } from '@playwright/test';

import { exigerCompte } from './comptes';
import { FICHIER_SESSION } from '../playwright.config';

setup('se connecter et mémoriser la session', async ({ page }) => {
  const { login, password } = exigerCompte();

  await page.goto('/login');

  await page.getByLabel(/nom d'utilisateur/i).fill(login);
  await page.getByLabel(/mot de passe/i).fill(password);
  await page.getByRole('button', { name: /valider/i }).click();

  // La preuve que l'authentification a abouti n'est pas le simple changement
  // d'URL : `/` redirige vers `/accounts` avant même que l'API ait répondu.
  // On attend l'écran protégé rendu.
  await page.waitForURL('**/accounts', { timeout: 15_000 });
  await expect(
    page.getByRole('navigation').or(page.locator('header')),
  ).toBeVisible();

  await page.context().storageState({ path: FICHIER_SESSION });
});
