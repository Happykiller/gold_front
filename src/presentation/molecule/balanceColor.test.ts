import { describe, expect, it } from 'vitest';

import { getBalanceColor } from './operationDisplay';
import { AMOUNT } from '@src/theme/tokens';

/**
 * Une seule règle, testée une seule fois.
 *
 * Trois s'étaient installées, une par écran — positif vert dans l'arbre des
 * comptes, gris dans le sélecteur, blanc dans l'en-tête — et aucune ne
 * traitait le zéro.
 */
describe('getBalanceColor', () => {
  it('peint un solde négatif comme un débit', () => {
    expect(getBalanceColor(-1450.53)).toBe(AMOUNT.debit);
  });

  it('peint un solde positif comme un crédit', () => {
    // Le défaut signalé : le positif restait gris dans le sélecteur de
    // modèles, alors que le négatif s'y colorait.
    expect(getBalanceColor(5465)).toBe(AMOUNT.credit);
  });

  it('ne peint pas un solde nul en crédit', () => {
    // Un compte modèle a toujours un solde pointé nul — ses opérations ne sont
    // jamais pointées — et l'arbre l'affichait donc en vert, comme un gain.
    expect(getBalanceColor(0)).toBe(AMOUNT.neutral);
    expect(getBalanceColor(0)).not.toBe(AMOUNT.credit);
  });
});
