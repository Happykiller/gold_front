import * as React from 'react';
import { Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTheme, useMediaQuery } from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import {
  Box,
  Grid,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';

import { useCalculatorStore } from '../../stores/useCalculatorStore';
import { Account } from '@presentation/hooks/useAccountOperations';

type Props = {
  account: Account | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onAddOperation?: () => void;
  onCloneAccount?: () => void;
};

export const AccountHeader: React.FC<Props> = ({
  account,
  loading,
  error,
  onRefresh,
  onAddOperation,
}) => {
  const theme = useTheme();
  const { toggle } = useCalculatorStore();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={32} />
      </Box>
    );
  if (error) return <Box color="error.main">{error}</Box>;
  if (!account) return null;

  return (
    <Box
      sx={{
        px: { xs: 1, sm: 2, md: 0 },
        mb: 2,
        mt: 2,
        width: '100%',
        maxWidth: 950,
        mx: 'auto',
      }}
    >
      <Grid
        container
        spacing={2}
        sx={{ alignItems: 'center', justifyContent: 'space-between' }}
      >
        {/* Titre + actions à droite */}
        <Grid
          size={{ xs: 12, sm: 5 }}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Typography
            variant="h4"
            color="grey.100"
            sx={{ fontWeight: 700, flex: 1 }}
          >
            {account.label}
          </Typography>
        </Grid>
        <Grid
          size={{ xs: 12, sm: 7 }}
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {isDesktop && (
            <Tooltip title="Ouvrir la calculatrice">
              <IconButton size="medium" onClick={toggle}>
                <CalculateIcon />
              </IconButton>
            </Tooltip>
          )}
          <IconButton size="medium" onClick={onRefresh}>
            <RefreshIcon />
          </IconButton>
          {onAddOperation && (
            <IconButton size="medium" onClick={onAddOperation}>
              <AddIcon />
            </IconButton>
          )}
        </Grid>
      </Grid>
      {/* Balances sur une seule ligne */}
      <Grid
        container
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          mt: 1,
          mb: 1,
        }}
      >
        <Grid size={{ xs: 12, sm: 6 }} sx={{ textAlign: 'left' }}>
          <Typography color="#23e47a" sx={{ fontWeight: 500 }}>
            Balance reconciled:{' '}
            {(account.balance_reconcilied ?? 0).toLocaleString('fr-FR', {
              minimumFractionDigits: 2,
            })}{' '}
            €
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }} sx={{ textAlign: 'right' }}>
          <Typography color="#28abe1" sx={{ fontWeight: 500 }}>
            Balance not reconciled:{' '}
            {(account.balance_not_reconcilied ?? 0).toLocaleString('fr-FR', {
              minimumFractionDigits: 2,
            })}{' '}
            €
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};
