// Passage en revue des écrans protégés, sur la vraie API locale.
//
// Ce que ce fichier juge, et que rien d'autre ne juge :
//   1. l'écran se monte et affiche son titre (jsdom monte, mais ne rend pas) ;
//   2. l'API a répondu sans erreur GraphQL — c'est le filet du couplage front ↔
//      back décrit dans ../CLAUDE.md : un resolver renommé côté serveur casse le
//      front en silence, aucun typage ne le signale ;
//   3. la console est propre — une exception React dans un `useEffect` ne fait
//      pas échouer un test Vitest, mais vide l'écran de l'utilisateur.
//
// Chaque écran laisse une capture dans `e2e/captures/` : le contrôle à l'œil
// reste la seule barrière contre les défauts de mise en page, autant l'outiller.
// Ces captures contiennent des données bancaires réelles — le dossier est
// gitignoré, ne pas le sortir du poste.
//
// Lecture seule, délibérément : aucune mutation, aucun formulaire soumis. La
// base de développement porte un dump de production.
import { test, expect } from '@playwright/test';

import { attendreEcran, exigerJournauxVides, surveiller } from './outils';

const CAPTURES = 'e2e/captures';

/** Les écrans atteignables par une URL seule, et le repère qui prouve qu'ils
 *  sont rendus — le titre `PageShell`, un `h1` (molecule/pageShell.tsx).
 *
 *  N'y figurent pas ceux qui dépendent d'une sélection préalable
 *  (`/operations`, `/operation_edit`, `/account_edit`, `/operation_new`) :
 *  ouverts à froid ils n'ont rien à afficher, et leur échec ne dirait rien de
 *  leur santé. `/operations` est couvert par navigation.spec.ts, par le chemin
 *  que prend l'utilisateur. */
const ECRANS = [
  { chemin: '/accounts', nom: 'comptes', titre: 'Comptes' },
  { chemin: '/createVir', nom: 'virement', titre: 'Virement' },
  { chemin: '/ventilation', nom: 'ventilation', titre: 'Ventilation' },
  { chemin: '/graphic', nom: 'graphique', titre: 'Trésorerie' },
  { chemin: '/clone', nom: 'clone', titre: 'Clonage' },
];

for (const ecran of ECRANS) {
  test(`écran ${ecran.nom} (${ecran.chemin})`, async ({ page }) => {
    const journaux = surveiller(page);

    await page.goto(ecran.chemin);
    await attendreEcran(page, ecran.titre);

    await page.screenshot({
      path: `${CAPTURES}/${ecran.nom}.png`,
      fullPage: true,
    });

    exigerJournauxVides(journaux);
  });
}

test('écran profil (/profile)', async ({ page }) => {
  // Le profil vient de `sunny-ui` et n'utilise pas `PageShell` : pas de `h1` à
  // attendre, on vise un libellé que la page est seule à porter.
  const journaux = surveiller(page);

  await page.goto('/profile');
  await expect(page.getByText(/Identifiant/i).first()).toBeVisible();
  await page.waitForLoadState('networkidle');

  await page.screenshot({ path: `${CAPTURES}/profil.png`, fullPage: true });

  exigerJournauxVides(journaux);
});
