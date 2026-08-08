// src\presentation\molecule\thirdsSelect.tsx
import * as React from 'react';

import inversify from '@src/common/inversify';
import { RefSelect } from '@presentation/molecule/refSelect';

type ThirdsSelectProps = {
  value: string | number;
  label: React.ReactNode;
  onChange: (value: string) => void;
};

/**
 * Sélecteur de tiers.
 *
 * Référentiel fermé : ses libellés arrivent de la base sous forme de clés
 * (`operation.third-otherCredit`), traduites côté front.
 */
export const ThirdsSelect: React.FC<ThirdsSelectProps> = (props) => (
  <RefSelect
    {...props}
    load={() => inversify.getThirdsUsecase.execute()}
    translateLabels
    sx={{ m: 1 }}
  />
);
