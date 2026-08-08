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

  it('affiche en attente la différence entre le total projeté et le pointé', () => {
    // `balance_not_reconcilied` est le solde **total** (statuts 1 et 2), pas la
    // somme des non-pointées : l'afficher tel quel — ce que faisait l'ancien
    // en-tête sous le libellé « Balance not reconciled » — donne un chiffre qui
    // ne veut rien dire à cette place.
    setup();

    expect(screen.getByText('-690,42 €')).toBeInTheDocument();
    expect(screen.queryByText('451,06 €')).not.toBeInTheDocument();
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
    expect(screen.getByText('en attente')).toBeInTheDocument();
  });

  it('lit deux soldes absents comme des zéros', () => {
    setup(account(null, null));

    expect(screen.getAllByText('0,00 €')).toHaveLength(2);
  });
});
