import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CODES } from '@src/common/codes';

const mocks = vi.hoisted(() => ({ execute: vi.fn(), debug: vi.fn() }));
vi.mock('@src/common/inversify', () => ({
  default: {
    getOpeCategoriesUsecase: { execute: mocks.execute },
    loggerService: { debug: mocks.debug },
  },
}));

import { OpeCategoriesSelect } from './opeCategoriesSelect';
import { renderWithApp } from '@src/testing/renderWithApp';

/**
 * Le référentiel des catégories est **mixte** : elles sont saisies par
 * l'utilisateur, sauf `operation.category-other` que pose le seed SQL.
 *
 * Ce test porte sur l'enveloppe, et pas seulement sur `RefSelect` : la
 * régression n'était pas dans le mécanisme de traduction — il marchait — mais
 * dans le fait que ce sélecteur-ci ne le demandait plus.
 */
describe('OpeCategoriesSelect', () => {
  it('traduit la catégorie du seed et laisse les autres intactes', async () => {
    mocks.execute.mockResolvedValue({
      message: CODES.SUCCESS,
      data: [
        { id: 1, label: 'Alimentation' },
        { id: 2, label: 'operation.category-other' },
      ],
    });
    renderWithApp(
      <OpeCategoriesSelect value="" label="Catégorie" onChange={vi.fn()} />,
    );
    const user = userEvent.setup();

    await waitFor(() =>
      expect(screen.getByRole('combobox')).not.toHaveAttribute(
        'aria-disabled',
        'true',
      ),
    );
    await user.click(screen.getByRole('combobox'));
    const list = await screen.findByRole('listbox');

    expect(within(list).getByText('Autre')).toBeInTheDocument();
    expect(within(list).getByText('Alimentation')).toBeInTheDocument();
    expect(
      within(list).queryByText('operation.category-other'),
    ).not.toBeInTheDocument();
  });

  it('montre le pictogramme de chaque catégorie', async () => {
    // Le même que dans la liste des opérations : c'est ce qui rend les deux
    // écrans lisibles ensemble.
    mocks.execute.mockResolvedValue({
      message: CODES.SUCCESS,
      data: [{ id: 1, label: 'Alimentation' }],
    });
    renderWithApp(
      <OpeCategoriesSelect value="" label="Catégorie" onChange={vi.fn()} />,
    );
    const user = userEvent.setup();

    await waitFor(() =>
      expect(screen.getByRole('combobox')).not.toHaveAttribute(
        'aria-disabled',
        'true',
      ),
    );
    await user.click(screen.getByRole('combobox'));
    const item = within(await screen.findByRole('listbox')).getByRole(
      'option',
      { name: /Alimentation/ },
    );

    expect(item.querySelector('svg')).toBeInTheDocument();
  });

  it('garde l’icône sur la ligne du libellé une fois le choix fait', async () => {
    // Le champ fermé recopie les enfants de l'entrée choisie hors du contexte
    // flex du menu. Tant que le libellé était rendu dans un bloc, il passait
    // sous l'icône. On assertt donc la cause — un conteneur commun et un
    // libellé en ligne — puisque jsdom ne calcule aucune géométrie.
    mocks.execute.mockResolvedValue({
      message: CODES.SUCCESS,
      data: [{ id: 1, label: 'Alimentation' }],
    });
    renderWithApp(
      <OpeCategoriesSelect value={1} label="Catégorie" onChange={vi.fn()} />,
    );

    const field = screen.getByRole('combobox');
    await waitFor(() =>
      expect(within(field).getByText('Alimentation')).toBeInTheDocument(),
    );
    const labelNode = within(field).getByText('Alimentation');

    // Le libellé est en ligne...
    expect(labelNode.tagName).toBe('SPAN');
    // ...et partage avec l'icône un conteneur qui les met sur une rangée.
    const row = labelNode.parentElement!;
    expect(row.querySelector('svg')).toBeInTheDocument();
    expect(row).toHaveStyle({ display: 'flex', alignItems: 'center' });
  });
});
