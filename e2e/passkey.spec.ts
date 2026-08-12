// La reproduction du symptôme qui a déclenché tout le chantier : une passkey
// **synchronisée** ne servait à rien sur un second poste.
//
// On le rejoue sans matériel, avec l'authentificateur virtuel de Chrome piloté
// par CDP. La synchronisation elle-même se simule en recopiant la credential
// d'un authentificateur virtuel dans un autre : c'est exactement ce que fait un
// gestionnaire dans le nuage — même credential, même clé, autre machine.
//
// Ce que ce test prouve, et qu'aucun autre ne peut prouver :
//   1. l'enregistrement produit une credential **découvrable** (sans quoi
//      `getCredentials` ne rendrait rien d'utilisable ailleurs) ;
//   2. la connexion aboutit depuis un navigateur au `localStorage` vide, sans
//      qu'aucun identifiant ne soit saisi ;
//   3. le challenge vient bien du serveur, puisque le second navigateur n'a
//      jamais vu celui de l'enregistrement.
//
// Il ÉCRIT en base — c'est le seul du harnais. La clé créée porte un libellé
// reconnaissable et est supprimée à la fin, y compris si le test a échoué.
import { test, expect, request, type Page } from '@playwright/test';

import { exigerCompte } from './comptes';

const LIBELLE = 'e2e-authentificateur-virtuel';
// Le harnais ne vise que l'API locale — le garde-fou est dans playwright.config.ts.
const API_URL = 'http://localhost:24000/graphql';

/** Un authentificateur de plateforme à clés découvrables, utilisateur déjà
 *  vérifié : le plus proche d'un gestionnaire de mots de passe moderne. */
async function brancherAuthentificateur(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  const { authenticatorId } = await cdp.send(
    'WebAuthn.addVirtualAuthenticator',
    {
      options: {
        protocol: 'ctap2',
        transport: 'internal',
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
        automaticPresenceSimulation: true,
      },
    },
  );
  return { cdp, authenticatorId };
}

/**
 * Fait le ménage par l'API plutôt que par l'écran.
 *
 * Le passage par l'interface s'est révélé trop fragile — le bouton de
 * suppression ne se désigne pas sans ambiguïté dans une liste — et un ménage
 * qui échoue en silence laisse des clés derrière lui à chaque exécution. Ici,
 * on supprime **toutes** celles du libellé de test, y compris celles qu'un run
 * précédent aurait abandonnées.
 */
async function supprimerClesDeTest() {
  const { login, password } = exigerCompte();
  const api = await request.newContext({ baseURL: API_URL });

  const gql = async (query: string, token?: string) => {
    const reponse = await api.post('', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      data: { query },
    });
    return (await reponse.json())?.data;
  };

  const auth = await gql(
    `{ auth(dto: { login: "${login}", password: "${password}" }) { access_token } }`,
  );
  const token = auth?.auth?.access_token;
  if (!token) return;

  const liste = await gql('{ passkeys_for_user { id label } }', token);
  for (const passkey of liste?.passkeys_for_user ?? []) {
    if (passkey.label === LIBELLE) {
      await gql(
        `mutation { delete_passkey(dto: { passkey_id: "${passkey.id}" }) }`,
        token,
      );
    }
  }

  await api.dispose();
}

async function seConnecterParMotDePasse(page: Page) {
  const { login, password } = exigerCompte();
  await page.goto('/login');
  await page.getByLabel(/nom d'utilisateur/i).fill(login);
  await page.getByLabel(/mot de passe/i).fill(password);
  await page.getByRole('button', { name: /valider/i }).click();
  await page.waitForURL('**/accounts', { timeout: 15_000 });
}

test('une passkey synchronisée ouvre la session sur un poste neuf', async ({
  browser,
}) => {
  test.setTimeout(180_000);

  const posteOrigine = await browser.newContext();
  const posteNeuf = await browser.newContext();

  try {
    // --- Poste d'origine : enregistrement de la clé -------------------------
    const pageA = await posteOrigine.newPage();
    const { cdp: cdpA, authenticatorId: authA } =
      await brancherAuthentificateur(pageA);

    await seConnecterParMotDePasse(pageA);
    await pageA.goto('/profile');

    await pageA.getByLabel(/nom de l'appareil/i).fill(LIBELLE);
    await pageA.getByRole('button', { name: /ajouter une clé/i }).click();

    // La clé apparaît dans la liste : l'aller-retour avec le serveur a abouti.
    await expect(pageA.getByText(LIBELLE).first()).toBeVisible({
      timeout: 15_000,
    });

    // --- La « synchronisation » --------------------------------------------
    const { credentials } = await cdpA.send('WebAuthn.getCredentials', {
      authenticatorId: authA,
    });
    expect(credentials.length).toBeGreaterThan(0);
    // Une credential non découvrable ne serait d'aucun secours ailleurs : le
    // navigateur ne saurait pas la proposer sans qu'on lui donne son identifiant.
    expect(credentials[0].isResidentCredential).toBe(true);

    // --- Poste neuf : localStorage vide, même clé ---------------------------
    const pageB = await posteNeuf.newPage();
    const { cdp: cdpB, authenticatorId: authB } =
      await brancherAuthentificateur(pageB);
    await cdpB.send('WebAuthn.addCredential', {
      authenticatorId: authB,
      credential: credentials[0],
    });

    await pageB.goto('/login');

    // Rien n'est saisi : ni identifiant, ni mot de passe. C'est précisément ce
    // qui était impossible — le bouton restait grisé faute de `user_code` dans
    // le stockage de ce navigateur.
    //
    // Deux chemins mènent au même résultat, et les deux sont bons : l'autofill
    // peut aboutir seul (l'authentificateur virtuel confirme sans interaction,
    // là où un vrai demanderait une empreinte), sinon on emprunte le bouton.
    const parAutofill = await pageB
      .waitForURL('**/accounts', { timeout: 8_000 })
      .then(() => true)
      .catch(() => false);

    if (!parAutofill) {
      const bouton = pageB.getByRole('button', { name: /clé d'accès/i });
      await expect(bouton).toBeEnabled();
      await bouton.click();
      await pageB.waitForURL('**/accounts', { timeout: 20_000 });
    }

    await expect(pageB.locator('header')).toBeVisible();
  } finally {
    await posteOrigine.close();
    await posteNeuf.close();
    await supprimerClesDeTest();
  }
});
