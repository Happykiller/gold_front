import { describe, expect, it } from 'vitest';

import { applyDelete, applyReconcile } from './accountBalance';
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
