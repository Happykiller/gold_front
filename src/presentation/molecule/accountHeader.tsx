// src\presentation\molecule\accountHeader.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import CalculateIcon from '@mui/icons-material/Calculate';
import {
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
import { pendingBalance } from '@presentation/hooks/accountBalance';
import { formatEuroAmount } from '@presentation/molecule/operationDisplay';
import { LINE, MONO_FONT, SURFACE, TEXT } from '@src/theme/tokens';
import {
  ACCOUNT_HEADER_HEIGHT,
  ACCOUNT_MAX_WIDTH,
  APP_BAR_HEIGHT,
  STICKY_TOP_VAR,
} from '@presentation/molecule/accountLayout';

/**
 * Publie le bas réel de la barre, pour que la table y cale ses propres
 * éléments collants.
 *
 * Mesuré et non calculé : la barre du socle se dimensionne sur son contenu, et
 * celle-ci grandit dès qu'une puce de recherche est posée. Un `ResizeObserver`
 * suit les deux cas sans que personne n'ait à prévenir.
 */
function useStickyBottom() {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const publish = () => {
      const { bottom } = node.getBoundingClientRect();
      // `bottom` est relatif au viewport : la barre étant collante, c'est
      // exactement l'offset auquel la suite doit se caler.
      document.documentElement.style.setProperty(
        STICKY_TOP_VAR,
        `${Math.round(bottom)}px`,
      );
    };

    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(node);
    window.addEventListener('resize', publish);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', publish);
      document.documentElement.style.removeProperty(STICKY_TOP_VAR);
    };
  }, []);

  return ref;
}

type Props = {
  account: Account | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onAddOperation?: () => void;
  /**
   * La barre de recherche, insérée dans la barre plutôt que rendue en dessous.
   *
   * Un emplacement plutôt qu'une fusion : l'en-tête n'a ainsi rien à savoir
   * des jetons ni des référentiels, et la barre de recherche continue d'être
   * montée seule par ses tests.
   */
  search?: React.ReactNode;
};

/** Un chiffre qualifié : le montant d'abord, son libellé en petit ensuite. */
const BalanceChip: React.FC<{
  amount: number;
  label: string;
  highlighted?: boolean;
}> = ({ amount, label, highlighted }) => (
  <Box
    sx={(theme) => ({
      display: 'flex',
      alignItems: 'baseline',
      gap: '7px',
      padding: '3px 9px',
      borderRadius: `${theme.radius.sm}px`,
      background: highlighted ? 'rgba(244, 183, 0, 0.1)' : SURFACE.chip,
      whiteSpace: 'nowrap',
    })}
  >
    <Typography
      component="span"
      sx={(theme) => ({
        fontFamily: MONO_FONT,
        fontWeight: 500,
        fontSize: 13,
        lineHeight: 1,
        // Toute couleur passe par `sx` : la prop `color` de MUI n'accepte que
        // des clés de palette et n'applique rien, en silence, sur un hexa.
        color: highlighted ? theme.palette.primary.main : TEXT.title,
      })}
    >
      {formatEuroAmount(amount)}
    </Typography>
    <Typography
      component="span"
      sx={{ fontSize: 10.5, lineHeight: 1, color: TEXT.meta }}
    >
      {label}
    </Typography>
  </Box>
);

export const AccountHeader: React.FC<Props> = ({
  account,
  loading,
  error,
  onRefresh,
  onAddOperation,
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
        maxWidth: ACCOUNT_MAX_WIDTH,
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
        minHeight: { xs: 'auto', md: ACCOUNT_HEADER_HEIGHT },
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

      <BalanceChip
        amount={account.balance_reconcilied ?? 0}
        label={t('account.balance.reconciled')}
      />
      {/*
       * Un montant sans compteur : l'API n'expose ni total ni agrégat de
       * comptage, et la liste se charge par lots. Un nombre compté sur les
       * lignes déjà chargées ne concorderait jamais avec ce montant, qui est
       * global et exact.
       */}
      <BalanceChip
        amount={pendingBalance(account)}
        label={t('account.balance.pending')}
        highlighted
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
        <Tooltip title={t('account.refresh')}>
          <IconButton onClick={onRefresh} sx={iconButtonSx}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
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
