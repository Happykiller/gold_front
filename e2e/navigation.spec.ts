// Le parcours réel : de l'arbre des comptes aux opérations d'un compte.
//
// C'est le seul écran que l'URL seule n'atteint pas utilement — `/operations`
// exige un `account_id`, et le choisir en dur amarrerait le test aux données du
// dump. On y va comme l'utilisateur : en cliquant un compte.
//
// Ce que ce test attrape et que l'ouverture d'URL n'attrape pas : un lien de
// navigation cassé, un paramètre perdu en route, une table d'opérations qui ne
// se remplit jamais.
import { test, expect } from '@playwright/test';

import { attendreEcran, exigerJournauxVides, surveiller } from './outils';

test('un compte de l’arbre mène à ses opérations', async ({ page }) => {
  const journaux = surveiller(page);

  await page.goto('/accounts');
  await attendreEcran(page, 'Comptes');

  // Le libellé de chaque compte est un `<button>` porteur d'un `title`
  // (molecule/accountTree.tsx) : c'est lui qui navigue. Le premier de l'arbre
  // suffit — on juge le chemin, pas un compte en particulier.
  const compte = page.locator('button[title]').first();
  await expect(compte).toBeVisible();
  const libelle = await compte.getAttribute('title');
  await compte.click();

  await expect(page).toHaveURL(/\/operations\?account_id=\d+/);
  await expect(
    page.getByText(libelle!, { exact: false }).first(),
  ).toBeVisible();
  await page.waitForLoadState('networkidle');

  await page.screenshot({
    path: 'e2e/captures/operations.png',
    fullPage: true,
  });

  exigerJournauxVides(journaux);
});
