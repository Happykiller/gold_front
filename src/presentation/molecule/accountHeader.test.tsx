import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';

import { AccountHeader } from './accountHeader';
import { renderWithApp } from '@src/testing/renderWithApp';
import type { Account } from '@presentation/hooks/useAccountOperations';

const account = (reconcilied: number | null, notReconcilied: number | null) =>
  ({
    id: 1,
    label: 'Courant',
    balance_reconcilied: reconcilied,
    balance_not_reconcilied: notReconcilied,
  }) as unknown as Account;

const setup = (acc: Account | null = account(1141.48, 451.06)) =>
  renderWithApp(
    <AccountHeader
      account={acc}
      loading={false}
      error={null}
      onRefresh={vi.fn()}
    />,
  );

describe('AccountHeader', () => {
  it('affiche le solde pointé tel que le serveur le renvoie', () => {
    setup();

    expect(screen.getByText('1 141,48 €')).toBeInTheDocument();
  });

  it('affiche le solde total projeté', () => {
    // `balance_not_reconcilied` porte mal son nom : la fonction SQL l'agrège
    // sur les statuts 1 **et** 2. C'est le total, et c'est bien ce qu'on veut
    // lire ici.
    setup();

    expect(screen.getByText('451,06 €')).toBeInTheDocument();
  });

  it('signale un solde négatif sans recourir à l’or', () => {
    // L'or est réservé à l'action et à l'état « en attente ». Un solde négatif
    // se lit quand même d'un coup d'œil.
    setup(account(-12.5, -30));

    expect(screen.getByText('-12,50 €')).toHaveStyle({ color: '#F2635B' });
  });

  it('ne rend plus aucune phrase anglaise de solde', () => {
    // Formulé en négatif : c'est la seule façon d'attraper le retour de
    // « Balance reconciled: », qu'aucune assertion positive ne verrait.
    setup();

    expect(screen.queryByText(/balance/i)).not.toBeInTheDocument();
  });

  it('tire ses libellés de l’i18n et non de chaînes en dur', () => {
    setup();

    // Les valeurs viennent de fr/translation.json, chargé par renderWithApp.
    expect(screen.getByText('pointé')).toBeInTheDocument();
    expect(screen.getByText('total')).toBeInTheDocument();
  });

  it('lit deux soldes absents comme des zéros', () => {
    setup(account(null, null));

    expect(screen.getAllByText('0,00 €')).toHaveLength(2);
  });
});
