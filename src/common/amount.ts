// src/common/amount.ts
//
// La lecture d'un montant saisi par l'utilisateur.
//
// Le clavier numérique français produit une virgule décimale, et tous les
// champs de montant du produit l'acceptent explicitement (regex
// `^[0-9]+([.,][0-9]{1,2})?$`). Mais `parseFloat('91,17')` rend `91` : il
// s'arrête au premier caractère non numérique, sans erreur ni NaN. Une saisie
// valide, acceptée par le champ, perdait donc ses centimes en silence.
//
// Cette fonction est le seul endroit où une saisie devient un nombre. Elle
// vivait dans `ventilation.calc.ts`, où seule la ventilation en profitait,
// pendant que la création d'opération refaisait le calcul à la main — et se
// trompait.

/**
 * Convertit une saisie utilisateur en nombre, virgule décimale comprise.
 * Une saisie vide ou non numérique vaut 0 — jamais NaN, qui contaminerait
 * tous les totaux en aval et partirait tel quel au serveur.
 */
export function parseAmount(value: string): number {
  return parseFloat(value.replace(',', '.')) || 0;
}

/**
 * Ce qu'un champ de montant accepte : un entier ou deux décimales, point ou
 * virgule. Exprimé en chaîne parce que l'`Input` de `sunny-ui` prend sa règle
 * de validation sous cette forme.
 */
export const AMOUNT_PATTERN = '^[0-9]+([.,][0-9]{1,2})?$';

/** La saisie est-elle un montant recevable ? */
export function isAmount(value: string): boolean {
  return new RegExp(AMOUNT_PATTERN).test(value);
}
