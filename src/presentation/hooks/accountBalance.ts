// src\presentation\hooks\accountBalance.ts
// Le type vient du modèle de usecase, pas du hook : ce module ne doit rien
// savoir de React ni du chargement, c'est ce qui le rend testable sans monter
// quoi que ce soit.
import type { AccountUsecaseModel as Account } from '@usecase/model/account.usecase.model';

/**
 * Le modèle des soldes, lisible nulle part ailleurs que dans la fonction SQL
 * `getBalance` (gold_server, migration 001-install/002-function) :
 *
 *   balance_reconcilied     = Σ des opérations de statut 2        → solde pointé
 *   balance_not_reconcilied = Σ des opérations de statut 1 et 2   → solde PROJETÉ (total)
 *
 * Les deux ne sont donc **pas** deux seaux disjoints : le second contient le
 * premier. D'où :
 *
 *   somme en attente = balance_not_reconcilied − balance_reconcilied
 *
 * C'est la confusion inverse qui avait produit les trois défauts corrigés ici :
 * pointer une opération décrémentait le total, alors que changer un statut ne
 * déplace rien — le total est le même avant et après.
 *
 * Les deux soldes sont nullables au schéma : un compte sans opération n'en a
 * pas, et ils valent alors zéro.
 */

/**
 * Somme des opérations en attente de pointage.
 *
 * Dérivée, jamais stockée : aucun champ de l'API ne la porte, et le nombre
 * d'opérations concernées n'est exposé nulle part — c'est pourquoi l'en-tête
 * affiche un montant sans compteur.
 */
export function pendingBalance(account: Account): number {
  return (
    (account.balance_not_reconcilied ?? 0) - (account.balance_reconcilied ?? 0)
  );
}

/**
 * Pointage d'une opération : elle entre dans le solde pointé et **le solde
 * projeté ne bouge pas**, puisqu'il la comptait déjà.
 *
 * `signedAmount` porte le sens de l'opération — un débit est négatif. Le
 * paramètre n'accepte volontairement pas une `Operation` : c'est en passant
 * `operation.amount`, toujours positif, que pointer un débit augmentait le
 * solde pointé.
 */
export function applyReconcile(
  account: Account,
  signedAmount: number,
): Account {
  return {
    ...account,
    balance_reconcilied: (account.balance_reconcilied ?? 0) + signedAmount,
  };
}

/**
 * Suppression d'une opération : elle sort du solde projeté dans tous les cas,
 * et du solde pointé en plus si elle était pointée.
 */
export function applyDelete(
  account: Account,
  signedAmount: number,
  wasReconciled: boolean,
): Account {
  return {
    ...account,
    balance_not_reconcilied:
      (account.balance_not_reconcilied ?? 0) - signedAmount,
    balance_reconcilied: wasReconciled
      ? (account.balance_reconcilied ?? 0) - signedAmount
      : account.balance_reconcilied,
  };
}
