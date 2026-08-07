import { describe, expect, it } from 'vitest';

import {
  destinationAmount,
  isExceeded,
  isFullyAllocated,
  parseAmount,
  totalAllocated,
} from '@presentation/ventilation.calc';

const pct = (value: string) => ({
  isPercentage: true,
  amountStr: { value },
});
const fixed = (value: string) => ({
  isPercentage: false,
  amountStr: { value },
});

describe('parseAmount', () => {
  it('accepte la virgule décimale', () => {
    expect(parseAmount('12,34')).toBe(12.34);
  });

  it('renvoie 0 plutôt que NaN sur une saisie vide ou invalide', () => {
    // NaN contaminerait tous les totaux en aval et rendrait la validation
    // incompréhensible pour l'utilisateur.
    expect(parseAmount('')).toBe(0);
    expect(parseAmount('abc')).toBe(0);
  });
});

describe('destinationAmount', () => {
  it('applique un pourcentage au montant total', () => {
    expect(destinationAmount(pct('25'), 200)).toBe(50);
  });

  it('reprend tel quel un montant fixe, sans regarder le total', () => {
    expect(destinationAmount(fixed('30'), 200)).toBe(30);
  });
});

describe('totalAllocated', () => {
  it('additionne pourcentages et montants fixes', () => {
    expect(totalAllocated([pct('50'), fixed('20')], 100)).toBe(70);
  });

  it('arrondit au centime les répartitions en tiers', () => {
    // 3 × 33,33 % de 100 vaut 99,99 en arithmétique flottante mais traîne
    // une imprécision binaire : sans arrondi, la comparaison d'égalité
    // d'isFullyAllocated ne tomberait jamais juste.
    expect(
      totalAllocated([pct('33.33'), pct('33.33'), pct('33.34')], 100),
    ).toBe(100);
  });

  it('vaut 0 pour une liste vide', () => {
    expect(totalAllocated([], 100)).toBe(0);
  });
});

describe('isExceeded', () => {
  it('signale un dépassement', () => {
    expect(isExceeded([pct('120')], 100)).toBe(true);
  });

  it('ne signale rien quand la répartition tombe juste', () => {
    expect(isExceeded([pct('100')], 100)).toBe(false);
  });

  it('ne signale rien tant que le montant à ventiler est nul', () => {
    // Sinon le formulaire s'ouvrirait en erreur, avant toute saisie.
    expect(isExceeded([fixed('10')], 0)).toBe(false);
  });
});

describe('isFullyAllocated', () => {
  it('autorise la validation quand tout est réparti', () => {
    expect(isFullyAllocated([pct('60'), pct('40')], 250)).toBe(true);
  });

  it('refuse un reliquat non réparti', () => {
    expect(isFullyAllocated([pct('60')], 250)).toBe(false);
  });

  it('refuse un montant total nul, même sans destination', () => {
    expect(isFullyAllocated([], 0)).toBe(false);
  });

  it('accepte un mélange pourcentage et montant fixe qui tombe juste', () => {
    expect(isFullyAllocated([pct('50'), fixed('50')], 100)).toBe(true);
  });
});
