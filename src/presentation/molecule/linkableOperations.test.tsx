import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';

import { CODES } from '@src/common/codes';

const execute = vi.fn();
vi.mock('@src/common/inversify', () => ({
  default: {
    getOperationsUsecase: {
      execute: (dto: unknown) => execute(dto),
    },
    loggerService: { debug: vi.fn() },
  },
}));

import { LinkableOperations } from './linkableOperations';
import { renderWithApp } from '@src/testing/renderWithApp';
import {
  STATUS_RECONCILED,
  TYPE_DEBIT,
} from '@presentation/hooks/referentialIds';
import type { Operation } from '@presentation/hooks/useAccountOperations';

const DEST = 7;

// Libellés et montants inventés — une donnée bancaire recopiée dans un test
// sort du poste aussi sûrement qu'un dump (REGLES/lois.md, loi 7).
const operation = (over: Partial<Operation> & { id: number }) =>
  ({
    account_id: DEST,
    account_id_dest: null,
    amount: 10,
    vat_rate: 20,
    date: String(Date.parse('2026-08-07T12:00:00Z')),
    status_id: 1,
    type_id: TYPE_DEBIT,
    description: `Dépense ${over.id}`,
    category: null,
    third: null,
    ...over,
  }) as unknown as Operation;

const setup = (operations: Operation[], excludeIds: number[] = []) => {
  execute.mockResolvedValue({ message: CODES.SUCCESS, data: operations });
  const onPick = vi.fn();
  renderWithApp(
    <LinkableOperations
      label="Rattacher"
      accountId={DEST}
      excludeIds={excludeIds}
      onPick={onPick}
    />,
  );
  return { onPick, user: userEvent.setup() };
};

const lastDto = () => execute.mock.calls.at(-1)?.[0];

beforeEach(() => execute.mockReset());

/**
 * Le filtre par défaut est un choix de produit, pas un détail : ne proposer que
 * des débits **pointés** couvre le cas courant, mais interdisait de rattacher
 * une dépense encore en attente. La case le lève — sans toucher au type, qui
 * lui reste structurant : un virement couvre des dépenses.
 */
describe('LinkableOperations', () => {
  it('ne demande que des débits pointés par défaut', async () => {
    setup([operation({ id: 1 })]);

    await waitFor(() => expect(execute).toHaveBeenCalled());
    expect(lastDto()).toMatchObject({
      account_id: DEST,
      type_ids: [TYPE_DEBIT],
      status_ids: [STATUS_RECONCILED],
    });
  });

  it('lève la contrainte de pointage quand la case est cochée, sans toucher au type', async () => {
    const { user } = setup([operation({ id: 1 })]);
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(1));

    await user.click(screen.getByRole('checkbox'));

    await waitFor(() => expect(execute).toHaveBeenCalledTimes(2));
    // `status_ids` est ABSENT plutôt que vide. Le serveur ignore aussi une
    // liste vide, donc les deux marcheraient — mais l'une dépend d'une garde
    // d'en face (`inList`), l'autre de rien. On épingle la seconde.
    expect(lastDto()).not.toHaveProperty('status_ids');
    expect(lastDto()).toMatchObject({ type_ids: [TYPE_DEBIT] });
  });

  it('ne propose pas ce qui est déjà rattaché', async () => {
    const { user } = setup(
      [
        operation({ id: 1, description: 'Déjà liée' }),
        operation({ id: 2, description: 'Disponible' }),
      ],
      [1],
    );

    await waitFor(() => expect(execute).toHaveBeenCalled());
    await user.click(screen.getByRole('combobox'));

    const options = await screen.findAllByRole('option');
    expect(options).toHaveLength(1);
    expect(within(options[0]).getByText('Disponible')).toBeInTheDocument();
  });

  it('ne demande rien tant qu’aucun compte de destination n’est connu', () => {
    renderWithApp(
      <LinkableOperations
        label="Rattacher"
        accountId={null}
        excludeIds={[]}
        onPick={vi.fn()}
      />,
    );

    expect(execute).not.toHaveBeenCalled();
  });
});
