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
 * Contrairement aux types, statuts et tiers, les catégories sont **saisies par
 * l'utilisateur** : leurs libellés s'affichent tels quels. Le `Trans` posé sur
 * elles par l'ancienne version ne servait à rien — une chaîne sans clé
 * correspondante est rendue telle quelle.
 */
export const OpeCategoriesSelect: React.FC<OpeCategoriesSelectProps> = (
  props,
) => (
  <RefSelect
    {...props}
    load={() => inversify.getOpeCategoriesUsecase.execute()}
    sx={{ m: 1 }}
  />
);
