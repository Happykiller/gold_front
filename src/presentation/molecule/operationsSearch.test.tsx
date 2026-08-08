import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { OperationsSearch } from './operationsSearch';
import { renderWithApp } from '@src/testing/renderWithApp';
import type { Referentials, Token } from '@presentation/hooks/searchTokens';

/**
 * Le seul test de composant du projet, et il a sa raison d'être : les
 * suggestions ont disparu une fois parce que le `ClickAwayListener` fermait la
 * liste au moment même où le clic la faisait ouvrir. Ni `tsc`, ni le lint, ni
 * les 62 tests du parseur ne pouvaient le voir — seul un rendu réel le montre.
 */
const refs: Referentials = {
  categories: [{ id: 2, label: 'Alimentation' }],
  thirds: [{ id: 3, label: 'Restauration' }],
  accounts: [{ id: 4, label: 'Vacances' }],
  types: [],
  status: [
    { id: 1, label: 'operation.status-follow' },
    { id: 2, label: 'operation.status-reconciled' },
  ],
};

const translate = (label: string) =>
  ({
    'operation.status-follow': 'En attente',
    'operation.status-reconciled': 'Pointée',
  })[label] ?? label;

const setup = (tokens: Token[] = []) => {
  const onChange = vi.fn();
  renderWithApp(
    <OperationsSearch
      tokens={tokens}
      onChange={onChange}
      refs={refs}
      translate={translate}
    />,
  );
  return { onChange, user: userEvent.setup() };
};

const field = () => screen.getByRole('textbox');

describe('OperationsSearch', () => {
  it('présente les critères disponibles au clic dans le champ', async () => {
    const { user } = setup();

    await user.click(field());

    expect(await screen.findByText('statut:')).toBeInTheDocument();
    expect(screen.getByText('montant:')).toBeInTheDocument();
  });

  it('garde les suggestions ouvertes pendant la frappe', async () => {
    // La régression exacte : le clic ouvrait puis refermait aussitôt.
    const { user } = setup();

    await user.click(field());
    await user.type(field(), 'sta');

    expect(await screen.findByText('statut:')).toBeInTheDocument();
  });

  it('complète la saisie sans valider quand on choisit un critère', async () => {
    const { user, onChange } = setup();

    await user.click(field());
    await user.type(field(), 'sta');
    await user.click(await screen.findByText('statut:'));

    expect(field()).toHaveValue('statut:');
    // Un préfixe n'est pas un critère : rien ne doit être ajouté.
    expect(onChange).not.toHaveBeenCalled();
    // Et la liste enchaîne sur les valeurs de ce critère.
    expect(await screen.findByText('statut: En attente')).toBeInTheDocument();
  });

  it('valide un critère par Entrée', async () => {
    const { user, onChange } = setup();

    await user.click(field());
    await user.type(field(), 'cat:ali{Enter}');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toEqual([
      { kind: 'ref', field: 'cat', id: 2, label: 'Alimentation' },
    ]);
    expect(field()).toHaveValue('');
  });

  it('retire la dernière puce au retour arrière sur un champ vide', async () => {
    const tokens: Token[] = [
      { kind: 'ref', field: 'cat', id: 2, label: 'Alimentation' },
      { kind: 'text', field: 'any', value: 'fai' },
    ];
    const { user, onChange } = setup(tokens);

    await user.click(field());
    await user.keyboard('{Backspace}');

    expect(onChange).toHaveBeenCalledWith([tokens[0]]);
  });

  it('affiche une puce par critère, chacune supprimable', async () => {
    const tokens: Token[] = [
      { kind: 'ref', field: 'cat', id: 2, label: 'Alimentation' },
      { kind: 'range', field: 'montant', op: '>', from: '50' },
    ];
    const { user, onChange } = setup(tokens);

    expect(screen.getByText('cat: Alimentation')).toBeInTheDocument();
    expect(screen.getByText('montant > 50 €')).toBeInTheDocument();

    await user.click(screen.getAllByTestId('CancelIcon')[1]);
    expect(onChange).toHaveBeenCalledWith([tokens[0]]);
  });

  it('donne le focus au champ quand on tape « / » ailleurs dans la page', async () => {
    const { user } = setup();

    document.body.focus();
    await user.keyboard('/');

    expect(field()).toHaveFocus();
  });

  it('laisse écrire « / » dans le champ lui-même', async () => {
    // Sans la garde sur la cible, le raccourci intercepterait la frappe et le
    // caractère ne s'écrirait jamais — dans ce champ comme dans tous les
    // autres de l'application.
    const { user } = setup();

    await user.click(field());
    await user.keyboard('desc:a/b');

    expect(field()).toHaveValue('desc:a/b');
  });
});
