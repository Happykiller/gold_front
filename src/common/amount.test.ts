import { describe, expect, it } from 'vitest';

import { AMOUNT_PATTERN, isAmount, parseAmount } from '@src/common/amount';

describe('parseAmount', () => {
  it('accepte la virgule décimale', () => {
    expect(parseAmount('12,34')).toBe(12.34);
  });

  it("conserve les centimes d'une saisie à la virgule", () => {
    // Le défaut constaté en production : `parseFloat('91,17')` rend 91, et
    // l'opération était créée amputée de ses centimes, sans aucun signal.
    expect(parseAmount('91,17')).toBe(91.17);
    expect(parseAmount('0,05')).toBe(0.05);
  });

  it('accepte aussi le point décimal', () => {
    expect(parseAmount('91.17')).toBe(91.17);
  });

  it('renvoie 0 plutôt que NaN sur une saisie vide ou invalide', () => {
    // NaN contaminerait tous les totaux en aval, et la garde `amount <= 0`
    // des formulaires le laisse passer : il partirait tel quel au serveur.
    expect(parseAmount('')).toBe(0);
    expect(parseAmount('abc')).toBe(0);
  });
});

describe('isAmount', () => {
  it('accepte un entier et deux décimales, point ou virgule', () => {
    expect(isAmount('91')).toBe(true);
    expect(isAmount('91,1')).toBe(true);
    expect(isAmount('91,17')).toBe(true);
    expect(isAmount('91.17')).toBe(true);
  });

  it('refuse une saisie vide, non numérique ou trop précise', () => {
    expect(isAmount('')).toBe(false);
    expect(isAmount('abc')).toBe(false);
    expect(isAmount('91,175')).toBe(false);
    expect(isAmount('-91,17')).toBe(false);
  });

  it('valide exactement ce que les champs de saisie annoncent', () => {
    // Les deux doivent rester la même règle : la prop `regex` de l'`Input`
    // décide de la validité affichée, `isAmount` de celle du bouton d'envoi.
    expect(new RegExp(AMOUNT_PATTERN).test('91,17')).toBe(isAmount('91,17'));
  });
});
