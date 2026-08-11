import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Même chaîne d'imports que la table : le store atteint le singleton
// d'injection, qui charge le bundle CommonJS de `sunny-ui` que Vitest ne sait
// pas exécuter en module ES. Rien de ce qui est testé ici n'appelle l'API.
vi.mock('@src/common/inversify', () => ({ default: {} }));

import { FloatingCalculator } from './FloatingCalculator';
import { renderWithApp } from '@src/testing/renderWithApp';
import { useCalculatorStore } from '@stores/useCalculatorStore';
import type { Operation } from '@presentation/hooks/useAccountOperations';

const CURRENT = 2;

// Libellés et montants inventés : une donnée bancaire recopiée dans un test
// sort du poste aussi sûrement qu'un dump (REGLES/lois.md, loi 7). Ce que ces
// fixtures doivent porter, c'est la forme — un crédit, un débit, un libellé
// trop long pour la largeur du panneau.
const operation = (over: Partial<Operation> & { id: number }) =>
  ({
    account_id: CURRENT,
    account_id_dest: null,
    amount: 10,
    vat_rate: 20,
    date: String(Date.parse('2026-08-07T12:00:00Z')),
    status_id: 1,
    type_id: 2,
    description: `Opération ${over.id}`,
    category: null,
    third: null,
    account: { id: CURRENT, label: 'Compte A' },
    account_dest: null,
    linked_count: 0,
    linked_by_count: 0,
    ...over,
  }) as unknown as Operation;

const pristine = useCalculatorStore.getState();
afterEach(() => useCalculatorStore.setState(pristine, true));

const setup = (operations: Operation[]) => {
  useCalculatorStore.setState({ open: true, operations });
  return renderWithApp(
    <MemoryRouter initialEntries={[`/operations?account_id=${CURRENT}`]}>
      <FloatingCalculator />
    </MemoryRouter>,
  );
};

/**
 * Le panneau n'a longtemps affiché qu'une colonne de montants : on additionnait
 * des nombres sans pouvoir vérifier qu'ils correspondaient aux lignes cliquées.
 * C'est le libellé qui rend la somme vérifiable, d'où ce test.
 *
 * jsdom ne calcule aucune géométrie : il prouve que le libellé est **rendu**,
 * jamais qu'il est lisible ni que le panneau tient dans la fenêtre. Ces deux
 * points-là se contrôlent au navigateur.
 */
describe('FloatingCalculator', () => {
  it('affiche le libellé de chaque opération à côté de son montant', () => {
    setup([
      operation({ id: 1, description: 'Abonnement', amount: 12.5 }),
      operation({
        id: 2,
        description: 'Remboursement',
        type_id: 1,
        amount: 40,
      }),
    ]);

    expect(screen.getByText('Abonnement')).toBeInTheDocument();
    expect(screen.getByText('Remboursement')).toBeInTheDocument();
  });

  it('garde le libellé entier accessible quand il est tronqué à l’écran', () => {
    const description = 'Un libellé bien plus long que la largeur du panneau';
    setup([operation({ id: 1, description })]);

    // La troncature est purement visuelle (`text-overflow: ellipsis`) : le
    // texte complet doit rester atteignable, sinon la ligne redevient
    // indéchiffrable dès qu'elle dépasse.
    expect(screen.getByText(description)).toHaveAttribute('title', description);
  });

  it('additionne les montants en respectant leur sens', () => {
    setup([
      operation({ id: 1, type_id: 2, amount: 30 }), // débit
      operation({ id: 2, type_id: 1, amount: 12.5 }), // crédit
    ]);

    expect(screen.getByText('-17,50 €')).toBeInTheDocument();
  });

  it('ne rend rien tant que le panneau est fermé', () => {
    useCalculatorStore.setState({
      open: false,
      operations: [operation({ id: 1, description: 'Abonnement' })],
    });
    renderWithApp(
      <MemoryRouter>
        <FloatingCalculator />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Abonnement')).not.toBeInTheDocument();
  });
});
