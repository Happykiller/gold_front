import { describe, expect, it } from 'vitest';

import { getSignedAmount } from './operationDisplay';
import type { Operation } from '@presentation/hooks/useAccountOperations';

/** Une opération réduite à ce qui détermine le sens de son montant. */
const operation = (
  type_id: number,
  amount: number,
  account_id_dest: number | null = null,
) => ({ type_id, amount, account_id_dest }) as unknown as Operation;

const CURRENT = 2;

/**
 * C'est cette fonction qui porte le signe, et donc tout le calcul des soldes
 * optimistes de l'écran compte — voir `accountBalance.ts`. Elle n'était pas
 * couverte.
 */
describe('getSignedAmount', () => {
  it('compte un crédit positivement', () => {
    expect(getSignedAmount(operation(1, 50), CURRENT)).toBe(50);
  });

  it('compte un débit négativement', () => {
    expect(getSignedAmount(operation(2, 50), CURRENT)).toBe(-50);
  });

  it('compte positivement un virement reçu sur le compte courant', () => {
    expect(getSignedAmount(operation(3, 50, CURRENT), CURRENT)).toBe(50);
  });

  it('compte négativement un virement émis vers un autre compte', () => {
    // Un virement est une écriture unique portant deux comptes : la même ligne
    // apparaît dans les deux listes, avec un sens opposé.
    expect(getSignedAmount(operation(3, 50, 7), CURRENT)).toBe(-50);
  });
});
