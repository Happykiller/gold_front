import * as React from 'react';
import { Box, Grid, Typography, IconButton, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

import { Account } from '@presentation/hooks/useAccountOperations';

type Props = {
  account: Account | null;
  loading: boolean;
  error: string | null;
  page: number;
  setPage: (p: number) => void;
  onRefresh: () => void;
  onAddOperation?: () => void;
  onCloneAccount?: () => void;
};

export const AccountHeader: React.FC<Props> = ({
  account,
  loading,
  error,
  page,
  setPage,
  onRefresh,
  onAddOperation,
}) => {
  if (loading) return <Box display="flex" justifyContent="center"><CircularProgress size={32} /></Box>;
  if (error) return <Box color="error.main">{error}</Box>;
  if (!account) return null;

  return (
    <Box
      mb={2}
      mt={2}
      width="100%"
      maxWidth={950}
      mx="auto"
      px={{ xs: 1, sm: 2, md: 0 }}
    >
      <Grid container alignItems="center" justifyContent="space-between" spacing={2}>
        {/* Titre + actions à droite */}
        <Grid item xs={12} sm={5} display="flex" alignItems="center">
          <Typography variant="h4" fontWeight={700} color="grey.100" sx={{ flex: 1 }}>
            {account.label}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={7} display="flex" justifyContent="flex-end" alignItems="center" gap={2}>
          <IconButton size="medium" onClick={onRefresh}><RefreshIcon /></IconButton>
          {onAddOperation &&
            <IconButton size="medium" onClick={onAddOperation}><AddIcon /></IconButton>
          }
        </Grid>
      </Grid>
      {/* Balances sur une seule ligne */}
      <Grid container alignItems="center" justifyContent="space-between" mt={1} mb={1}>
        <Grid item xs={12} sm={6} textAlign="left">
          <Typography fontWeight={500} color="#23e47a">
            Balance reconciled: {account.balance_reconcilied.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6} textAlign="right">
          <Typography fontWeight={500} color="#28abe1">
            Balance not reconciled: {account.balance_not_reconcilied.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
          </Typography>
        </Grid>
      </Grid>
      {/* Pagination */}
      <Box display="flex" alignItems="center" justifyContent="center" mt={1}>
        <IconButton
          size="small"
          disabled={page === 0}
          onClick={() => setPage(page - 1)}
        ><ArrowBackIosIcon /></IconButton>
        <Typography mx={2} fontWeight={500} color="grey.200">Page {page + 1}</Typography>
        <IconButton
          size="small"
          onClick={() => setPage(page + 1)}
        ><ArrowForwardIosIcon /></IconButton>
      </Box>
    </Box>
  );
};
