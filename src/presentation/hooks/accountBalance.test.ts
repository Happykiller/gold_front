import { describe, expect, it } from 'vitest';

import { applyDelete, applyReconcile, pendingBalance } from './accountBalance';
import type { AccountUsecaseModel } from '@usecase/model/account.usecase.model';

/**
 * Un compte réduit aux deux soldes. Le reste des champs n'intervient dans
 * aucun de ces calculs.
 */
const account = (reconcilied: number | null, notReconcilied: number | null) =>
  ({
    id: 1,
    label: 'Courant',
    balance_reconcilied: reconcilied,
    balance_not_reconcilied: notReconcilied,
  }) as unknown as AccountUsecaseModel;

describe('pendingBalance', () => {
  it('soustrait le solde pointé du solde projeté', () => {
    // 1 141,48 pointé sur 451,06 projeté → 690,42 encore en attente, au débit.
    expect(pendingBalance(account(1141.48, 451.06))).toBeCloseTo(-690.42, 2);
  });

  it('vaut 0 quand les deux soldes sont nuls', () => {
    // Un compte sans opération n'a aucun solde : le schéma les autorise à être
    // `null`, et l'affichage doit les lire comme des zéros.
    //
    // Ce cas ne prouve pas les `?? 0` : en JS `null - null` vaut déjà 0. Il
    // fige le contrat, pas l'implémentation — c'est le cas suivant qui mord.
    expect(pendingBalance(account(null, null))).toBe(0);
  });

  it('vaut 0 plutôt que NaN quand un solde est absent de la réponse', () => {
    // Le codegen déclare ces champs présents, mais le serveur peut ne renvoyer
    // que des `errors` et une donnée partielle. `undefined - 0` vaut NaN, et un
    // NaN traverse tout l'affichage sans lever quoi que ce soit.
    const partial = {
      balance_reconcilied: 0,
    } as unknown as AccountUsecaseModel;

    expect(pendingBalance(partial)).toBe(0);
  });
});

describe('applyReconcile', () => {
  it('diminue le solde pointé quand on pointe un débit', () => {
    // Le défaut historique : `operation.amount` était passé tel quel, toujours
    // positif, et pointer un débit *augmentait* le solde pointé.
    const next = applyReconcile(account(1000, 800), -50);

    expect(next.balance_reconcilied).toBe(950);
  });

  it('augmente le solde pointé quand on pointe un crédit', () => {
    expect(applyReconcile(account(1000, 800), 50).balance_reconcilied).toBe(
      1050,
    );
  });

  it('ne touche pas au solde projeté', () => {
    // Le solde projeté compte déjà l'opération : changer son statut ne déplace
    // rien. C'est le second défaut historique.
    const next = applyReconcile(account(1000, 800), -50);

    expect(next.balance_not_reconcilied).toBe(800);
  });

  it('traite un solde pointé absent comme un zéro', () => {
    expect(applyReconcile(account(null, 800), -50).balance_reconcilied).toBe(
      -50,
    );
  });
});

describe('applyDelete', () => {
  it('ne retire une opération en attente que du solde projeté', () => {
    const next = applyDelete(account(1000, 800), -50, false);

    expect(next.balance_not_reconcilied).toBe(850);
    expect(next.balance_reconcilied).toBe(1000);
  });

  it('retire une opération pointée des deux soldes', () => {
    // Elle était comptée dans les deux : elle doit sortir des deux.
    const next = applyDelete(account(1000, 800), -50, true);

    expect(next.balance_not_reconcilied).toBe(850);
    expect(next.balance_reconcilied).toBe(1050);
  });
});
