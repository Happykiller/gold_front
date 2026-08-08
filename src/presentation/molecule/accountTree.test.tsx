import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom',
    );
  return { ...actual, useNavigate: () => mocks.navigate };
});

import { AccountTree } from './accountTree';
import { renderWithApp } from '@src/testing/renderWithApp';
import type { FormattedAccount } from '@presentation/hooks/accounts';

const account = (over: Partial<FormattedAccount> & { id: number }) =>
  ({
    label: `Compte ${over.id}`,
    type_id: 1,
    parent_account_id: null,
    children: [],
    balance_reconcilied: 0,
    balance_not_reconcilied: 0,
    balance_reconcilied_aggregate: 0,
    balance_not_reconcilied_aggregate: 0,
    ...over,
  }) as unknown as FormattedAccount;

const setup = (accounts: FormattedAccount[]) =>
  renderWithApp(
    <MemoryRouter>
      <AccountTree accounts={accounts} />
    </MemoryRouter>,
  );

describe('AccountTree', () => {
  it('montre le solde projeté et le solde pointé de chaque compte', () => {
    setup([
      account({
        id: 1,
        balance_not_reconcilied: 1200.5,
        balance_reconcilied: 900,
      }),
    ]);

    expect(screen.getByText('1 200,50 €')).toBeInTheDocument();
    expect(screen.getByText('900,00 €')).toBeInTheDocument();
  });

  it('agrège les soldes d’un compte qui porte des enfants', () => {
    // La feuille rend son propre solde, le parent celui de sa branche.
    setup([
      account({
        id: 1,
        balance_not_reconcilied: 10,
        balance_not_reconcilied_aggregate: 250,
        children: [account({ id: 2, balance_not_reconcilied: 240 })],
      }),
    ]);

    expect(screen.getByText('250,00 €')).toBeInTheDocument();
    expect(screen.queryByText('10,00 €')).not.toBeInTheDocument();
  });

  it('ouvre les opérations du compte cliqué', async () => {
    setup([account({ id: 7, label: 'Courant' })]);

    screen.getByRole('button', { name: 'Courant' }).click();

    expect(mocks.navigate).toHaveBeenCalledWith({
      pathname: '/operations',
      search: 'account_id=7',
    });
  });

  it('signale un compte modèle', () => {
    setup([account({ id: 1, type_id: 2 })]);

    expect(screen.getByText('Modèle')).toBeInTheDocument();
  });

  it('rend les enfants sous leur parent', () => {
    setup([
      account({
        id: 1,
        label: 'Parent',
        children: [account({ id: 2, label: 'Enfant' })],
      }),
    ]);

    expect(screen.getByRole('button', { name: 'Enfant' })).toBeInTheDocument();
  });

  it('nomme le bouton d’édition avec le compte visé', () => {
    // Sans le libellé, l'arbre présente autant de boutons « Éditer » que de
    // comptes, indiscernables au clavier comme au lecteur d'écran.
    setup([account({ id: 1, label: 'Courant' })]);

    expect(
      screen.getByRole('button', { name: /Éditer le compte : Courant/ }),
    ).toBeInTheDocument();
  });

  it('nomme chacun des deux soldes au survol', async () => {
    // Deux nombres nus côte à côte ne disent pas lequel est lequel. Les
    // flèches ↗ ↘ que portait l'ancienne version ne le disaient pas non plus —
    // elles répétaient le signe.
    setup([
      account({
        id: 1,
        balance_not_reconcilied: 1200.5,
        balance_reconcilied: 900,
      }),
    ]);
    const user = userEvent.setup();

    await user.hover(screen.getByText('900,00 €'));

    expect(await screen.findByRole('tooltip')).toHaveTextContent('pointé');
  });
});
