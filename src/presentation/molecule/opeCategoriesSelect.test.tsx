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
});
