// src\presentation\molecule\asyncState.tsx
import * as React from 'react';
import { Trans } from 'react-i18next';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';

import { TEXT } from '@src/theme/tokens';

type Props = {
  loading?: boolean;
  /** Code d'échec rendu par le usecase — jamais une exception. */
  error?: string | null;
  /**
   * Espace de nommage des messages d'erreur.
   *
   * En propriété, et non deviné : l'écran de clonage affichait ses erreurs
   * avec les clés du virement, copiées telles quelles, et personne ne l'a vu
   * parce que la clé manquante rend la clé brute.
   */
  namespace?: string;
  /** Rendu quand il n'y a rien à montrer, et que ce n'est pas une erreur. */
  empty?: React.ReactNode;
  /** Vrai quand le chargement a abouti sur du vide. */
  isEmpty?: boolean;
  children?: React.ReactNode;
};

/**
 * Chargement, échec, vide — une bonne fois.
 *
 * Cinq écrans réécrivaient ce triptyque, chacun avec sa propre surface : un
 * `Typography` centré ici, une `Alert` là, et deux formulations distinctes du
 * même message de chargement.
 */
export const AsyncState: React.FC<Props> = ({
  loading = false,
  error = null,
  namespace = 'common',
  empty,
  isEmpty = false,
  children,
}) => {
  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={26} />
      </Box>
    );

  if (error)
    return (
      <Alert severity="error">
        <Trans>
          {namespace}.{error}
        </Trans>
      </Alert>
    );

  if (isEmpty)
    return (
      <Box sx={{ py: 3, textAlign: 'center' }}>
        <Typography sx={{ color: TEXT.meta, fontSize: 13.5 }}>
          {empty}
        </Typography>
      </Box>
    );

  return <>{children}</>;
};
