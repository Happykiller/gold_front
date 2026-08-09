// src\presentation\hooks\referentialIds.ts

/**
 * Identifiants des référentiels fermés, tels que les pose le seed SQL
 * `gold_server/src/migration/002-seed`.
 *
 * Un module **sans aucun import**, et c'est sa raison d'être : ces valeurs
 * étaient déclarées dans `useAccountOperations`, qui tire le conteneur
 * d'injection et, avec lui, `@happykiller/sunny-ui`. Toute logique pure qui
 * voulait s'y référer héritait de cette dépendance — au point de ne plus être
 * chargeable en test.
 *
 * `useAccountOperations` les réexporte : les écrans qui les importaient de là
 * continuent de fonctionner.
 */

/** Statuts. Le rapprochement fait basculer du prévisionnel au réel. */
export const STATUS_FOLLOW = 1;
export const STATUS_RECONCILED = 2;

/** Types d'opération. Le virement porte deux comptes. */
export const TYPE_CREDIT = 1;
export const TYPE_DEBIT = 2;
export const TYPE_TRANSFER = 3;

/**
 * Classement de repli, quand rien ne permet d'en déduire un meilleur.
 *
 * Ces trois entrées sont les seules de leur référentiel à ne pas être des
 * libellés saisis par l'utilisateur : « Autre » et la paire
 * créditeur/débiteur, qui porte à elle seule près des trois quarts des
 * opérations de la base.
 *
 * Les deux tiers vont par paire et se choisissent au **sens** de l'opération :
 * classer une rentrée d'argent en « Débiteur » serait faux.
 */
export const CATEGORY_OTHER = 1;
export const THIRD_OTHER_CREDIT = 1;
export const THIRD_OTHER_DEBIT = 2;
