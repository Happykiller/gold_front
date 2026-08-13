// src\presentation\molecule\accountHeader.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import CalculateIcon from '@mui/icons-material/Calculate';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import {
  Badge,
  Box,
  Tooltip,
  Typography,
  IconButton,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';

import { useCalculatorStore } from '../../stores/useCalculatorStore';
import { Account } from '@presentation/hooks/useAccountOperations';
import { LINE, SURFACE, TEXT } from '@src/theme/tokens';
import { ValueChip } from '@presentation/molecule/valueChip';
import { useStickyBottom } from '@presentation/hooks/useStickyBottom';
import {
  SCREEN_BAR_HEIGHT,
  APP_MAX_WIDTH,
  APP_BAR_HEIGHT,
} from '@presentation/molecule/appLayout';

type Props = {
  account: Account | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  /**
   * Nombre de changements survenus ailleurs et pas encore affichés — un import
   * par l'extension, un autre onglet, un autre appareil.
   *
   * Une pastille sur le bouton qui les efface, plutôt qu'un bandeau : le geste
   * pour les voir est celui qu'on faisait déjà, et rien ne se déplace à
   * l'écran pendant qu'on lit.
   */
  pendingCount?: number;
  /** Ce qu'annonce la pastille : des ajouts, ou des changements. */
  pendingKind?: 'new' | 'changed';
  onAddOperation?: () => void;
  /**
   * Ouvre l'import en masse d'un relevé bancaire.
   *
   * Placé avant le bouton d'ajout, qui reste le dernier : l'ajout est
   * l'action principale de l'écran, et c'est le seul bouton doré.
   */
  onImportOperations?: () => void;
  /**
   * La barre de recherche, insérée dans la barre plutôt que rendue en dessous.
   *
   * Un emplacement plutôt qu'une fusion : l'en-tête n'a ainsi rien à savoir
   * des jetons ni des référentiels, et la barre de recherche continue d'être
   * montée seule par ses tests.
   */
  search?: React.ReactNode;
};

export const AccountHeader: React.FC<Props> = ({
  account,
  loading,
  error,
  onRefresh,
  pendingCount = 0,
  pendingKind = 'new',
  onAddOperation,
  onImportOperations,
  search,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { toggle } = useCalculatorStore();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const stickyRef = useStickyBottom();

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={32} />
      </Box>
    );
  if (error) return <Box sx={{ color: 'error.main' }}>{error}</Box>;
  if (!account) return null;

  const iconButtonSx = {
    width: 26,
    height: 26,
    borderRadius: `${theme.radius.md}px`,
    color: TEXT.label,
    '& .MuiSvgIcon-root': { fontSize: 16 },
  };

  return (
    <Box
      ref={stickyRef}
      sx={{
        width: '100%',
        maxWidth: APP_MAX_WIDTH,
        mx: 'auto',
        position: 'sticky',
        // Sous la barre de navigation du socle, jamais à 0 : elle est déjà
        // collante en haut et le recouvrirait.
        top: { xs: APP_BAR_HEIGHT.xs, sm: APP_BAR_HEIGHT.sm },
        zIndex: theme.zIndex.appBar - 1,
        // Fond opaque obligatoire : sans lui, les lignes de la table défilent
        // visiblement au travers de la barre.
        background: SURFACE.page,
        borderBottom: LINE.block,
        display: 'flex',
        flexWrap: { xs: 'wrap', md: 'nowrap' },
        alignItems: 'center',
        gap: '14px',
        px: '20px',
        py: { xs: '10px', md: 0 },
        // `minHeight` et non `height` : la barre fait 52 px tant qu'aucun
        // critère n'est posé, et grandit si les puces de recherche débordent.
        minHeight: { xs: 'auto', md: SCREEN_BAR_HEIGHT },
      }}
    >
      <Typography
        component="h1"
        sx={{
          fontFamily: 'Montserrat',
          fontWeight: 600,
          fontSize: 17,
          lineHeight: 1.1,
          color: TEXT.title,
          whiteSpace: 'nowrap',
        }}
      >
        {account.label}
      </Typography>

      {/*
       * Les deux soldes que le produit compare en permanence : ce qui est
       * prévu, et ce que la banque a validé.
       *
       * `balance_not_reconcilied` porte mal son nom — la fonction SQL
       * `getBalance` l'agrège sur les statuts 1 **et** 2, c'est donc le solde
       * total projeté, pas le reste à pointer.
       */}
      <ValueChip
        value={account.balance_not_reconcilied ?? 0}
        label={t('account.balance.total')}
      />
      <ValueChip
        value={account.balance_reconcilied ?? 0}
        label={t('account.balance.reconciled')}
      />

      {search && (
        <Box
          sx={{
            flex: { xs: '1 1 100%', md: 1 },
            minWidth: 0,
            order: { xs: 1, md: 0 },
          }}
        >
          {search}
        </Box>
      )}

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          ml: 'auto',
        }}
      >
        {isDesktop && (
          <Tooltip title={t('account.calculator')}>
            <IconButton onClick={toggle} sx={iconButtonSx}>
              <CalculateIcon />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip
          title={
            pendingCount > 0
              ? t(`account.pending-${pendingKind}`, { count: pendingCount })
              : t('account.refresh')
          }
        >
          <IconButton onClick={onRefresh} sx={iconButtonSx}>
            {/* La pastille ne s'affiche qu'à partir de 1 : `invisible` évite un
                point vide en permanence sur un bouton qui ne bouge pas. */}
            <Badge
              color="primary"
              badgeContent={pendingCount}
              invisible={pendingCount === 0}
              sx={{ '& .MuiBadge-badge': { fontSize: 10, minWidth: 16 } }}
            >
              <RefreshIcon />
            </Badge>
          </IconButton>
        </Tooltip>
        {onImportOperations && (
          <Tooltip title={t('account.import-operations')}>
            <IconButton onClick={onImportOperations} sx={iconButtonSx}>
              <FileUploadIcon />
            </IconButton>
          </Tooltip>
        )}
        {onAddOperation && (
          <Tooltip title={t('account.add-operation')}>
            <IconButton
              onClick={onAddOperation}
              sx={{
                ...iconButtonSx,
                ml: '4px',
                background: theme.palette.primary.main,
                color: TEXT.onAccent,
                '&:hover': { background: theme.palette.primary.light },
              }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};
