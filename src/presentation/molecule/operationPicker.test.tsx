import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@src/common/inversify', () => ({ default: {} }));

import { OperationPicker } from './operationPicker';
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
    ...over,
  }) as unknown as Operation;

const setup = (operations: Operation[]) => {
  const onPick = vi.fn();
  renderWithApp(
    <OperationPicker
      label="Opérations"
      operations={operations}
      currentAccountId={CURRENT}
      onPick={onPick}
    />,
  );
  return { onPick, user: userEvent.setup() };
};

const field = () => screen.getByRole('combobox');

describe('OperationPicker', () => {
  it('montre la date, la description et le montant de chaque opération', async () => {
    // La version précédente concaténait « montant — description » dans une
    // chaîne unique, sans date et sans hiérarchie.
    const { user } = setup([
      operation({ id: 1, description: 'OVHcloud', amount: 71.75 }),
    ]);

    await user.click(field());
    const option = await screen.findByRole('option');

    expect(within(option).getByText('07/08')).toBeInTheDocument();
    expect(within(option).getByText('OVHcloud')).toBeInTheDocument();
    expect(within(option).getByText('-71,75 €')).toBeInTheDocument();
  });

  it('filtre sur la description', async () => {
    const { user } = setup([
      operation({ id: 1, description: 'OVHcloud' }),
      operation({ id: 2, description: 'Netflix' }),
    ]);

    await user.click(field());
    await user.type(field(), 'net');

    const list = await screen.findByRole('listbox');
    expect(within(list).getByText('Netflix')).toBeInTheDocument();
    expect(within(list).queryByText('OVHcloud')).not.toBeInTheDocument();
  });

  it('filtre aussi sur le montant', async () => {
    // On retrouve plus vite une ligne par « 71,75 » que par son intitulé de
    // relevé bancaire.
    const { user } = setup([
      operation({ id: 1, description: 'OVHcloud', amount: 71.75 }),
      operation({ id: 2, description: 'Netflix', amount: 21.99 }),
    ]);

    await user.click(field());
    await user.type(field(), '71,75');

    const list = await screen.findByRole('listbox');
    expect(within(list).getByText('OVHcloud')).toBeInTheDocument();
    expect(within(list).queryByText('Netflix')).not.toBeInTheDocument();
  });

  it('nomme une opération sans description plutôt que de rendre un vide', async () => {
    const { user } = setup([operation({ id: 1, description: '' })]);

    await user.click(field());

    expect(await screen.findByText('Sans description')).toBeInTheDocument();
  });

  it('rend l’opération choisie et se libère pour la suivante', async () => {
    const { user, onPick } = setup([
      operation({ id: 1, description: 'OVHcloud' }),
      operation({ id: 2, description: 'Netflix' }),
    ]);

    await user.click(field());
    await user.click(await screen.findByText('Netflix'));

    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick.mock.calls[0][0].id).toBe(2);
    // Le champ ne retient pas son choix : on en empile plusieurs à la suite.
    expect(field()).toHaveValue('');
  });

  it('reste inactif quand il n’y a rien à lier', () => {
    setup([]);

    expect(field()).toBeDisabled();
  });
});
