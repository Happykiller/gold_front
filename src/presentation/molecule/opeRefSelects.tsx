// src\presentation\molecule\opeRefSelects.tsx
import * as React from 'react';
import { SelectChangeEvent } from '@mui/material';

import inversify from '@src/common/inversify';
import { RefSelect } from '@presentation/molecule/refSelect';

type Props = {
  value: string | number;
  label: React.ReactNode;
  onChange: (event: SelectChangeEvent) => void;
};

/**
 * Type et statut d'une opération.
 *
 * Ces deux sélecteurs n'existaient pas : quatre écrans écrivaient « Crédit »,
 * « Débit », « Virement », « A suivre » et « Réconcilier » directement dans un
 * `Select`, en français, quelle que soit la langue de l'interface — alors que
 * les référentiels sont exposés par l'API et que leurs libellés sont des clés
 * déjà traduites des deux côtés.
 *
 * Aucun choix vide : une opération a toujours un type et un statut.
 */

export const OpeTypesSelect: React.FC<Props> = (props) => (
  <RefSelect
    {...props}
    load={() => inversify.getOpeTypesUsecase.execute()}
    translateLabels
    required
    sx={{ m: 1 }}
  />
);

export const OpeStatusSelect: React.FC<Props> = (props) => (
  <RefSelect
    {...props}
    load={() => inversify.getOpeStatusUsecase.execute()}
    translateLabels
    required
    sx={{ m: 1 }}
  />
);
