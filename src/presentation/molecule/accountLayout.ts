// src\presentation\molecule\accountLayout.ts

/**
 * Géométrie partagée de l'écran compte.
 *
 * Dans son propre module plutôt qu'exportée par l'en-tête : la table n'a pas à
 * importer un composant pour lire une largeur, et un fichier qui exporte
 * autre chose que des composants perd le rechargement à chaud.
 */

/**
 * Largeur utile de l'écran, partagée par l'en-tête et la table.
 *
 * Les sept colonnes de la table consomment 432 px fixes, 72 px de gouttières
 * et 40 px de marge interne : 544 px incompressibles. Aux 950 px d'origine, la
 * description n'aurait disposé que de 406 px. 1100 tient dans le
 * `Container maxWidth="lg"` du layout.
 *
 * Surtout, la constante est **unique** : l'en-tête était à 950 et la table en
 * pleine largeur, et le décalage se voyait.
 */
export const ACCOUNT_MAX_WIDTH = 1100;

/** Hauteur de la barre, sur laquelle la table cale ses en-têtes collants. */
export const ACCOUNT_HEADER_HEIGHT = 52;

/**
 * Hauteur de la barre de navigation du socle, qui est elle-même `sticky` en
 * `top: 0`. Tout ce qui colle en dessous doit s'en décaler, sans quoi il
 * glisse dessous au défilement.
 */
export const APP_BAR_HEIGHT = { xs: 56, sm: 64 };
