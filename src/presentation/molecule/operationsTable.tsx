// src\presentation\molecule\operationsTable.tsx
import * as React from 'react';
import { Trans } from 'react-i18next';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import EditNoteIcon from '@mui/icons-material/EditNote';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import { Operation } from '@presentation/hooks/useAccountOperations';
import {
  Grid,
  Typography,
  IconButton,
  Box,
  CircularProgress,
  Tooltip,
} from '@mui/material';

import {
  getOperationIcon,
  getCategoryIcon,
  formatEuroAmount,
  formatOperationDate,
  getOperationVatBreakdown,
  getVisualAmountMeta,
} from '@presentation/molecule/operationDisplay';
import { useCalculatorStore } from '@stores/useCalculatorStore';

type Props = {
  current_account_id: number;
  operations: Operation[] | null;
  loading: boolean;
  error: string | null;
  onEditOperation?: (op: Operation) => void;
  onDeleteOperation?: (op: Operation) => void;
  onRecoOperation?: (op: Operation) => void;
};

export const OperationsTable: React.FC<Props> = ({
  current_account_id,
  operations,
  loading,
  error,
  onEditOperation,
  onDeleteOperation,
  onRecoOperation,
}) => {
  const theme = useTheme();
  const { add, open } = useCalculatorStore();
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));

  const handleClickOperation = (operation: Operation) => {
    add(operation);
  };

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={32} />
      </Box>
    );
  if (error) return <Box color="error.main">{error}</Box>;
  if (!operations) return null;

  const columns = [
    {
      label: 'ID',
      key: 'id',
      xs: 0,
      sm: 0,
      md: 1,
      display: { xs: 'none', md: 'flex' },
    },
    { label: 'Date', key: 'date', xs: 3, sm: 2, md: 1.25, display: 'flex' },
    {
      label: 'Montant',
      key: 'amount',
      xs: 3,
      sm: 2,
      md: 1.25,
      display: 'flex',
    },
    {
      label: 'Dest.',
      key: 'dest',
      xs: 0,
      sm: 2,
      md: 1.25,
      display: { xs: 'none', sm: 'flex' },
    },
    { label: 'Cat.', key: 'category', xs: 3, sm: 2, md: 2, display: 'flex' },
    {
      label: 'Tiers',
      key: 'third',
      xs: 0,
      sm: 2,
      md: 1.25,
      display: { xs: 'none', sm: 'flex' },
    },
    {
      label: 'Desc.',
      key: 'desc',
      xs: 0,
      sm: 0,
      md: 2,
      display: { xs: 'none', md: 'flex' },
    },
    { label: '', key: 'actions', xs: 3, sm: 2, md: 2, display: 'flex' },
  ];

  function renderDest(operation: Operation, currentAccountId: number | string) {
    if (
      operation.type_id === 3 &&
      Number(operation.account_id_dest) === Number(currentAccountId)
    ) {
      // Virement crédit (le compte courant reçoit)
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowLeftIcon
            sx={{ fontSize: 18, color: theme.palette.info.main, mr: 0.5 }}
          />
          {operation.account?.label}
        </span>
      );
    } else if (operation.type_id === 3) {
      // Virement débit (le compte courant émet)
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowRightIcon
            sx={{ fontSize: 18, color: theme.palette.secondary.light, mr: 0.5 }}
          />
          {operation.account_dest?.label}
        </span>
      );
    }
    return null;
  }

  return (
    <Box
      sx={{
        background: {
          xs: 0,
          sm: theme.palette.background.default,
        },
        borderRadius: {
          xs: 0,
          sm: 4,
        },
        border: {
          xs: 'none',
          sm: `2px solid ${theme.palette.primary.main}`,
        },
        boxShadow: {
          xs: 'none',
          sm: `0 0 32px 0 ${theme.palette.primary.main}55`,
        },
        p: 0,
        width: '100%',
        mx: 'auto',
      }}
    >
      {/* Table header */}
      <Grid
        container
        sx={{
          fontWeight: 600,
          fontSize: '0.99rem',
          py: 1,
        }}
      >
        {columns.map((col) => (
          <Grid
            size={{ xs: col.xs, sm: col.sm, md: col.md }}
            key={col.key}
            sx={{
              display: col.display,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography color="#fff" sx={{ fontSize: 15 }}>
              {col.label}
            </Typography>
          </Grid>
        ))}
      </Grid>
      {/* Table rows */}
      {operations.map((operation) => (
        <Grid
          container
          key={operation.id}
          sx={{
            alignItems: 'center',
            minHeight: 44,
            borderBottom: '1px solid #222638',
            background: 'none',
            '&:hover': { backgroundColor: 'rgba(90,100,130,0.12)' },
            cursor: isXs ? 'pointer' : open ? 'copy' : 'default',
          }}
          onClick={() => {
            if (isXs) {
              onEditOperation?.(operation);
            } else if (open) {
              handleClickOperation(operation);
            }
          }}
        >
          <Grid
            size={{
              xs: columns.find((elt) => elt.key === 'id')?.xs,
              sm: columns.find((elt) => elt.key === 'id')?.sm,
              md: columns.find((elt) => elt.key === 'id')?.md,
            }}
            sx={{
              display: columns.find((elt) => elt.key === 'id')?.display,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography noWrap color="#e7e7ef">
              {operation.id}
            </Typography>
          </Grid>
          <Grid
            size={{
              xs: columns.find((elt) => elt.key === 'date')?.xs,
              sm: columns.find((elt) => elt.key === 'date')?.sm,
              md: columns.find((elt) => elt.key === 'date')?.md,
            }}
            sx={{
              display: columns.find((elt) => elt.key === 'date')?.display,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography noWrap color="#e7e7ef">
              {formatOperationDate(operation.date)}
            </Typography>
          </Grid>
          <Grid
            size={{
              xs: columns.find((elt) => elt.key === 'amount')?.xs,
              sm: columns.find((elt) => elt.key === 'amount')?.sm,
              md: columns.find((elt) => elt.key === 'amount')?.md,
            }}
            sx={{
              display: columns.find((elt) => elt.key === 'amount')?.display,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {(() => {
              const { value, color, sign } = getVisualAmountMeta(
                operation,
                current_account_id,
              );
              const { vatRate, ttc, ht, vatAmount } =
                getOperationVatBreakdown(operation);

              const tooltipContent = (
                <Box sx={{ py: 0.5 }}>
                  <Typography variant="body2">TVA: {vatRate} %</Typography>
                  <Typography variant="body2">
                    <Trans>operation.ttc_amount</Trans>: {formatEuroAmount(ttc)}
                  </Typography>
                  <Typography variant="body2">
                    <Trans>operation.ht_amount</Trans>: {formatEuroAmount(ht)}
                  </Typography>
                  <Typography variant="body2">
                    <Trans>operation.vat_amount</Trans>:{' '}
                    {formatEuroAmount(vatAmount)}
                  </Typography>
                </Box>
              );

              return (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    minWidth: 0,
                  }}
                >
                  <Typography noWrap sx={{ fontWeight: 600, color }}>
                    {getOperationIcon(sign === '-' ? -1 : 1)}
                    {value}
                  </Typography>
                  <Tooltip
                    title={tooltipContent}
                    placement="top"
                    arrow
                    enterTouchDelay={0}
                    leaveTouchDelay={3000}
                  >
                    <Box
                      component="span"
                      onClick={(e) => e.stopPropagation()}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        color: '#8f98ad',
                        cursor: 'help',
                        lineHeight: 0,
                      }}
                    >
                      <InfoOutlinedIcon sx={{ fontSize: 15 }} />
                    </Box>
                  </Tooltip>
                </Box>
              );
            })()}
          </Grid>
          <Grid
            size={{
              xs: columns.find((elt) => elt.key === 'dest')?.xs,
              sm: columns.find((elt) => elt.key === 'dest')?.sm,
              md: columns.find((elt) => elt.key === 'dest')?.md,
            }}
            sx={{
              display: columns.find((elt) => elt.key === 'dest')?.display,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography noWrap color="#e7e7ef">
              {renderDest(operation, current_account_id)}
            </Typography>
          </Grid>
          <Grid
            size={{
              xs: columns.find((elt) => elt.key === 'category')?.xs,
              sm: columns.find((elt) => elt.key === 'category')?.sm,
              md: columns.find((elt) => elt.key === 'category')?.md,
            }}
            sx={{
              display: columns.find((elt) => elt.key === 'category')?.display,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {getCategoryIcon(operation.category?.label ?? '')}
            <Typography
              noWrap
              color="#b7d6ff"
              sx={{ ml: 0.4, display: { xs: 'none', sm: 'inline' } }}
            >
              <Trans>{operation.category?.label || ''}</Trans>
            </Typography>
          </Grid>
          <Grid
            size={{
              xs: columns.find((elt) => elt.key === 'third')?.xs,
              sm: columns.find((elt) => elt.key === 'third')?.sm,
              md: columns.find((elt) => elt.key === 'third')?.md,
            }}
            sx={{
              display: columns.find((elt) => elt.key === 'third')?.display,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography noWrap color="#e7e7ef">
              <Trans>{operation.third?.label || ''}</Trans>
            </Typography>
          </Grid>
          <Grid
            size={{
              xs: columns.find((elt) => elt.key === 'desc')?.xs,
              sm: columns.find((elt) => elt.key === 'desc')?.sm,
              md: columns.find((elt) => elt.key === 'desc')?.md,
            }}
            sx={{
              display: columns.find((elt) => elt.key === 'desc')?.display,
              alignItems: 'center',
              justifyContent: 'flex-start',
            }}
          >
            <Tooltip title={operation.description || ''} placement="top">
              <Typography noWrap color="#b0b3c6">
                {operation.description || ''}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid
            size={{
              xs: columns.find((elt) => elt.key === 'actions')?.xs,
              sm: columns.find((elt) => elt.key === 'actions')?.sm,
              md: columns.find((elt) => elt.key === 'actions')?.md,
            }}
            sx={{
              display: columns.find((elt) => elt.key === 'actions')?.display,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteOperation?.(operation);
              }}
            >
              <DeleteIcon />
            </IconButton>
            {!isXs && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditOperation?.(operation);
                }}
              >
                <EditNoteIcon />
              </IconButton>
            )}
            {operation.status_id === 1 && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onRecoOperation?.(operation);
                }}
              >
                <CheckIcon />
              </IconButton>
            )}
          </Grid>
        </Grid>
      ))}
    </Box>
  );
};
