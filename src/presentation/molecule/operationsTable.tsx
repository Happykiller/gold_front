// src\presentation\molecule\operationsTable.tsx
import * as React from 'react';
import { Grid, Typography, IconButton, Box, CircularProgress } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditNoteIcon from '@mui/icons-material/EditNote';
import CheckIcon from '@mui/icons-material/Check';
import { useTheme } from '@mui/material/styles';
import { Operation } from '@presentation/hooks/useAccountOperations';
import {
  getOperationIcon,
  getCategoryIcon,
  getAmountColor,
  formatOperationDate,
} from '@presentation/molecule/operationDisplay';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';

type Props = {
  operations: Operation[] | null;
  loading: boolean;
  error: string | null;
  onEditOperation?: (op: Operation) => void;
  onDeleteOperation?: (op: Operation) => void;
  onRecoOperation?: (op: Operation) => void;
};

export const OperationsTable: React.FC<Props> = ({
  operations,
  loading,
  error,
  onEditOperation,
  onDeleteOperation,
  onRecoOperation,
}) => {
  const theme = useTheme();

  if (loading) return <Box display="flex" justifyContent="center"><CircularProgress size={32} /></Box>;
  if (error) return <Box color="error.main">{error}</Box>;
  if (!operations) return null;

  const columns = [
    { label: 'ID', key: 'id', xs: 1 },
    { label: 'Date', key: 'date', xs: 1.25 },
    { label: 'Montant', key: 'amount', xs: 1.25 },
    { label: 'Dest.', key: 'dest', xs: 1.25 },
    { label: 'Cat.', key: 'category', xs: 2 },
    { label: 'Tiers', key: 'third', xs: 1.25 },
    { label: 'Desc.', key: 'desc', xs: 2 },
    { label: '', key: 'actions', xs: 2 },
  ];

  function renderDest(operation: Operation, currentAccountId: number | string) {
    if (operation.type_id === 3 && Number(operation.account_id_dest) === Number(currentAccountId)) {
      // Virement crédit (le compte courant reçoit)
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowLeftIcon sx={{ fontSize: 18, color: theme.palette.info.main, mr: 0.5 }} />
          {operation.account?.label}
        </span>
      );
    } else if (operation.type_id === 3) {
      // Virement débit (le compte courant émet)
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowRightIcon sx={{ fontSize: 18, color: theme.palette.secondary.light, mr: 0.5 }} />
          {operation.account_dest?.label}
        </span>
      );
    }
    return null;
  }

  return (
    <Box sx={{
      background: 'rgba(18,22,42,0.96)',
      borderRadius: 4,
      border: `2px solid ${theme.palette.primary.main}`, // Bordure jaune gold
      boxShadow: `0 0 32px 0 ${theme.palette.primary.main}55`, // Aura gold autour
      p: 0,
      width: '100%',
      maxWidth: 950,
      mx: 'auto'
    }}>
      {/* Table header */}
      <Grid container sx={{
        fontWeight: 600,
        borderRadius: "8px 8px 0 0",
        fontSize: "0.99rem",
        py: 1,
      }}>
        {columns.map(col => (
          <Grid item xs={col.xs} key={col.key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="#fff" fontSize={15}>{col.label}</Typography>
          </Grid>
        ))}
        <Grid item xs={0.5}></Grid> {/* pour actions */}
      </Grid>
      {/* Table rows */}
      {operations.map((operation) => (
        <Grid
          container
          key={operation.id}
          sx={{
            minHeight: 44,
            borderBottom: '1px solid #222638',
            background: 'none',
            '&:hover': { backgroundColor: 'rgba(90,100,130,0.12)' },
            cursor: 'pointer'
          }}
          alignItems="center"
          onClick={() => onEditOperation?.(operation)}
        >
          <Grid item xs={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography noWrap color="#e7e7ef">{operation.id}</Typography>
          </Grid>
          <Grid item xs={1.25} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography noWrap color="#e7e7ef">{formatOperationDate(operation.date)}</Typography>
          </Grid>
          <Grid item xs={1.25} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography
              noWrap
              fontWeight={600}
              sx={{ color: getAmountColor(operation.amount, theme) }}
            >
              {getOperationIcon(operation.amount)}
              {operation.amount < 0
                ? operation.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €'
                : '+' + operation.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €'}
            </Typography>
          </Grid>
          <Grid item xs={1.25} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography noWrap color="#e7e7ef">
              {renderDest(operation, operation.account_id_dest ?? 0)}
            </Typography>
          </Grid>
          <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {getCategoryIcon(operation.category?.label ?? '')}
            <Typography noWrap color="#b7d6ff" ml={0.4}>{operation.category?.label || ''}</Typography>
          </Grid>
          <Grid item xs={1.25} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography noWrap color="#e7e7ef">{operation.third?.label || ''}</Typography>
          </Grid>
          <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
            <Typography noWrap color="#b0b3c6">{operation.description || ''}</Typography>
          </Grid>
          <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconButton size="small" onClick={e => { e.stopPropagation(); onDeleteOperation?.(operation); }}><DeleteIcon /></IconButton>
            <IconButton size="small" onClick={e => { e.stopPropagation(); onEditOperation?.(operation); }}><EditNoteIcon /></IconButton>
            {(operation.status_id === 1) && (
              <IconButton size="small" onClick={e => { e.stopPropagation(); onRecoOperation?.(operation); }}><CheckIcon /></IconButton>
            )}
          </Grid>
        </Grid>
      ))}
    </Box>
  );
};
