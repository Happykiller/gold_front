import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({ debug: vi.fn() }));
vi.mock('@src/common/inversify', () => ({
  default: { loggerService: { debug: mocks.debug } },
}));

import { RefSelect, type RefItem } from './refSelect';
import { CODES } from '@src/common/codes';
import { renderWithApp } from '@src/testing/renderWithApp';

const items = [
  { id: 1, label: 'Courant' },
  { id: 2, label: 'Épargne' },
];

const ok = (data: RefItem[]) =>
  Promise.resolve({ message: CODES.SUCCESS as string, data });

const setup = (props: Partial<Parameters<typeof RefSelect>[0]> = {}) => {
  const onChange = vi.fn();
  renderWithApp(
    <RefSelect
      value=""
      label="Compte"
      onChange={onChange}
      load={() => ok(items)}
      {...props}
    />,
  );
  return { onChange, user: userEvent.setup() };
};

const open = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('combobox'));

describe('RefSelect', () => {
  it('propose les entrées du référentiel une fois chargées', async () => {
    const { user } = setup();

    await waitFor(() =>
      expect(screen.getByRole('combobox')).not.toHaveAttribute(
        'aria-disabled',
        'true',
      ),
    );
    await open(user);

    expect(await screen.findByText('Courant')).toBeInTheDocument();
    expect(screen.getByText('Épargne')).toBeInTheDocument();
  });

  it('reste inactif tant que le référentiel n’est pas arrivé', () => {
    // Les trois copies remplaçaient le champ par un texte « Chargement… » :
    // le formulaire se réorganisait sous le curseur à chaque chargement.
    setup({ load: () => new Promise(() => {}) });

    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('offre un choix vide, sauf pour un critère obligatoire', async () => {
    const { user } = setup();
    await waitFor(() =>
      expect(screen.getByRole('combobox')).not.toHaveAttribute(
        'aria-disabled',
        'true',
      ),
    );
    await open(user);

    // Portée à la liste : le champ lui-même affiche déjà « Effacer », sa
    // valeur courante étant la sentinelle de vide.
    const list = await screen.findByRole('listbox');
    expect(within(list).getByText('Effacer')).toBeInTheDocument();
  });

  it('masque le choix vide quand la valeur est obligatoire', async () => {
    const { user } = setup({ required: true });
    await waitFor(() =>
      expect(screen.getByRole('combobox')).not.toHaveAttribute(
        'aria-disabled',
        'true',
      ),
    );
    await open(user);

    const list = await screen.findByRole('listbox');
    expect(within(list).getByText('Courant')).toBeInTheDocument();
    expect(within(list).queryByText('Effacer')).not.toBeInTheDocument();
  });

  it('restreint la liste au filtre reçu', async () => {
    const { user } = setup({ filter: (item) => item.id === 2 });
    await waitFor(() =>
      expect(screen.getByRole('combobox')).not.toHaveAttribute(
        'aria-disabled',
        'true',
      ),
    );
    await open(user);

    expect(await screen.findByText('Épargne')).toBeInTheDocument();
    expect(screen.queryByText('Courant')).not.toBeInTheDocument();
  });

  it('traduit les clés d’un référentiel mixte sans toucher aux libellés saisis', async () => {
    // Le cas qui a mordu : les catégories sont saisies par l'utilisateur, sauf
    // `operation.category-other` que pose le seed. Un référentiel peut donc
    // mélanger les deux, et priver la liste de traduction affiche la clé brute
    // au milieu de libellés bien rendus.
    const { user } = setup({
      translateLabels: true,
      load: () =>
        ok([
          { id: 1, label: 'Alimentation' },
          { id: 2, label: 'operation.category-other' },
        ]),
    });
    await waitFor(() =>
      expect(screen.getByRole('combobox')).not.toHaveAttribute(
        'aria-disabled',
        'true',
      ),
    );
    await open(user);
    const list = await screen.findByRole('listbox');

    expect(within(list).getByText('Autre')).toBeInTheDocument();
    expect(within(list).getByText('Alimentation')).toBeInTheDocument();
    expect(
      within(list).queryByText('operation.category-other'),
    ).not.toBeInTheDocument();
  });

  it('affiche l’erreur du usecase plutôt que de lever', async () => {
    // Un usecase ne lève jamais : il rend un message d'échec, que les
    // composants lisent sans `try/catch`.
    setup({ load: () => Promise.resolve({ message: 'FAIL' }) });

    expect(await screen.findByText('common.FAIL')).toBeInTheDocument();
  });

  it('ne relance pas le chargement quand l’appelant reconstruit sa fonction', async () => {
    // Le cas qui boucle : `load` est une lambda recréée à chaque rendu par la
    // quasi-totalité des appelants. Il faut donc **re-rendre le parent** pour
    // l'éprouver — une version qui ne le fait pas passe quoi qu'il arrive.
    const load = vi.fn(() => ok(items));
    const Parent = () => {
      const [n, setN] = React.useState(0);
      return (
        <>
          <button onClick={() => setN(n + 1)}>rendre</button>
          <span>rendus : {n}</span>
          <RefSelect
            value=""
            label="Compte"
            onChange={vi.fn()}
            load={() => load()}
          />
        </>
      );
    };
    renderWithApp(<Parent />);
    const user = userEvent.setup();

    await waitFor(() => expect(load).toHaveBeenCalled());
    await user.click(screen.getByRole('button', { name: 'rendre' }));
    await user.click(screen.getByRole('button', { name: 'rendre' }));
    await screen.findByText(/rendus : 2/);

    expect(load).toHaveBeenCalledTimes(1);
  });
});
