// Outillage commun aux suites e2e. Fichier volontairement hors `*.spec.ts` :
// Playwright refuse qu'un fichier de test en importe un autre.
import { expect, type Page } from '@playwright/test';

/** Branche les mouchards sur une page et rend les journaux collectés.
 *  Les trois listes sont volontairement séparées : une erreur GraphQL, une
 *  exception JS et un `console.error` ne se diagnostiquent pas pareil. */
export function surveiller(page: Page) {
  const console_: string[] = [];
  const exceptions: string[] = [];
  const graphql: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') console_.push(message.text());
  });
  page.on('pageerror', (erreur) => exceptions.push(erreur.message));
  page.on('response', async (reponse) => {
    if (!reponse.url().includes('/graphql')) return;
    try {
      const corps = await reponse.json();
      for (const erreur of corps.errors ?? []) {
        graphql.push(
          `${erreur.message} ${JSON.stringify(erreur.extensions ?? {})}`,
        );
      }
    } catch {
      // Réponse non-JSON (API tombée, proxy HTML) : le statut suffit à le dire.
      if (!reponse.ok())
        graphql.push(`HTTP ${reponse.status()} sur ${reponse.url()}`);
    }
  });

  return { console_, exceptions, graphql };
}

/** Vérifie les trois journaux d'un coup, avec des messages qui nomment la
 *  nature du défaut plutôt que de dérouler un tableau anonyme. */
export function exigerJournauxVides(journaux: ReturnType<typeof surveiller>) {
  expect(journaux.graphql, 'erreurs GraphQL').toEqual([]);
  expect(journaux.exceptions, 'exceptions JavaScript').toEqual([]);
  expect(journaux.console_, 'console.error').toEqual([]);
}

/** Attend qu'un écran protégé soit réellement peint.
 *
 *  Surtout pas `networkidle` comme seul signal : en développement, Vite sert les
 *  modules par vagues et laisse une fenêtre de silence réseau AVANT que le
 *  chunk `React.lazy` de l'écran n'arrive. L'attente se terminait donc sur une
 *  page vide, parfaitement verte et parfaitement inutile — les premières
 *  captures produites par ce harnais étaient des rectangles sombres.
 *  Le repère est le rendu lui-même ; le réseau au repos ne sert qu'ensuite, à
 *  ne pas photographier un écran à moitié chargé. */
export async function attendreEcran(page: Page, titre: string | RegExp) {
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.locator('header')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: titre, level: 1 }),
  ).toBeVisible();
  await page.waitForLoadState('networkidle');
}
