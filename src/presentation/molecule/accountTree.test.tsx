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

  it('creuse un niveau de retrait par étage, au-delà du premier', () => {
    // La régression exacte : le retrait s'écrivait `depth ? '10px' : 0`, un
    // test booléen. Le niveau 2 recevait donc le même retrait que le niveau 1
    // et l'arbre s'aplatissait dès le deuxième étage.
    setup([
      account({
        id: 1,
        label: 'Racine',
        children: [
          account({
            id: 2,
            label: 'Branche',
            children: [account({ id: 3, label: 'Feuille' })],
          }),
        ],
      }),
    ]);

    const rowOf = (name: string) =>
      screen.getByRole('button', { name }).closest('[data-depth]')!;

    expect(rowOf('Racine')).toHaveAttribute('data-depth', '0');
    expect(rowOf('Branche')).toHaveAttribute('data-depth', '1');
    expect(rowOf('Feuille')).toHaveAttribute('data-depth', '2');

    // Et le retrait vient de l'imbrication, pas d'un calcul : chaque étage
    // ajoute un conteneur de branche entre la ligne et la racine. C'est ce qui
    // le rend cumulatif par construction.
    const branchesAbove = (name: string) => {
      let node = rowOf(name).parentElement;
      let levels = 0;
      while (node) {
        if (node.hasAttribute('data-branch')) levels += 1;
        node = node.parentElement;
      }
      return levels;
    };
    expect(branchesAbove('Racine')).toBe(0);
    expect(branchesAbove('Branche')).toBe(1);
    expect(branchesAbove('Feuille')).toBe(2);
  });

  it('nomme le bouton d’édition avec le compte visé', () => {
    // Sans le libellé, l'arbre présente autant de boutons « Éditer » que de
    // comptes, indiscernables au clavier comme au lecteur d'écran.
    setup([account({ id: 1, label: 'Courant' })]);

    expect(
      screen.getByRole('button', { name: /Éditer le compte : Courant/ }),
    ).toBeInTheDocument();
  });

  it('met le solde pointé en avant, le projeté en retrait', async () => {
    // La hiérarchie, pas seulement la présence des deux nombres : c'est
    // exactement ce qui avait été inversé. Le pointé est l'argent validé par
    // la banque — celui sur lequel on décide — et il vient en premier.
    setup([
      account({
        id: 1,
        balance_reconcilied: 900,
        balance_not_reconcilied: 1200.5,
      }),
    ]);

    const reconciled = screen.getByText('900,00 €');
    const total = screen.getByText('1 200,50 €');

    expect(
      reconciled.compareDocumentPosition(total) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // Et le projeté est le discret des deux.
    expect(total).toHaveStyle({ color: 'rgb(109, 116, 144)' });
    expect(reconciled).not.toHaveStyle({ color: 'rgb(109, 116, 144)' });
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
