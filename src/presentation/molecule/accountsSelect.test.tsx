import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CODES } from '@src/common/codes';

const mocks = vi.hoisted(() => ({ execute: vi.fn(), debug: vi.fn() }));
vi.mock('@src/common/inversify', () => ({
  default: {
    getAccountsUsecase: { execute: mocks.execute },
    loggerService: { debug: mocks.debug },
  },
}));

import { AccountsSelect } from './accountsSelect';
import { renderWithApp } from '@src/testing/renderWithApp';

const accounts = [
  {
    id: 1,
    label: 'Courant',
    type_id: 1,
    balance_not_reconcilied: 1200.5,
  },
  {
    id: 2,
    label: 'Mensualités',
    type_id: 2,
    balance_not_reconcilied: -1450.53,
  },
];

const setup = (props: { type?: number } = {}) => {
  mocks.execute.mockResolvedValue({ message: CODES.SUCCESS, data: accounts });
  renderWithApp(
    <AccountsSelect value="" label="Compte" onChange={vi.fn()} {...props} />,
  );
  return userEvent.setup();
};

const field = () => screen.getByRole('combobox');

const open = async (user: ReturnType<typeof userEvent.setup>) => {
  await waitFor(() => expect(field()).toBeEnabled());
  await user.click(field());
  return screen.findByRole('listbox');
};

describe('AccountsSelect', () => {
  it('ne garde que les comptes du type demandé', async () => {
    const user = setup({ type: 2 });

    const list = await open(user);

    expect(within(list).getByText('Mensualités')).toBeInTheDocument();
    expect(within(list).queryByText('Courant')).not.toBeInTheDocument();
  });

  it('montre le solde tous statuts de chaque compte', async () => {
    // Sur un modèle, ce solde dit ce que le clonage va déverser ; sur un
    // compte réel, de quoi on dispose. Il est là partout, sans option.
    const user = setup({ type: 2 });

    const list = await open(user);

    expect(within(list).getByText('-1 450,53 €')).toBeInTheDocument();
  });

  it('laisse le champ fermé au seul libellé', async () => {
    // Le solde vit dans la liste déroulante : il ne coûte aucune largeur au
    // formulaire, qui reste lisible sur deux colonnes.
    const user = setup();
    await waitFor(() => expect(field()).toBeEnabled());
    await user.click(field());
    await user.click(await screen.findByText('Courant'));

    expect(field()).toHaveValue('Courant');
  });
});
