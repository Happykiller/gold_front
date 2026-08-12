// Identifiants du compte applicatif utilisé par les tests de bout en bout.
//
// Ils ne sont PAS dans le dépôt : ils viennent de l'environnement, ou à défaut
// de `../.env.accounts` — le fichier gitignoré du dépôt orchestrateur, déjà lu
// par `bin/dev-gql.sh` (convention GOLD_<ENV>_LOGIN / _PASSWORD / _API).
// Ce qui est exporté dans le shell l'emporte, pour qu'un appel ponctuel puisse
// viser un autre compte sans toucher au fichier.
//
// La lecture du fichier parent est une commodité, pas une dépendance : lancé
// depuis un poste où gold_front est cloné seul, il suffit d'exporter les deux
// variables.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const FICHIER_COMPTES = resolve(process.cwd(), '..', '.env.accounts');

function lireFichier(): Record<string, string> {
  if (!existsSync(FICHIER_COMPTES)) return {};
  const valeurs: Record<string, string> = {};
  for (const ligne of readFileSync(FICHIER_COMPTES, 'utf8').split('\n')) {
    // Une seule découpe sur le premier `=` : un mot de passe peut en contenir.
    const trouve = /^\s*([A-Z0-9_]+)=(.*)$/.exec(ligne);
    if (trouve) valeurs[trouve[1]] = trouve[2].trim();
  }
  return valeurs;
}

const fichier = lireFichier();
const lire = (cle: string) => process.env[cle] || fichier[cle] || '';

export const compte = {
  login: lire('GOLD_LOCAL_LOGIN') || lire('GOLD_DEV_LOGIN') || 'faro',
  password: lire('GOLD_LOCAL_PASSWORD') || lire('GOLD_DEV_PASSWORD'),
};

export function exigerCompte(): { login: string; password: string } {
  if (!compte.password) {
    throw new Error(
      `Mot de passe absent pour le compte « ${compte.login} ».\n` +
        `Renseigner GOLD_LOCAL_PASSWORD dans ${FICHIER_COMPTES}, ou dans l'environnement.`,
    );
  }
  return compte as { login: string; password: string };
}
