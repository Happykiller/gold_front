// src\presentation\molecule\appLayout.ts

/**
 * Géométrie partagée de l'application.
 *
 * Dans son propre module plutôt qu'exportée par l'en-tête : la table n'a pas à
 * importer un composant pour lire une largeur, et un fichier qui exporte
 * autre chose que des composants perd le rechargement à chaud.
 */

/**
 * Largeur utile d'un écran de liste, partagée par sa barre et son tableau.
 *
 * Les sept colonnes de la table consomment 432 px fixes, 72 px de gouttières
 * et 40 px de marge interne : 544 px incompressibles. Aux 950 px d'origine, la
 * description n'aurait disposé que de 406 px. 1100 tient dans le
 * `Container maxWidth="lg"` du layout.
 *
 * Surtout, la constante est **unique** : l'en-tête était à 950 et la table en
 * pleine largeur, et le décalage se voyait.
 */
export const APP_MAX_WIDTH = 1100;

/** Hauteur de la barre du compte quand aucun critère n'est posé. */
export const SCREEN_BAR_HEIGHT = 52;

/**
 * Hauteur de la barre de navigation du socle, qui est elle-même `sticky` en
 * `top: 0`. Tout ce qui colle en dessous doit s'en décaler, sans quoi il
 * glisse dessous au défilement.
 */
export const APP_BAR_HEIGHT = { xs: 56, sm: 64 };

/**
 * Variable CSS portant le bas réel de la barre du compte.
 *
 * Elle est **mesurée**, pas calculée. La somme « hauteur de la barre de
 * navigation + 52 » paraissait suffire, mais aucun des deux termes n'est
 * garanti : la barre du socle se dimensionne sur son contenu, et celle du
 * compte grandit dès qu'une puce de recherche est posée. Une valeur devinée
 * décale tous les éléments collants de la table, et le décalage ne se voit
 * qu'à l'écran.
 */
export const STICKY_TOP_VAR = '--gold-account-sticky-top';

/** Repli tant que la mesure n'a pas eu lieu (premier rendu). */
export const STICKY_TOP = `var(${STICKY_TOP_VAR}, ${
  APP_BAR_HEIGHT.sm + SCREEN_BAR_HEIGHT
}px)`;
