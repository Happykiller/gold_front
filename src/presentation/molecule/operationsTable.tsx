// src\presentation\molecule\operationsTable.tsx
import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import EditNoteIcon from '@mui/icons-material/EditNote';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import {
  Operation,
  STATUS_RECONCILED,
} from '@presentation/hooks/useAccountOperations';
import { Typography, Box, CircularProgress, Tooltip } from '@mui/material';

import {
  getCategoryIcon,
  formatEuroAmount,
  getOperationVatBreakdown,
  getVisualAmountMeta,
} from '@presentation/molecule/operationDisplay';
import { useCalculatorStore } from '@stores/useCalculatorStore';
import { useInfiniteScroll } from '@presentation/hooks/useInfiniteScroll';
import { groupOperationsByDay } from '@presentation/hooks/groupOperationsByDay';
import {
  ACCOUNT_HEADER_HEIGHT,
  ACCOUNT_MAX_WIDTH,
  APP_BAR_HEIGHT,
} from '@presentation/molecule/accountLayout';
import { AMOUNT, LINE, MONO_FONT, SURFACE, TEXT } from '@src/theme/tokens';

/**
 * Géométrie de la table, en grille CSS.
 *
 * Une seule déclaration, partagée mot pour mot par l'en-tête et par chaque
 * ligne : c'est ce qui garantit qu'ils restent alignés. Le modèle précédent
 * répartissait douze unités de `Grid` par palier, soit neuf paires de nombres
 * devant totaliser 12 — un invariant tenu par un commentaire, que la moindre
 * colonne ajoutée cassait en silence.
 *
 * Ordre des colonnes : id · icône · description · statut · montant ·
 * destination · tiers. La colonne Date a disparu au profit des bandeaux de
 * jour, et la colonne Actions au profit d'une cellule superposée.
 */
const GRID_TEMPLATE = {
  xs: '24px 1fr 26px 88px 60px',
  sm: '24px 1fr 26px 104px 128px',
  md: '50px 24px 1fr 26px 104px 128px 100px',
};

const GRID_SX = {
  display: 'grid',
  gridTemplateColumns: GRID_TEMPLATE,
  columnGap: '12px',
  alignItems: 'center',
  px: '20px',
};

/** Hauteur de ligne. On ne descend pas le tactile à 26 px : c'est invisable. */
const ROW_HEIGHT = { xs: 44, md: 26 };

/** Hauteur de l'en-tête de colonnes et des bandeaux de jour. */
const BAND_HEIGHT = 24;

type ColumnKey =
  'id' | 'category' | 'desc' | 'statut' | 'amount' | 'dest' | 'third';

/**
 * Visibilité et libellé de chaque colonne.
 *
 * Les six libellés existent déjà à l'i18n : la table les écrivait en dur, en
 * français, et les rendait tels quels quelle que soit la langue.
 */
const COLUMNS: Array<{
  key: ColumnKey;
  labelKey: string;
  display: Record<string, string>;
  align?: 'right' | 'center';
}> = [
  {
    key: 'id',
    labelKey: 'operation.id',
    display: { xs: 'none', sm: 'none', md: 'block' },
  },
  { key: 'category', labelKey: '', display: { xs: 'flex', md: 'flex' } },
  { key: 'desc', labelKey: 'operation.description', display: { xs: 'block' } },
  {
    key: 'statut',
    labelKey: 'operation.status',
    display: { xs: 'flex' },
    align: 'center',
  },
  {
    key: 'amount',
    labelKey: 'operation.amount',
    display: { xs: 'block' },
    align: 'right',
  },
  {
    key: 'dest',
    labelKey: 'operation.account_dest',
    display: { xs: 'none', sm: 'flex' },
  },
  {
    key: 'third',
    labelKey: 'operation.third',
    display: { xs: 'none', sm: 'none', md: 'block' },
  },
];

const DISPLAY = Object.fromEntries(
  COLUMNS.map((col) => [col.key, col.display]),
) as Record<ColumnKey, Record<string, string>>;

/**
 * Classe portée par la cellule d'actions, ciblée depuis la ligne pour la
 * révéler au survol.
 */
const ACTIONS_CLASS = 'op-row-actions';

/**
 * Décalage des éléments collants.
 *
 * La barre de navigation du socle est déjà `sticky` en `top: 0`, et l'en-tête
 * du compte se cale dessous : tout ce qui colle dans la table part donc de la
 * somme des deux. Sous `md`, l'en-tête du compte passe sur deux rangs et sa
 * hauteur n'est plus connue — on renonce simplement au collant plutôt que de
 * deviner une valeur.
 */
const HEADER_STICKY_TOP = {
  xs: 'auto',
  md: APP_BAR_HEIGHT.sm + ACCOUNT_HEADER_HEIGHT,
};
const BAND_STICKY_TOP = {
  xs: 'auto',
  md: APP_BAR_HEIGHT.sm + ACCOUNT_HEADER_HEIGHT + BAND_HEIGHT,
};

type RowProps = {
  operation: Operation;
  current_account_id: number;
  isXs: boolean;
  /** La calculatrice flottante est ouverte : le clic sur une ligne l'alimente. */
  calculatorOpen: boolean;
  /** Ligne courante du clavier. Primitif : la mémoïsation tient. */
  selected: boolean;
  /**
   * Une seule ligne est atteignable par tabulation. Sans cela, une liste de
   * 300 lignes poserait 300 arrêts entre la recherche et le pied de page.
   */
  focusable: boolean;
  onSelect: (op: Operation) => void;
  onPick: (op: Operation) => void;
  onEditOperation?: (op: Operation) => void;
  onDeleteOperation?: (op: Operation) => void;
  onRecoOperation?: (op: Operation) => void;
};

/** Un bouton d'action, avec son raccourci — c'est ainsi qu'on l'apprend. */
const RowAction: React.FC<{
  label: string;
  shortcut?: string;
  icon?: React.ReactNode;
  accent?: boolean;
  compact?: boolean;
  onClick: (event: React.MouseEvent) => void;
}> = ({ label, shortcut, icon, accent, compact, onClick }) => (
  <Box
    component="button"
    type="button"
    aria-label={label}
    onClick={onClick}
    sx={(theme) => ({
      height: 20,
      px: '7px',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      fontSize: 11,
      fontFamily: 'inherit',
      borderRadius: `${theme.radius.sm}px`,
      background: accent ? 'rgba(52, 201, 123, 0.16)' : SURFACE.action,
      color: accent ? AMOUNT.credit : TEXT.label,
      '& .MuiSvgIcon-root': { fontSize: 13 },
    })}
  >
    {icon}
    {!compact && !icon && label}
    {!compact && shortcut && (
      <Box
        component="span"
        sx={{
          fontFamily: MONO_FONT,
          fontWeight: 500,
          fontSize: 9.5,
          opacity: 0.7,
        }}
      >
        {shortcut}
      </Box>
    )}
  </Box>
);

/**
 * Une ligne du tableau.
 *
 * Extraite et mémoïsée : en chargement continu la liste atteint vite plusieurs
 * centaines de lignes, et chaque lot suivant re-rendait jusqu'ici l'intégralité
 * des précédentes. Le gain suppose que les callbacks reçus soient stables —
 * ils sont mémoïsés dans `operations.tsx`, sans quoi cette optimisation ne
 * servirait à rien. Toute prop ajoutée ici doit être un primitif ou une
 * référence stable.
 */
const OperationRow = React.memo(function OperationRow({
  operation,
  current_account_id,
  isXs,
  calculatorOpen,
  selected,
  focusable,
  onSelect,
  onPick,
  onEditOperation,
  onDeleteOperation,
  onRecoOperation,
}: RowProps) {
  const { t } = useTranslation();
  const isReconciled = operation.status_id === STATUS_RECONCILED;

  const isIncomingTransfer =
    operation.type_id === 3 &&
    Number(operation.account_id_dest) === Number(current_account_id);
  const isTransfer = operation.type_id === 3;

  const { value, color } = getVisualAmountMeta(operation, current_account_id);
  const { vatRate, ttc, ht, vatAmount } = getOperationVatBreakdown(operation);

  const tooltipContent = (
    <Box sx={{ py: 0.5 }}>
      <Typography variant="body2">
        <Trans>operation.vat</Trans> : {vatRate} %
      </Typography>
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
    <Box
      role="row"
      aria-selected={selected}
      data-op-id={operation.id}
      tabIndex={focusable ? 0 : -1}
      sx={{
        ...GRID_SX,
        height: ROW_HEIGHT,
        borderBottom: LINE.row,
        fontSize: 12.5,
        outline: 'none',
        background: selected ? SURFACE.rowHover : undefined,
        '&:hover': { background: SURFACE.rowHover },
        '&:hover .op-row-desc': { color: TEXT.hover },
        ...(selected ? { '& .op-row-desc': { color: TEXT.hover } } : {}),
        // `focus-within` autant que `hover` : sans lui, une tabulation jusqu'aux
        // boutons les laisserait invisibles alors qu'ils ont le focus.
        [`&:hover .${ACTIONS_CLASS}, &:focus-within .${ACTIONS_CLASS}`]: {
          opacity: 1,
          pointerEvents: 'auto',
        },
        cursor: isXs ? 'pointer' : calculatorOpen ? 'copy' : 'default',
      }}
      onFocus={() => onSelect(operation)}
      onClick={() => {
        // La sélection d'abord : le reste de la sémantique du clic ne change
        // pas, seulement son ordre.
        onSelect(operation);
        if (isXs) onEditOperation?.(operation);
        else if (calculatorOpen) onPick(operation);
      }}
    >
      {/* Présent, mais silencieux : un identifiant se consulte, il ne se lit pas. */}
      <Typography
        noWrap
        sx={{
          display: DISPLAY.id,
          fontFamily: MONO_FONT,
          fontWeight: 400,
          fontSize: 10.5,
          color: TEXT.id,
        }}
      >
        {operation.id}
      </Typography>

      {/* Le libellé de catégorie passe en infobulle : l'icône et sa couleur
          suffisent à la reconnaître, et la colonne rend sa place au texte. */}
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
            display: DISPLAY.category,
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'help',
            lineHeight: 0,
            // `getCategoryIcon` dimensionne pour un libellé qui n'est plus là.
            '& .MuiSvgIcon-root': { fontSize: 12, mr: 0 },
          }}
        >
          {getCategoryIcon(operation.category?.label ?? '')}
        </Box>
      </Tooltip>

      <Typography
        noWrap
        className="op-row-desc"
        sx={{ display: DISPLAY.desc, fontSize: 13, color: TEXT.description }}
      >
        {operation.description || ''}
      </Typography>

      {/* Le glyphe porte l'action : cliquer pointe l'opération, sans ouvrir
          l'écran d'édition. C'est le geste le plus fréquent du produit. */}
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
          sx={(theme) => ({
            display: DISPLAY.statut,
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 0,
            // Déjà pointée : l'état se lit, il ne se reprend pas — le serveur
            // ne sait pas dépointer une opération.
            cursor: isReconciled ? 'default' : 'pointer',
            // L'or est réservé à l'action, à l'état « en attente » et à
            // l'élément actif : une opération non pointée appelle un geste.
            color: isReconciled ? AMOUNT.credit : theme.palette.primary.main,
            '& .MuiSvgIcon-root': { fontSize: 13 },
          })}
        >
          {isReconciled ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
        </Box>
      </Tooltip>

      {/* Le montant lui-même porte le détail de TVA : une icône ⓘ par ligne
          encombrait la colonne qu'on lit le plus. */}
      <Tooltip
        title={tooltipContent}
        placement="top"
        arrow
        enterTouchDelay={0}
        leaveTouchDelay={3000}
      >
        <Typography
          noWrap
          sx={{
            display: DISPLAY.amount,
            textAlign: 'right',
            fontFamily: MONO_FONT,
            fontWeight: 500,
            fontSize: 12,
            fontVariantNumeric: 'tabular-nums',
            color,
            cursor: 'help',
          }}
        >
          {value}
        </Typography>
      </Tooltip>

      {/* Une colonne à part entière, et non un appendice du montant. Une ligne
          sans destination occupe quand même sa largeur : c'est ce qui garde les
          montants alignés d'une ligne à l'autre. */}
      <Box
        sx={{
          display: DISPLAY.dest,
          alignItems: 'center',
          gap: '5px',
          minWidth: 0,
          fontSize: 11,
          color: AMOUNT.destination,
        }}
      >
        {isTransfer && (
          <>
            <Box component="span" sx={{ color: TEXT.tertiary }}>
              {isIncomingTransfer ? '←' : '→'}
            </Box>
            <Box
              component="span"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {isIncomingTransfer
                ? operation.account?.label
                : operation.account_dest?.label}
            </Box>
          </>
        )}
      </Box>

      <Typography
        noWrap
        sx={{ display: DISPLAY.third, fontSize: 11, color: TEXT.third }}
      >
        <Trans>{operation.third?.label || ''}</Trans>
      </Typography>

      {/*
       * Les actions se superposent aux colonnes destination et tiers plutôt que
       * d'occuper une colonne à elles : elles ne recouvrent ainsi jamais la
       * description.
       *
       * `pointerEvents: none` au repos est indispensable. Superposée, cette
       * cellule intercepterait sinon les clics destinés à la ligne — l'envoi
       * vers la calculatrice et l'édition sur mobile — sans que rien ne le
       * signale. Un élément en `pointer-events: none` reste atteignable au
       * clavier : `focus-within` le rétablit.
       *
       * `opacity` et non `display` ou `visibility` : ces deux-là sortent les
       * boutons de l'ordre de tabulation, et `focus-within` ne se déclencherait
       * alors jamais.
       */}
      <Box
        className={ACTIONS_CLASS}
        sx={{
          gridColumn: { xs: 'auto', sm: '5 / span 1', md: '6 / span 2' },
          justifySelf: 'end',
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          opacity: { xs: 1, sm: 0 },
          pointerEvents: { xs: 'auto', sm: 'none' },
          transition: 'opacity 120ms ease-in-out',
          // Fond opaque : sans lui, destination et tiers transparaissent sous
          // les boutons.
          background: SURFACE.rowHover,
        }}
      >
        <RowAction
          label={t('operation.action-edit')}
          shortcut="E"
          icon={<EditNoteIcon />}
          onClick={(e) => {
            e.stopPropagation();
            onEditOperation?.(operation);
          }}
        />
        <RowAction
          label={t('operation.action-delete')}
          icon={<DeleteIcon />}
          onClick={(e) => {
            e.stopPropagation();
            onDeleteOperation?.(operation);
          }}
        />
        {!isReconciled && !isXs && (
          <RowAction
            label={t('operation.action-reconcile')}
            shortcut="␣"
            accent
            onClick={(e) => {
              e.stopPropagation();
              onRecoOperation?.(operation);
            }}
          />
        )}
      </Box>
    </Box>
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
  const { t, i18n } = useTranslation();
  // Sélecteurs plutôt que le store entier : sans eux, chaque opération ajoutée
  // à la calculatrice re-rendait toute la table.
  const add = useCalculatorStore((s) => s.add);
  const calculatorOpen = useCalculatorStore((s) => s.open);
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));

  const setSentinel = useInfiniteScroll({
    onIntersect: () => onLoadMore?.(),
    enabled: hasMore && !loadingMore && !loading && !error,
  });

  // Dérivé de la liste accumulée complète, jamais accumulé : une journée
  // coupée entre deux lots redonne bien un seul bandeau.
  const groups = React.useMemo(
    () => groupOperationsByDay(operations ?? [], i18n.language),
    [operations, i18n.language],
  );

  /**
   * Ligne courante du clavier.
   *
   * Ici et pas dans `useAccountOperations` : la sélection n'est pas une donnée
   * du serveur. Ni dans `operations.tsx` : personne d'autre n'en a besoin.
   */
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // La ligne sélectionnée peut disparaître : on la supprime, ou un critère de
  // recherche la fait sortir de la liste.
  React.useEffect(() => {
    if (selectedId === null) return;
    if (!operations?.some((op) => op.id === selectedId)) setSelectedId(null);
  }, [operations, selectedId]);

  const handleSelect = React.useCallback(
    (op: Operation) => setSelectedId(op.id),
    [],
  );

  /**
   * Raccourcis, gérés au niveau du conteneur et non de la ligne : l'événement
   * remonte, un seul gestionnaire suffit, et la navigation se fait sur la
   * liste **plate** — dans les groupes, elle buterait sur chaque bandeau.
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    // `E` est une lettre nue : le jour où un champ apparaît dans la table
    // (saisie en ligne), l'absence de garde la rendrait intapable.
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target?.isContentEditable
    )
      return;

    const flat = operations ?? [];
    const index = flat.findIndex((op) => op.id === selectedId);
    const current = index >= 0 ? flat[index] : null;

    const move = (delta: number) => {
      if (!flat.length) return;
      const next =
        index < 0 ? 0 : Math.min(flat.length - 1, Math.max(0, index + delta));
      setSelectedId(flat[next].id);
      containerRef.current
        ?.querySelector<HTMLElement>(`[data-op-id="${flat[next].id}"]`)
        ?.focus();
    };

    if (event.key === 'ArrowDown') {
      // Sans `preventDefault`, la page défile en même temps que la sélection.
      event.preventDefault();
      move(1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      move(-1);
      return;
    }
    if (event.key === ' ') {
      // Impératif : Espace fait autrement défiler la page d'un écran à chaque
      // pointage.
      event.preventDefault();
      // Une opération déjà pointée ne se reprend pas — silencieusement, sans
      // bascule optimiste qui aurait à revenir en arrière.
      if (current && current.status_id !== STATUS_RECONCILED)
        onRecoOperation?.(current);
      return;
    }
    if (event.key === 'e' || event.key === 'E' || event.key === 'Enter') {
      if (current) {
        event.preventDefault();
        onEditOperation?.(current);
      }
    }
  };

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={32} />
      </Box>
    );
  // L'erreur ne remplace la table que si rien n'a encore pu être affiché : un
  // lot suivant qui échoue ne doit pas faire disparaître ce qui est déjà lu.
  if (error && !operations)
    return <Box sx={{ color: 'error.main' }}>{error}</Box>;
  if (!operations) return null;

  return (
    <Box
      ref={containerRef}
      role="grid"
      onKeyDown={handleKeyDown}
      sx={{
        width: '100%',
        maxWidth: ACCOUNT_MAX_WIDTH,
        mx: 'auto',
        background: SURFACE.page,
        // Plus de bordure dorée ni de halo de 32 px : un bloc se délimite par
        // un filet de 1 px. Le rayon plafonne à 6 px.
        border: { xs: 'none', sm: LINE.block },
        borderRadius: { xs: 0, sm: `${theme.radius.lg}px` },
        overflow: 'hidden',
        // Contexte d'empilement propre : aucun élément collant de la table ne
        // peut ainsi passer par-dessus l'en-tête du compte ni la barre de
        // navigation, quels que soient les z-index internes.
        position: 'relative',
        zIndex: 0,
      }}
    >
      <Box
        sx={{
          ...GRID_SX,
          height: BAND_HEIGHT,
          background: SURFACE.header,
          borderBottom: LINE.block,
          position: { xs: 'static', md: 'sticky' },
          top: HEADER_STICKY_TOP,
          zIndex: 3,
          fontFamily: MONO_FONT,
          fontWeight: 500,
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: TEXT.meta,
        }}
      >
        {COLUMNS.map((col) => (
          <Box
            key={col.key}
            component="span"
            sx={{
              display: DISPLAY[col.key],
              textAlign: col.align,
              // La colonne Statut est étroite : l'interlettrage y volerait la
              // place d'une lettre.
              letterSpacing: col.key === 'statut' ? 0 : undefined,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {col.labelKey ? t(col.labelKey) : ''}
          </Box>
        ))}
      </Box>

      {groups.map((group) => (
        // Ce conteneur n'est pas décoratif : c'est lui qui donne au bandeau son
        // bloc englobant. Sans lui, tous les bandeaux colleraient au même
        // `top` et se recouvriraient au lieu de se chasser l'un l'autre.
        <Box key={group.key}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              px: '20px',
              height: BAND_HEIGHT,
              background: SURFACE.band,
              borderBottom: LINE.row,
              position: { xs: 'static', md: 'sticky' },
              top: BAND_STICKY_TOP,
              zIndex: 2,
            }}
          >
            <Box
              component="span"
              sx={{
                fontFamily: MONO_FONT,
                fontWeight: 500,
                fontSize: 11,
                letterSpacing: '0.06em',
                color: TEXT.label,
              }}
            >
              {group.label}
            </Box>
            {/* Rien d'autre que la date et le filet : ni compteur, ni total. */}
            <Box sx={{ flex: 1, height: '1px', background: LINE.band }} />
          </Box>
          {group.operations.map((operation) => (
            <OperationRow
              key={operation.id}
              operation={operation}
              current_account_id={current_account_id}
              isXs={isXs}
              calculatorOpen={calculatorOpen}
              selected={operation.id === selectedId}
              // Exactement une ligne dans l'ordre de tabulation : celle qui est
              // sélectionnée, ou la première à défaut.
              focusable={
                selectedId === null
                  ? operation.id === operations[0]?.id
                  : operation.id === selectedId
              }
              onSelect={handleSelect}
              onPick={add}
              onEditOperation={onEditOperation}
              onDeleteOperation={onDeleteOperation}
              onRecoOperation={onRecoOperation}
            />
          ))}
        </Box>
      ))}

      {/* Sentinelle : son approche déclenche le lot suivant. Hors des groupes,
          dernier enfant du conteneur. */}
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
        {!loadingMore && error && (
          <Box sx={{ color: 'error.main' }}>{error}</Box>
        )}
        {/* Une liste vide n'avait aucun message : la table affichait son
            en-tête et du vide. Avec un critère actif, c'est le cas nominal. */}
        {!loadingMore && !error && operations.length === 0 && (
          <Typography sx={{ color: TEXT.meta, fontSize: 14 }}>
            <Trans>
              {filtered ? 'operations.no_result' : 'operations.empty'}
            </Trans>
          </Typography>
        )}
        {!loadingMore && !error && !hasMore && operations.length > 0 && (
          <Typography sx={{ color: TEXT.meta, fontSize: 14 }}>
            <Trans>operations.end_of_list</Trans>
          </Typography>
        )}
      </Box>

      {/* Légende : les deux glyphes ne se devinent pas, et le raccourci ne
          s'apprend que s'il est écrit quelque part. */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          px: '20px',
          py: '9px',
          borderTop: LINE.block,
          fontSize: 11.5,
          color: TEXT.meta,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircleIcon sx={{ fontSize: 12, color: AMOUNT.credit }} />
          {t('operations.legend-reconciled')}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RadioButtonUncheckedIcon
            sx={{ fontSize: 12, color: theme.palette.primary.main }}
          />
          {t('operations.legend-pending')}
        </Box>
        <Box sx={{ ml: 'auto' }}>{t('operations.legend-hint')}</Box>
      </Box>
    </Box>
  );
};
