import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';

// La table atteint le singleton d'injection par la chaîne
// `useCalculatorStore` → `useAccountOperations`, et celui-ci charge le bundle
// CommonJS de `sunny-ui`, que Vitest ne sait pas exécuter en module ES. Le
// doubler suffit : rien de ce qui est testé ici n'appelle l'API.
vi.mock('@src/common/inversify', () => ({ default: {} }));

import { OperationsTable } from './operationsTable';
import { renderWithApp } from '@src/testing/renderWithApp';
import type { Operation } from '@presentation/hooks/useAccountOperations';

const CURRENT = 2;

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
    account: { id: CURRENT, label: 'Courant' },
    account_dest: null,
    ...over,
  }) as unknown as Operation;

const setup = (operations: Operation[]) => {
  const handlers = {
    onEditOperation: vi.fn(),
    onDeleteOperation: vi.fn(),
    onRecoOperation: vi.fn(),
  };
  renderWithApp(
    <OperationsTable
      current_account_id={CURRENT}
      operations={operations}
      loading={false}
      error={null}
      {...handlers}
    />,
  );
  return handlers;
};

/** Les bandeaux portent une date en majuscules, `JEU 07 AOÛT`. */
const bands = () => screen.getAllByText(/^[A-ZÀ-Ü]{2,4}\.? \d{2} [A-ZÀ-Ü]+$/);

describe('OperationsTable — bandeaux de jour', () => {
  it('rend un bandeau par journée, la date et rien d’autre', () => {
    setup([
      operation({ id: 1, date: String(Date.parse('2026-08-07T12:00:00Z')) }),
      operation({ id: 2, date: String(Date.parse('2026-08-06T12:00:00Z')) }),
    ]);

    expect(bands()).toHaveLength(2);
    // Ni compteur, ni total, ni solde : le bandeau ne porte que la date.
    expect(screen.queryByText(/2 opérations|Total/i)).not.toBeInTheDocument();
  });

  it('ne dédouble pas un jour réparti sur deux lots chargés au scroll', () => {
    // L'invariant du chargement continu, et il ne peut se vérifier qu'ici : le
    // helper est pur, c'est la table qui décide de regrouper la liste
    // accumulée plutôt que chaque lot.
    const batch1 = [
      operation({ id: 1, date: String(Date.parse('2026-08-07T14:00:00Z')) }),
      operation({ id: 2, date: String(Date.parse('2026-08-07T13:00:00Z')) }),
    ];
    const batch2 = [
      operation({ id: 3, date: String(Date.parse('2026-08-07T12:00:00Z')) }),
      operation({ id: 4, date: String(Date.parse('2026-08-06T12:00:00Z')) }),
    ];

    setup([...batch1, ...batch2]);

    expect(bands()).toHaveLength(2);
  });
});

describe('OperationsTable — colonnes', () => {
  it('garde une cellule de destination même sans destination', () => {
    // C'est ce qui tient l'alignement des montants d'une ligne à l'autre :
    // avant, la destination flottait contre le montant et le décalait dès
    // qu'une ligne n'en avait pas.
    setup([
      operation({ id: 1, type_id: 2 }),
      operation({
        id: 2,
        type_id: 3,
        account_id_dest: 9,
        account_dest: { id: 9, label: 'Épargne' },
      } as Partial<Operation> & { id: number }),
    ]);

    const rows = screen
      .getAllByText(/^Opération \d$/)
      .map((node) => node.parentElement as HTMLElement);

    // Autant d'enfants dans la ligne sans virement que dans celle qui en porte
    // un : la cellule existe, vide, et occupe sa colonne.
    expect(rows[0].children).toHaveLength(rows[1].children.length);
    expect(within(rows[1]).getByText('Épargne')).toBeInTheDocument();
    expect(within(rows[1]).getByText('→')).toBeInTheDocument();
  });

  it('traduit les en-têtes de colonnes au lieu de littéraux français en dur', () => {
    setup([operation({ id: 1 })]);

    expect(screen.getByText('Statut')).toBeInTheDocument();
    expect(screen.getByText('Destination')).toBeInTheDocument();
    // « État » a été banni de l'affichage : le domaine dit statut.
    expect(screen.queryByText('État')).not.toBeInTheDocument();
  });
});

describe('OperationsTable — pointage', () => {
  it('pointe une opération en attente au clic sur son glyphe', async () => {
    const { onRecoOperation } = setup([operation({ id: 1, status_id: 1 })]);

    screen.getByRole('button', { name: 'Pointer cette opération' }).click();

    expect(onRecoOperation).toHaveBeenCalledTimes(1);
    expect(onRecoOperation.mock.calls[0][0].id).toBe(1);
  });

  it('ne propose pas de reprendre une opération déjà pointée', () => {
    // Le serveur ne connaît pas le chemin inverse : un glyphe cliquable
    // promettrait une bascule qui échouerait. On assertt sur l'élément
    // lui-même — se contenter de chercher un bouton nommé « Pointer » ne
    // prouverait que le changement de libellé.
    const { onRecoOperation } = setup([operation({ id: 1, status_id: 2 })]);
    const glyph = screen.getByLabelText('Pointée');

    expect(glyph).not.toHaveAttribute('role', 'button');
    expect(glyph).not.toHaveAttribute('tabindex');

    glyph.click();
    expect(onRecoOperation).not.toHaveBeenCalled();
  });

  it('affiche la légende des deux états et le rappel du raccourci', () => {
    setup([operation({ id: 1 })]);

    expect(
      screen.getByText('pointé — présent sur le relevé'),
    ).toBeInTheDocument();
    expect(screen.getByText(/␣ sur la ligne sélectionnée/)).toBeInTheDocument();
  });
});
