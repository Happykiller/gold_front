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
import { useInfiniteScroll } from '@presentation/hooks/useInfiniteScroll';

/**
 * Définition des colonnes.
 *
 * Hissée hors du composant : elle ne dépend de rien, et y rester la faisait
 * reconstruire à chaque rendu. La `Map` remplace les `columns.find(...)` qui
 * étaient répétés trois fois par cellule, soit vingt-quatre parcours du
 * tableau par ligne — supportable sur une page de 25, plus du tout quand la
 * liste s'accumule au fil du scroll.
 */
const COLUMNS = [
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
] as const;

type Column = (typeof COLUMNS)[number];

const COL = Object.fromEntries(COLUMNS.map((col) => [col.key, col])) as Record<
  Column['key'],
  Column
>;

/** Taille et alignement d'une cellule, à partir de sa colonne. */
const cellProps = (key: Column['key']) => ({
  size: { xs: COL[key].xs, sm: COL[key].sm, md: COL[key].md },
  sx: {
    display: COL[key].display,
    alignItems: 'center',
    justifyContent: key === 'desc' ? 'flex-start' : 'center',
  },
});

type RowProps = {
  operation: Operation;
  current_account_id: number;
  isXs: boolean;
  /** La calculatrice flottante est ouverte : le clic sur une ligne l'alimente. */
  calculatorOpen: boolean;
  onPick: (op: Operation) => void;
  onEditOperation?: (op: Operation) => void;
  onDeleteOperation?: (op: Operation) => void;
  onRecoOperation?: (op: Operation) => void;
};

/**
 * Une ligne du tableau.
 *
 * Extraite et mémoïsée : en chargement continu la liste atteint vite plusieurs
 * centaines de lignes, et chaque lot suivant re-rendait jusqu'ici l'intégralité
 * des précédentes. Le gain suppose que les callbacks reçus soient stables —
 * ils sont mémoïsés dans `operations.tsx`, sans quoi cette optimisation ne
 * servirait à rien.
 */
const OperationRow = React.memo(function OperationRow({
  operation,
  current_account_id,
  isXs,
  calculatorOpen,
  onPick,
  onEditOperation,
  onDeleteOperation,
  onRecoOperation,
}: RowProps) {
  const theme = useTheme();

  const renderDest = () => {
    if (
      operation.type_id === 3 &&
      Number(operation.account_id_dest) === Number(current_account_id)
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
  };

  const { value, color, sign } = getVisualAmountMeta(
    operation,
    current_account_id,
  );
  const { vatRate, ttc, ht, vatAmount } = getOperationVatBreakdown(operation);

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
        <Trans>operation.vat_amount</Trans>: {formatEuroAmount(vatAmount)}
      </Typography>
    </Box>
  );

  return (
    <Grid
      container
      sx={{
        alignItems: 'center',
        minHeight: 44,
        borderBottom: '1px solid #222638',
        background: 'none',
        '&:hover': { backgroundColor: 'rgba(90,100,130,0.12)' },
        cursor: isXs ? 'pointer' : calculatorOpen ? 'copy' : 'default',
      }}
      onClick={() => {
        if (isXs) {
          onEditOperation?.(operation);
        } else if (calculatorOpen) {
          onPick(operation);
        }
      }}
    >
      <Grid {...cellProps('id')}>
        <Typography noWrap color="#e7e7ef">
          {operation.id}
        </Typography>
      </Grid>
      <Grid {...cellProps('date')}>
        <Typography noWrap color="#e7e7ef">
          {formatOperationDate(operation.date)}
        </Typography>
      </Grid>
      <Grid {...cellProps('amount')}>
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
      </Grid>
      <Grid {...cellProps('dest')}>
        <Typography noWrap color="#e7e7ef">
          {renderDest()}
        </Typography>
      </Grid>
      <Grid {...cellProps('category')}>
        {getCategoryIcon(operation.category?.label ?? '')}
        <Typography
          noWrap
          color="#b7d6ff"
          sx={{ ml: 0.4, display: { xs: 'none', sm: 'inline' } }}
        >
          <Trans>{operation.category?.label || ''}</Trans>
        </Typography>
      </Grid>
      <Grid {...cellProps('third')}>
        <Typography noWrap color="#e7e7ef">
          <Trans>{operation.third?.label || ''}</Trans>
        </Typography>
      </Grid>
      <Grid {...cellProps('desc')}>
        <Tooltip title={operation.description || ''} placement="top">
          <Typography noWrap color="#b0b3c6">
            {operation.description || ''}
          </Typography>
        </Tooltip>
      </Grid>
      <Grid {...cellProps('actions')}>
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
  );
});

type Props = {
  current_account_id: number;
  operations: Operation[] | null;
  /** Chargement du premier lot : la table n'a encore rien à montrer. */
  loading: boolean;
  /** Chargement d'un lot suivant : la table reste affichée. */
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  error: string | null;
  onEditOperation?: (op: Operation) => void;
  onDeleteOperation?: (op: Operation) => void;
  onRecoOperation?: (op: Operation) => void;
};

export const OperationsTable: React.FC<Props> = ({
  current_account_id,
  operations,
  loading,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
  error,
  onEditOperation,
  onDeleteOperation,
  onRecoOperation,
}) => {
  const theme = useTheme();
  // Sélecteurs plutôt que le store entier : sans eux, chaque opération ajoutée
  // à la calculatrice re-rendait toute la table.
  const add = useCalculatorStore((s) => s.add);
  const calculatorOpen = useCalculatorStore((s) => s.open);
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));

  const setSentinel = useInfiniteScroll({
    onIntersect: () => onLoadMore?.(),
    enabled: hasMore && !loadingMore && !loading && !error,
  });

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={32} />
      </Box>
    );
  // L'erreur ne remplace la table que si rien n'a encore pu être affiché : un
  // lot suivant qui échoue ne doit pas faire disparaître ce qui est déjà lu.
  if (error && !operations) return <Box color="error.main">{error}</Box>;
  if (!operations) return null;

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
        {COLUMNS.map((col) => (
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
        <OperationRow
          key={operation.id}
          operation={operation}
          current_account_id={current_account_id}
          isXs={isXs}
          calculatorOpen={calculatorOpen}
          onPick={add}
          onEditOperation={onEditOperation}
          onDeleteOperation={onDeleteOperation}
          onRecoOperation={onRecoOperation}
        />
      ))}
      {/* Sentinelle : son approche déclenche le lot suivant. */}
      <Box ref={setSentinel} sx={{ height: 1 }} />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 40,
        }}
      >
        {loadingMore && <CircularProgress size={24} />}
        {!loadingMore && error && <Box color="error.main">{error}</Box>}
        {!loadingMore && !error && !hasMore && operations.length > 0 && (
          <Typography color="#8f98ad" sx={{ fontSize: 14 }}>
            <Trans>operations.end_of_list</Trans>
          </Typography>
        )}
      </Box>
    </Box>
  );
};
