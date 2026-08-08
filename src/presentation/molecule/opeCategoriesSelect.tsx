// src\presentation\molecule\opeCategoriesSelect.tsx
import * as React from 'react';
import { SelectChangeEvent } from '@mui/material';

import inversify from '@src/common/inversify';
import { RefSelect } from '@presentation/molecule/refSelect';

type OpeCategoriesSelectProps = {
  value: string | number;
  label: React.ReactNode;
  onChange: (event: SelectChangeEvent) => void;
};

/**
 * Sélecteur de catégorie.
 *
 * Le référentiel est **mixte**, et c'est le piège : les catégories sont
 * saisies par l'utilisateur — « Alimentation », « Assurance » — mais le seed
 * en pose au moins une sous forme de clé i18n, `operation.category-other`.
 *
 * Les libellés passent donc par la traduction, comme pour les référentiels
 * fermés. C'est sans risque : une chaîne qui ne correspond à aucune clé est
 * rendue telle quelle, ce qui laisse les libellés saisis intacts. Les en
 * priver affichait la clé brute au milieu de la liste.
 */
export const OpeCategoriesSelect: React.FC<OpeCategoriesSelectProps> = (
  props,
) => (
  <RefSelect
    {...props}
    load={() => inversify.getOpeCategoriesUsecase.execute()}
    translateLabels
    sx={{ m: 1 }}
  />
);
