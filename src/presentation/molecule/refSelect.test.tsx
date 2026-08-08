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

const field = () => screen.getByRole('combobox');

/** Attend le référentiel, puis déroule la liste. */
const open = async (user: ReturnType<typeof userEvent.setup>) => {
  await waitFor(() => expect(field()).toBeEnabled());
  await user.click(field());
};

describe('RefSelect', () => {
  it('propose les entrées du référentiel une fois chargées', async () => {
    const { user } = setup();

    await open(user);

    expect(await screen.findByText('Courant')).toBeInTheDocument();
    expect(screen.getByText('Épargne')).toBeInTheDocument();
  });

  it('reste inactif tant que le référentiel n’est pas arrivé', () => {
    // Les trois copies remplaçaient le champ par un texte « Chargement… » :
    // le formulaire se réorganisait sous le curseur à chaque chargement.
    setup({ load: () => new Promise(() => {}) });

    expect(field()).toBeDisabled();
  });

  it('filtre la liste à la frappe', async () => {
    // C'est tout l'intérêt de la saisie semi-automatique : certains
    // référentiels dépassent la vingtaine d'entrées.
    const { user } = setup();
    await open(user);

    await user.type(field(), 'épa');

    const list = await screen.findByRole('listbox');
    expect(within(list).getByText('Épargne')).toBeInTheDocument();
    expect(within(list).queryByText('Courant')).not.toBeInTheDocument();
  });

  it('rend l’identifiant choisi, pas l’événement', async () => {
    const { user, onChange } = setup();
    await open(user);

    await user.click(await screen.findByText('Épargne'));

    expect(onChange).toHaveBeenCalledWith('2');
  });

  it('permet de vider le champ, et rend la sentinelle de vide', async () => {
    const { user, onChange } = setup({ value: 1, emptyValue: 0 });
    await waitFor(() => expect(field()).toBeEnabled());

    await user.click(screen.getByTitle('Clear'));

    expect(onChange).toHaveBeenCalledWith('0');
  });

  it('interdit de vider un critère obligatoire', async () => {
    const { user } = setup({ value: 1, required: true });
    await waitFor(() => expect(field()).toBeEnabled());
    await user.hover(field());

    expect(screen.queryByTitle('Clear')).not.toBeInTheDocument();
  });

  it('restreint la liste au filtre reçu', async () => {
    const { user } = setup({ filter: (item) => item.id === 2 });
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
