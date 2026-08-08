// src\presentation\molecule\formLayout.tsx
import * as React from 'react';
import { Trans } from 'react-i18next';
import { Box, Button, Typography } from '@mui/material';

import { LINE, TEXT } from '@src/theme/tokens';

/**
 * Une grille de champs.
 *
 * Les six écrans de saisie posaient chacun leur `Grid container spacing={2}`
 * et distribuaient des `size` à la main, sans jamais tomber sur le même
 * rythme. Ici la colonne est l'unité : un champ occupe une ou deux colonnes,
 * et la grille se replie seule sur les petits écrans.
 */
export const FormSection: React.FC<{
  /** Intertitre, pour un formulaire qui se lit en deux temps. */
  title?: React.ReactNode;
  columns?: 1 | 2 | 3;
  children: React.ReactNode;
}> = ({ title, columns = 2, children }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
    {title && (
      <Typography
        component="h2"
        sx={{
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: TEXT.meta,
          pt: '6px',
        }}
      >
        {title}
      </Typography>
    )}
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: `repeat(${columns}, minmax(0, 1fr))`,
        },
        columnGap: '18px',
        rowGap: '6px',
        alignItems: 'end',
      }}
    >
      {children}
    </Box>
  </Box>
);

/** Un champ qui prend toute la largeur de sa grille. */
export const FormRow: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <Box sx={{ gridColumn: '1 / -1' }}>{children}</Box>;

/**
 * Le pied d'un formulaire.
 *
 * L'état désactivé arrive en propriété, alors que les six écrans l'écrivaient
 * en ligne — jusqu'à cinq clauses accolées dans le JSX, illisibles et
 * impossibles à tester séparément.
 */
export const SubmitBar: React.FC<{
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  /** Une action secondaire — annuler, revenir. */
  secondary?: React.ReactNode;
  /** Message d'échec, rendu au-dessus des boutons. */
  error?: string | null;
  /** Espace de nommage des messages d'erreur venus du serveur. */
  errorNamespace?: string;
}> = ({
  label,
  icon,
  disabled = false,
  secondary,
  error,
  errorNamespace = 'common',
}) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      mt: '18px',
      pt: '16px',
      borderTop: LINE.block,
    }}
  >
    {error && (
      <Typography sx={{ color: 'error.main', fontSize: 13 }}>
        <Trans>
          {errorNamespace}.{error}
        </Trans>
      </Typography>
    )}
    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
      {secondary}
      <Button
        type="submit"
        variant="contained"
        size="small"
        disabled={disabled}
        startIcon={icon}
      >
        {label}
      </Button>
    </Box>
  </Box>
);
