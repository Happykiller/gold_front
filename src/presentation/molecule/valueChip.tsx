// src\presentation\molecule\valueChip.tsx
import * as React from 'react';
import { Box, Typography } from '@mui/material';

import {
  formatEuroAmount,
  getBalanceColor,
} from '@presentation/molecule/operationDisplay';
import { MONO_FONT, SURFACE, TEXT } from '@src/theme/tokens';

type Props = {
  /** Le montant, ou une valeur déjà mise en forme. */
  value: number | string;
  label: React.ReactNode;
  /** Colore un montant négatif. Sans objet pour un compteur. */
  signed?: boolean;
};

/**
 * Un chiffre qualifié : le montant d'abord, son libellé en petit ensuite.
 *
 * L'ordre n'est pas cosmétique — on lit un nombre, pas une phrase. C'est ce
 * qui remplace les « Balance reconciled: 1 141,48 € » de l'ancien en-tête.
 */
export const ValueChip: React.FC<Props> = ({ value, label, signed = true }) => {
  const numeric = typeof value === 'number';

  return (
    <Box
      sx={(theme) => ({
        display: 'flex',
        alignItems: 'baseline',
        gap: '7px',
        padding: '3px 9px',
        borderRadius: `${theme.radius.sm}px`,
        background: SURFACE.chip,
        whiteSpace: 'nowrap',
      })}
    >
      <Typography
        component="span"
        sx={{
          fontFamily: MONO_FONT,
          fontWeight: 500,
          fontSize: 13,
          lineHeight: 1,
          // Toute couleur passe par `sx` : la prop `color` de MUI n'accepte
          // que des clés de palette et n'applique rien, en silence, sur un
          // hexadécimal.
          //
          // Un solde négatif se signale ; l'or reste réservé à l'action et à
          // l'état « en attente », il n'a rien à faire sur un solde.
          color: signed && numeric ? getBalanceColor(value) : TEXT.title,
        }}
      >
        {numeric ? formatEuroAmount(value) : value}
      </Typography>
      <Typography
        component="span"
        sx={{ fontSize: 10.5, lineHeight: 1, color: TEXT.meta }}
      >
        {label}
      </Typography>
    </Box>
  );
};
