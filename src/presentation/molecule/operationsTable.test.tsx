import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// La table atteint le singleton d'injection par la chaîne
// `useCalculatorStore` → `useAccountOperations`, et celui-ci charge le bundle
// CommonJS de `sunny-ui`, que Vitest ne sait pas exécuter en module ES. Le
// doubler suffit : rien de ce qui est testé ici n'appelle l'API.
vi.mock('@src/common/inversify', () => ({ default: {} }));

import { OperationsTable } from './operationsTable';
import { renderWithApp } from '@src/testing/renderWithApp';
import { useCalculatorStore } from '@stores/useCalculatorStore';
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

// Le store de la calculatrice est un singleton : sans remise à zéro, un test
// qui l'ouvre laisserait les suivants en mode « alimenter la calculatrice ».
const pristineCalculator = useCalculatorStore.getState();
afterEach(() => useCalculatorStore.setState(pristineCalculator, true));

const setup = (operations: Operation[]) => {
  const handlers = {
    onEditOperation: vi.fn(),
    onDeleteOperation: vi.fn(),
    onRecoOperation: vi.fn(),
    onOpenAccount: vi.fn(),
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

  it('ouvre l’autre compte d’un virement émis au clic sur sa destination', () => {
    const { onOpenAccount } = setup([
      operation({
        id: 1,
        type_id: 3,
        account_id_dest: 9,
        account_dest: { id: 9, label: 'Épargne' },
      } as Partial<Operation> & { id: number }),
    ]);

    screen.getByRole('button', { name: 'Épargne' }).click();

    expect(onOpenAccount).toHaveBeenCalledWith(9);
  });

  it('ouvre le compte émetteur quand le virement est reçu', () => {
    // Un virement est une écriture unique portant deux comptes : vu d'ici,
    // l'autre bout est la source, pas la destination.
    const { onOpenAccount } = setup([
      operation({
        id: 1,
        type_id: 3,
        account_id: 7,
        account_id_dest: CURRENT,
        account: { id: 7, label: 'Livret' },
      } as Partial<Operation> & { id: number }),
    ]);

    screen.getByRole('button', { name: 'Livret' }).click();

    expect(onOpenAccount).toHaveBeenCalledWith(7);
  });

  it('n’envoie pas la ligne à la calculatrice au clic sur la destination', async () => {
    // Le clic est arrêté net. Sans cela, calculatrice ouverte, visiter le
    // compte de destination y empilerait aussi l'opération au passage.
    const add = vi.fn();
    useCalculatorStore.setState({ open: true, add });
    setup([
      operation({
        id: 1,
        type_id: 3,
        account_id_dest: 9,
        account_dest: { id: 9, label: 'Épargne' },
      } as Partial<Operation> & { id: number }),
    ]);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Épargne' }));
    expect(add).not.toHaveBeenCalled();

    // Mais le clic sur la ligne elle-même, lui, alimente bien la calculatrice.
    await user.click(screen.getByText('Opération 1'));
    expect(add).toHaveBeenCalledTimes(1);
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

  it('ne double pas le glyphe par un bouton d’action « Pointer »', () => {
    // Le glyphe de la colonne Statut porte déjà l'action, et le raccourci est
    // rappelé par la légende : un second chemin recréerait le doublon que
    // cette colonne avait justement supprimé.
    setup([operation({ id: 1, status_id: 1 })]);

    expect(
      screen.queryByRole('button', { name: 'Pointer' }),
    ).not.toBeInTheDocument();
  });

  it('explique ses boutons d’action au survol', async () => {
    // Deux icônes nues ne disent pas ce qu'elles font. On vérifie l'infobulle
    // qui s'ouvre, pas seulement le nom accessible : celui-ci resterait
    // satisfait par un `aria-label` sans qu'aucune bulle n'apparaisse.
    setup([operation({ id: 1 })]);
    const user = userEvent.setup();

    await user.hover(screen.getByRole('button', { name: 'Supprimer' }));

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Supprimer');
  });

  it('affiche la légende des deux états et le rappel du raccourci', () => {
    setup([operation({ id: 1 })]);

    expect(
      screen.getByText('pointé — présent sur le relevé'),
    ).toBeInTheDocument();
    expect(screen.getByText(/␣ sur la ligne sélectionnée/)).toBeInTheDocument();
  });
});

const rows = () => screen.getAllByRole('row');

describe('OperationsTable — sélection et clavier', () => {
  it('n’expose qu’une seule ligne à la tabulation', () => {
    // Sans tabindex mouvant, une liste de 300 lignes poserait 300 arrêts entre
    // la barre de recherche et le pied de page.
    setup([operation({ id: 1 }), operation({ id: 2 }), operation({ id: 3 })]);

    const focusable = rows().filter((row) => row.tabIndex === 0);

    expect(focusable).toHaveLength(1);
    expect(focusable[0]).toHaveAttribute('data-op-id', '1');
  });

  it('pointe la ligne sélectionnée avec ␣', async () => {
    const { onRecoOperation } = setup([
      operation({ id: 1, status_id: 1 }),
      operation({ id: 2, status_id: 1 }),
    ]);
    const user = userEvent.setup();

    rows()[0].focus();
    await user.keyboard(' ');

    expect(onRecoOperation).toHaveBeenCalledTimes(1);
    expect(onRecoOperation.mock.calls[0][0].id).toBe(1);
  });

  it('ne fait rien quand ␣ vise une ligne déjà pointée', async () => {
    const { onRecoOperation } = setup([operation({ id: 1, status_id: 2 })]);
    const user = userEvent.setup();

    rows()[0].focus();
    await user.keyboard(' ');

    expect(onRecoOperation).not.toHaveBeenCalled();
  });

  it('empêche la page de défiler quand ␣ pointe', () => {
    setup([operation({ id: 1, status_id: 1 })]);

    const event = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true,
      cancelable: true,
    });
    rows()[0].dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it('déplace la sélection et le focus avec les flèches', async () => {
    setup([operation({ id: 1 }), operation({ id: 2 }), operation({ id: 3 })]);
    const user = userEvent.setup();

    rows()[0].focus();
    await user.keyboard('{ArrowDown}');

    expect(rows()[1]).toHaveFocus();
    expect(rows()[1]).toHaveAttribute('aria-selected', 'true');
    expect(rows()[0]).toHaveAttribute('aria-selected', 'false');
  });

  it('édite la ligne sélectionnée avec E', async () => {
    const { onEditOperation } = setup([
      operation({ id: 1 }),
      operation({ id: 2 }),
    ]);
    const user = userEvent.setup();

    rows()[1].focus();
    await user.keyboard('E');

    expect(onEditOperation).toHaveBeenCalledTimes(1);
    expect(onEditOperation.mock.calls[0][0].id).toBe(2);
  });
});
