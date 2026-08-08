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

/**
 * La structure réelle en miniature : deux conteneurs racine, un compte qui
 * porte des enveloppes, des feuilles, et un modèle.
 */
const accounts = [
  { id: 10, label: 'Mes comptes', type_id: 1, parent_account_id: null },
  { id: 11, label: 'Mes templates', type_id: 1, parent_account_id: null },
  {
    id: 1,
    label: 'Courant',
    type_id: 1,
    parent_account_id: 10,
    balance_not_reconcilied: 1200.5,
  },
  {
    id: 3,
    label: 'Livret Cap Region',
    type_id: 1,
    parent_account_id: 10,
    balance_not_reconcilied: 900,
  },
  {
    id: 4,
    label: 'Alimentation',
    type_id: 1,
    parent_account_id: 3,
    balance_not_reconcilied: 570,
  },
  {
    id: 2,
    label: 'Mensualités',
    type_id: 2,
    parent_account_id: 11,
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
  it('ne propose que les comptes sur lesquels on saisit', async () => {
    // Une opération se pose sur une feuille réelle. Un modèle est un patron
    // d'échéances, et un compte qui porte des enfants ne fait qu'agréger leurs
    // soldes — ni l'un ni l'autre ne reçoit d'opération.
    const user = setup();

    const list = await open(user);

    expect(within(list).getByText('Courant')).toBeInTheDocument();
    expect(within(list).getByText('Alimentation')).toBeInTheDocument();
    expect(within(list).queryByText('Mes comptes')).not.toBeInTheDocument();
    expect(within(list).queryByText('Mes templates')).not.toBeInTheDocument();
    expect(
      within(list).queryByText('Livret Cap Region'),
    ).not.toBeInTheDocument();
    expect(within(list).queryByText('Mensualités')).not.toBeInTheDocument();
  });

  it('rend la liste des modèles au clonage, malgré la règle', async () => {
    // L'écran de clonage doit montrer exactement ce que la règle exclut
    // ailleurs : un type explicite la lève.
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
