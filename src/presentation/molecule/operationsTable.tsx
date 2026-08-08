// src\presentation\molecule\operationsTable.tsx
import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import EditNoteIcon from '@mui/icons-material/EditNote';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
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
  getCategoryIcon,
  formatEuroAmount,
  formatOperationDate,
  formatOperationDateFull,
  getOperationVatBreakdown,
  getVisualAmountMeta,
} from '@presentation/molecule/operationDisplay';
import { useCalculatorStore } from '@stores/useCalculatorStore';
import { useInfiniteScroll } from '@presentation/hooks/useInfiniteScroll';

/**
 * Hiérarchie de lecture.
 *
 * La description est ce qui identifie une opération — c'est elle qu'on cherche
 * en parcourant la liste. L'identifiant, la date et le tiers se consultent, ils
 * ne se lisent pas : les laisser au même niveau de contraste que le libellé
 * donnait huit champs d'égale importance et aucun point d'entrée pour l'œil.
 *
 * Ces couleurs passent toutes par `sx`, jamais par la prop `color` de
 * `Typography` : celle-ci ne reconnaît que les **clés de la palette**
 * (`primary`, `textSecondary`…). Une valeur hexadécimale ne correspond à aucun
 * variant, ne produit aucune règle CSS, et le texte hérite alors de la couleur
 * ambiante. Le défaut est silencieux — le blanc hérité ressemblait à s'y
 * méprendre au `#e7e7ef` demandé, et trois cellules l'écrivaient en vain
 * depuis l'origine.
 */
const TEXT_PRIMARY = '#e8eaf0';
const TEXT_MUTED = '#5a6478';
const TEXT_HEADER = '#7b8496';

/**
 * Chasse fixe pour la date et le montant.
 *
 * Ce n'est pas un effet de style : à largeur de caractère constante, les
 * virgules décimales et les symboles € se superposent d'une ligne à l'autre, et
 * la colonne des montants se compare d'un coup d'œil au lieu de se lire nombre
 * par nombre. C'est aussi pourquoi cette colonne s'aligne à droite — centrée,
 * la chasse fixe ne servirait à rien.
 */
const MONO_FONT =
  'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

/**
 * Définition des colonnes, dans l'ordre d'affichage.
 *
 * Hissée hors du composant : elle ne dépend de rien, et y rester la faisait
 * reconstruire à chaque rendu. La `Map` remplace les `columns.find(...)` qui
 * étaient répétés trois fois par cellule, soit vingt-quatre parcours du
 * tableau par ligne — supportable sur une page de 25, plus du tout quand la
 * liste s'accumule au fil du scroll.
 *
 * Chaque palier doit totaliser 12. La description est visible partout, y
 * compris sur mobile où elle récupère la place de la catégorie — celle-ci n'y
 * affiche qu'une icône et occupait pourtant trois colonnes. En contrepartie le
 * tiers disparaît en `sm` : sept colonnes n'entrent pas dans douze, et c'est
 * l'information la moins déterminante.
 */
const COLUMNS = [
  {
    label: 'ID',
    key: 'id',
    xs: 0,
    sm: 0,
    md: 0.75,
    display: { xs: 'none', md: 'flex' },
  },
  // Marqueur de ligne : premier élément visible sur mobile, où l'identifiant
  // est masqué. L'icône vaut action — cliquer pointe l'opération.
  { label: 'Statut', key: 'statut', xs: 1, sm: 1, md: 0.75, display: 'flex' },
  { label: 'Date', key: 'date', xs: 2, sm: 1.5, md: 1, display: 'flex' },
  // Réduite à son icône : le libellé est passé en infobulle, la colonne n'a
  // donc plus besoin que de la place d'un pictogramme.
  { label: 'Cat.', key: 'category', xs: 1, sm: 1, md: 1, display: 'flex' },
  { label: 'Desc.', key: 'desc', xs: 4, sm: 4, md: 3.75, display: 'flex' },
  {
    label: 'Montant',
    key: 'amount',
    xs: 3,
    sm: 2,
    md: 1.5,
    display: 'flex',
  },
  {
    label: 'Dest.',
    key: 'dest',
    xs: 0,
    sm: 1.5,
    md: 1.25,
    display: { xs: 'none', sm: 'flex' },
  },
  {
    label: 'Tiers',
    key: 'third',
    xs: 0,
    sm: 0,
    md: 1.25,
    display: { xs: 'none', md: 'flex' },
  },
  // Deux boutons depuis que le pointage est passé dans la colonne Statut.
  { label: '', key: 'actions', xs: 1, sm: 1, md: 0.75, display: 'flex' },
] as const;

type Column = (typeof COLUMNS)[number];

const COL = Object.fromEntries(COLUMNS.map((col) => [col.key, col])) as Record<
  Column['key'],
  Column
>;

/** Le libellé se lit à gauche, les montants s'alignent à droite. */
const justifyOf = (key: Column['key']) =>
  key === 'desc' ? 'flex-start' : key === 'amount' ? 'flex-end' : 'center';

/**
 * Classe portée par la cellule d'actions, ciblée depuis la ligne pour la
 * révéler au survol.
 */
const ACTIONS_CLASS = 'op-row-actions';

/**
 * Taille et alignement d'une cellule, à partir de sa colonne.
 *
 * `variant: 'header'` reprend les mêmes dimensions sans le comportement de
 * survol : l'en-tête n'appartient à aucune ligne, il resterait effacé pour
 * toujours.
 */
const cellProps = (key: Column['key'], variant: 'row' | 'header' = 'row') => ({
  size: { xs: COL[key].xs, sm: COL[key].sm, md: COL[key].md },
  className: key === 'actions' && variant === 'row' ? ACTIONS_CLASS : undefined,
  sx: {
    display: COL[key].display,
    alignItems: 'center',
    justifyContent: justifyOf(key),
    ...(key === 'actions' && variant === 'row'
      ? {
          // Effacées au repos, révélées au survol de leur ligne : trois icônes
          // par ligne sur une liste qui en accumule des centaines, c'est le
          // bruit le plus dense de l'écran.
          //
          // `opacity` et non `display` : la place reste réservée, sinon la
          // ligne se réorganiserait sous le curseur au moment de viser.
          //
          // Sur mobile, elles restent visibles — il n'y a pas de survol sur un
          // écran tactile, les masquer les rendrait inatteignables.
          opacity: { xs: 1, sm: 0 },
          transition: 'opacity 120ms ease-in-out',
        }
      : {}),
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
  const { t } = useTranslation();
  // Statut 2 = rapprochée. Le serveur ne connaît pas le chemin inverse.
  const isReconciled = operation.status_id === 2;

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

  const { value, color } = getVisualAmountMeta(operation, current_account_id);
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
        // `focus-within` autant que `hover` : sans lui, une tabulation
        // jusqu'aux boutons les laisserait invisibles alors qu'ils ont le
        // focus.
        [`&:hover .${ACTIONS_CLASS}, &:focus-within .${ACTIONS_CLASS}`]: {
          opacity: 1,
        },
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
        {/* Même traitement que la date : un identifiant se consulte, il ne se
            lit pas — et comme elle, c'est du numérique, donc chasse fixe. */}
        <Typography
          noWrap
          sx={{ color: TEXT_MUTED, fontFamily: MONO_FONT, fontSize: 13 }}
        >
          {operation.id}
        </Typography>
      </Grid>
      <Grid {...cellProps('statut')}>
        {/* L'icône porte l'action : cliquer pointe l'opération. Le bouton
            dédié de la colonne Actions faisait double emploi avec un état
            qu'on doit de toute façon pouvoir lire d'un coup d'œil. */}
        <Tooltip
          title={
            isReconciled
              ? t('operation.status-reconciled')
              : t('operation.reconcile')
          }
          placement="top"
        >
          <Box
            component="span"
            role={isReconciled ? undefined : 'button'}
            aria-label={
              isReconciled
                ? t('operation.status-reconciled')
                : t('operation.reconcile')
            }
            tabIndex={isReconciled ? undefined : 0}
            onClick={(e) => {
              e.stopPropagation();
              if (!isReconciled) onRecoOperation?.(operation);
            }}
            onKeyDown={(e) => {
              if (isReconciled) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onRecoOperation?.(operation);
              }
            }}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              lineHeight: 0,
              // Déjà pointée : l'état se lit, il ne se reprend pas — le
              // serveur ne sait pas dépointer une opération.
              cursor: isReconciled ? 'default' : 'pointer',
              color: isReconciled ? '#23e47a' : TEXT_MUTED,
              '&:hover': { color: isReconciled ? '#23e47a' : '#23e47a' },
            }}
          >
            {isReconciled ? (
              <CheckCircleIcon sx={{ fontSize: 18 }} />
            ) : (
              <RadioButtonUncheckedIcon sx={{ fontSize: 18 }} />
            )}
          </Box>
        </Tooltip>
      </Grid>
      <Grid {...cellProps('date')}>
        {/* L'année est retirée de l'affichage, mais la liste remonte jusqu'à
            2018 : l'infobulle la rend au survol plutôt que de la perdre. */}
        <Tooltip
          title={formatOperationDateFull(operation.date)}
          placement="top"
        >
          <Typography
            noWrap
            sx={{ color: TEXT_MUTED, fontFamily: MONO_FONT, fontSize: 13 }}
          >
            {formatOperationDate(operation.date)}
          </Typography>
        </Tooltip>
      </Grid>
      <Grid {...cellProps('category')}>
        {/* Le libellé passe en infobulle : l'icône et sa couleur suffisent à
            reconnaître une catégorie d'un coup d'œil, et la colonne rend sa
            largeur à la description. */}
        {/* Chaîne vide et non élément vide quand la catégorie manque : un
            `<Trans>` reste truthy, et MUI afficherait une bulle vide. */}
        <Tooltip
          title={
            operation.category?.label ? (
              <Trans>{operation.category.label}</Trans>
            ) : (
              ''
            )
          }
          placement="top"
        >
          <Box
            component="span"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              cursor: 'help',
              lineHeight: 0,
              // `getCategoryIcon` prévoit une marge pour un libellé qui n'est
              // plus là : sans cela l'icône serait décentrée dans sa cellule.
              '& .MuiSvgIcon-root': { mr: 0 },
            }}
          >
            {getCategoryIcon(operation.category?.label ?? '')}
          </Box>
        </Tooltip>
      </Grid>
      <Grid {...cellProps('desc')}>
        <Tooltip title={operation.description || ''} placement="top">
          <Typography noWrap sx={{ color: TEXT_PRIMARY }}>
            {operation.description || ''}
          </Typography>
        </Tooltip>
      </Grid>
      <Grid {...cellProps('amount')}>
        {/* Le ⓘ a disparu : le montant lui-même porte le détail de TVA. Une
            icône par ligne pour une information consultée occasionnellement
            encombrait la colonne qu'on lit le plus. */}
        <Tooltip
          title={tooltipContent}
          placement="top"
          arrow
          enterTouchDelay={0}
          leaveTouchDelay={3000}
        >
          {/* Pas d'icône ↗ ↘ : le signe et la couleur disent déjà le sens. */}
          <Typography
            noWrap
            sx={{
              fontWeight: 600,
              color,
              fontFamily: MONO_FONT,
              fontVariantNumeric: 'tabular-nums',
              cursor: 'help',
            }}
          >
            {value}
          </Typography>
        </Tooltip>
      </Grid>
      <Grid {...cellProps('dest')}>
        <Typography noWrap sx={{ color: TEXT_PRIMARY }}>
          {renderDest()}
        </Typography>
      </Grid>
      <Grid {...cellProps('third')}>
        {/* En retrait comme la date, mais sans chasse fixe : c'est du texte. */}
        <Typography noWrap sx={{ color: TEXT_MUTED, fontSize: 13 }}>
          <Trans>{operation.third?.label || ''}</Trans>
        </Typography>
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
        {/* Le bouton de pointage a rejoint la colonne Statut : son icône y dit
            déjà l'état, autant qu'elle porte l'action. */}
      </Grid>
    </Grid>
  );
});

type Props = {
  current_account_id: number;
  operations: Operation[] | null;
  /** Chargement du premier lot : la table n'a encore rien à montrer. */
  loading: boolean;
  /** Au moins un critère est actif : une liste vide est alors le cas nominal. */
  filtered?: boolean;
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
  filtered = false,
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
        {/* Même `cellProps` que les cellules : l'en-tête suit ainsi
            automatiquement l'alignement de sa colonne, notamment le montant
            passé à droite. */}
        {COLUMNS.map((col) => (
          <Grid key={col.key} {...cellProps(col.key, 'header')}>
            <Typography
              noWrap
              sx={{
                color: TEXT_HEADER,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
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
        {/* Une liste vide n'avait aucun message : la table affichait son
            en-tête et du vide. Avec un critère actif, c'est le cas nominal. */}
        {!loadingMore && !error && operations.length === 0 && (
          <Typography sx={{ color: TEXT_HEADER, fontSize: 14 }}>
            <Trans>
              {filtered ? 'operations.no_result' : 'operations.empty'}
            </Trans>
          </Typography>
        )}
        {!loadingMore && !error && !hasMore && operations.length > 0 && (
          <Typography sx={{ color: TEXT_HEADER, fontSize: 14 }}>
            <Trans>operations.end_of_list</Trans>
          </Typography>
        )}
      </Box>
    </Box>
  );
};
