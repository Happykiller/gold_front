// src\presentation\molecule\importOperationsDialog.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Tooltip,
  Typography,
} from '@mui/material';

import { useFlashStore } from '@happykiller/sunny-ui';

import inversify from '@src/common/inversify';
import { CODES } from '@src/common/codes';
import {
  AMOUNT,
  LINE,
  MONO_FONT,
  STATE,
  SURFACE,
  TEXT,
} from '@src/theme/tokens';
import { ThirdsSelect } from '@presentation/molecule/thirdsSelect';
import { OpeCategoriesSelect } from '@presentation/molecule/opeCategoriesSelect';
import {
  normalizeLabel,
  type AnalysedRow,
} from '@presentation/hooks/importDiff';
import { useImportAnalysis } from '@presentation/hooks/useImportAnalysis';
import {
  STATUS_RECONCILED,
  TYPE_CREDIT,
  TYPE_DEBIT,
} from '@presentation/hooks/useAccountOperations';

/**
 * Import en masse d'un relevé bancaire.
 *
 * Le geste que cette modale remplace : ouvrir sa banque, recopier chaque
 * opération une par une. Elle lit le fichier d'export, le confronte à ce que
 * Gold contient déjà, et ne propose de créer que ce qui manque.
 *
 * **Rien n'est écrit sans relecture.** L'analyse coche ce qu'elle croit
 * nouveau, mais chaque ligne reste décochable, et son classement modifiable,
 * avant le seul bouton qui déclenche des écritures.
 *
 * Les opérations créées le sont **directement pointées** : ce qui figure sur un
 * relevé a été validé par la banque, par construction. On n'appelle donc jamais
 * `setReco`, qui repositionnerait la date à aujourd'hui et détruirait la date
 * du relevé qu'on vient de lire.
 */

type Props = {
  open: boolean;
  accountId: number;
  onClose: () => void;
  /** Appelé après un import qui a créé au moins une opération. */
  onImported: () => void;
};

/** Ce que l'utilisateur peut changer sur une ligne avant de l'importer. */
type LineEdit = {
  selected: boolean;
  /** Identifiants sous forme de chaîne : c'est ce qu'échange `RefSelect`. */
  category_id: string;
  third_id: string;
};

/**
 * Un virement se reconnaît au type que la banque donne à la ligne.
 *
 * Ces lignes sont décochées d'office : un virement Gold porte deux comptes et
 * peut prendre en charge d'autres opérations (`linked_operation_ids`), ce que
 * l'import ne sait pas reproduire. Les créer en débit simple ferait diverger
 * le compte d'en face. Elles restent visibles et recochables — utile pour les
 * virements *reçus*, qui sont souvent de simples entrées d'argent.
 */
function isTransfer(bankType: string): boolean {
  return normalizeLabel(bankType).startsWith('VIREMENT');
}

/**
 * Le contenu d'un fichier, quel que soit son encodage.
 *
 * `file.text()` suppose de l'UTF-8. L'export observé est en ASCII pur, donc
 * indifférent — mais une banque qui livrerait du Windows-1252 accentué
 * produirait des caractères de remplacement au lieu d'échouer franchement, et
 * les libellés abîmés ne se rapprocheraient plus de rien. On repasse donc en
 * 1252 dès qu'un tel caractère apparaît.
 */
async function readFileAsText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const utf8 = new TextDecoder('utf-8').decode(buffer);
  if (!utf8.includes('�')) return utf8;
  return new TextDecoder('windows-1252').decode(buffer);
}

/** Identité stable du « rien à montrer », partagée par tous les rendus. */
const EMPTY_LINES: AnalysedRow[] = [];

const CELL_SX = { display: 'flex', alignItems: 'center', minWidth: 0 };

/** Gabarit commun à l'en-tête et aux lignes : elles doivent s'aligner. */
const GRID_SX = {
  display: 'grid',
  gridTemplateColumns:
    '36px 92px 62px minmax(160px, 1fr) 96px 176px 148px 36px',
  gap: '8px',
  alignItems: 'center',
  px: '10px',
};

const VERDICT_STYLE = {
  new: { bg: STATE.successBg, color: STATE.success },
  uncertain: { bg: STATE.warningBg, color: STATE.warning },
  duplicate: { bg: SURFACE.chip, color: TEXT.tertiary },
} as const;

type RowProps = {
  line: AnalysedRow;
  edit: LineEdit;
  onChange: (patch: Partial<LineEdit>) => void;
  /** Propage le classement de cette ligne à toutes celles du même libellé. */
  onApplyToSiblings: () => void;
  siblings: number;
};

const ImportRow: React.FC<RowProps> = React.memo(
  ({ line, edit, onChange, onApplyToSiblings, siblings }) => {
    const { t } = useTranslation();
    const { row, verdict, match, score } = line;
    const style = VERDICT_STYLE[verdict];
    const transfer = isTransfer(row.bankType);

    return (
      <Box
        sx={{
          ...GRID_SX,
          py: '4px',
          borderTop: LINE.row,
          // Une ligne écartée s'efface sans disparaître : elle reste
          // vérifiable, mais ne dispute pas l'attention aux nouvelles.
          opacity: edit.selected ? 1 : 0.55,
          '&:hover': { background: SURFACE.rowHover },
        }}
      >
        <Box sx={CELL_SX}>
          <Checkbox
            size="small"
            checked={edit.selected}
            onChange={(event) => onChange({ selected: event.target.checked })}
            sx={{ p: '4px' }}
          />
        </Box>

        <Box sx={CELL_SX}>
          <Tooltip
            title={
              match
                ? t('import.verdict-match', {
                    description: match.description ?? '',
                    score: Math.round(score * 100),
                  })
                : ''
            }
          >
            <Box
              component="span"
              sx={{
                background: style.bg,
                color: style.color,
                borderRadius: '4px',
                px: '6px',
                py: '2px',
                fontSize: 10.5,
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {t(`import.verdict-${verdict}`)}
            </Box>
          </Tooltip>
        </Box>

        <Box
          sx={{
            ...CELL_SX,
            fontFamily: MONO_FONT,
            fontSize: 12,
            color: TEXT.meta,
          }}
        >
          {row.date.slice(8, 10)}/{row.date.slice(5, 7)}
        </Box>

        <Box sx={CELL_SX}>
          <Tooltip title={row.rawLabel || row.description}>
            <Typography
              noWrap
              sx={{ fontSize: 13, color: TEXT.description, minWidth: 0 }}
            >
              {row.description}
            </Typography>
          </Tooltip>
          {transfer && (
            <Box
              component="span"
              sx={{
                ml: '6px',
                px: '5px',
                borderRadius: '4px',
                background: SURFACE.chip,
                color: TEXT.tertiary,
                fontSize: 10,
                whiteSpace: 'nowrap',
              }}
            >
              {t('import.transfer')}
            </Box>
          )}
        </Box>

        <Box
          sx={{
            ...CELL_SX,
            justifyContent: 'flex-end',
            fontFamily: MONO_FONT,
            fontSize: 12.5,
            color: row.amount < 0 ? AMOUNT.debit : AMOUNT.credit,
          }}
        >
          {row.amount.toFixed(2)}
        </Box>

        {/* Une ligne qu'on n'importe pas n'a pas de classement à saisir : les
            sélecteurs disparaissent au lieu de rester grisés — vingt
            Autocomplete inertes coûtent autant à monter qu'actifs. */}
        {edit.selected ? (
          <>
            <OpeCategoriesSelect
              value={edit.category_id}
              label={t('import.category')}
              onChange={(value) => onChange({ category_id: value })}
            />
            <ThirdsSelect
              value={edit.third_id}
              label={t('import.third')}
              onChange={(value) => onChange({ third_id: value })}
            />
            <Box sx={CELL_SX}>
              {siblings > 0 && (
                <Tooltip
                  title={t('import.apply-to-siblings', { count: siblings })}
                >
                  <Box
                    component="button"
                    type="button"
                    onClick={onApplyToSiblings}
                    sx={{
                      display: 'inline-flex',
                      border: 0,
                      p: '4px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      background: 'transparent',
                      color: TEXT.tertiary,
                      '&:hover': {
                        background: SURFACE.action,
                        color: TEXT.hover,
                      },
                      '& .MuiSvgIcon-root': { fontSize: 15 },
                    }}
                  >
                    <ContentCopyIcon />
                  </Box>
                </Tooltip>
              )}
            </Box>
          </>
        ) : (
          <Box sx={{ gridColumn: 'span 3' }} />
        )}
      </Box>
    );
  },
);
ImportRow.displayName = 'ImportRow';

export const ImportOperationsDialog: React.FC<Props> = ({
  open,
  accountId,
  onClose,
  onImported,
}) => {
  const { t } = useTranslation();
  const { state, analyse, reset } = useImportAnalysis(accountId);

  const flash = useFlashStore();
  const [edits, setEdits] = React.useState<LineEdit[]>([]);
  const [dragging, setDragging] = React.useState(false);
  const [progress, setProgress] = React.useState<number | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Mémoïsé : le tableau vide du cas « pas encore analysé » serait reconstruit
  // à chaque rendu, ce qui invaliderait toutes les callbacks qui en dépendent.
  const lines = React.useMemo(
    () => (state.status === 'ready' ? state.lines : EMPTY_LINES),
    [state],
  );

  // L'analyse décide de l'état initial, l'utilisateur en garde la main
  // ensuite : cet effet ne se rejoue qu'à l'arrivée d'une nouvelle analyse.
  React.useEffect(() => {
    if (state.status !== 'ready') return;
    setEdits(
      state.lines.map((line) => ({
        selected: line.verdict === 'new' && !isTransfer(line.row.bankType),
        category_id: line.suggestion.category_id
          ? String(line.suggestion.category_id)
          : '',
        third_id: line.suggestion.third_id
          ? String(line.suggestion.third_id)
          : '',
      })),
    );
  }, [state]);

  const handleFile = React.useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      await analyse(await readFileAsText(file));
    },
    [analyse],
  );

  const patchEdit = React.useCallback(
    (index: number, patch: Partial<LineEdit>) => {
      setEdits((previous) =>
        previous.map((edit, i) => (i === index ? { ...edit, ...patch } : edit)),
      );
    },
    [],
  );

  /**
   * Le même classement pour toutes les lignes du même commerçant.
   *
   * Un relevé mensuel porte six fois le même libellé : sans ce geste, il
   * faudrait répéter six fois le même couple catégorie/tiers.
   */
  const applyToSiblings = React.useCallback(
    (index: number) => {
      setEdits((previous) => {
        const source = previous[index];
        const key = normalizeLabel(lines[index]?.row.description);
        return previous.map((edit, i) =>
          i !== index &&
          edit.selected &&
          normalizeLabel(lines[i]?.row.description) === key
            ? {
                ...edit,
                category_id: source.category_id,
                third_id: source.third_id,
              }
            : edit,
        );
      });
    },
    [lines],
  );

  /** Combien d'autres lignes cochées portent ce libellé. */
  const siblingsOf = React.useCallback(
    (index: number) => {
      const key = normalizeLabel(lines[index]?.row.description);
      return lines.filter(
        (line, i) =>
          i !== index &&
          edits[i]?.selected &&
          normalizeLabel(line.row.description) === key,
      ).length;
    },
    [lines, edits],
  );

  const selectedCount = edits.filter((edit) => edit.selected).length;

  const handleClose = React.useCallback(() => {
    // L'état ne survit pas à la fermeture : rouvrir la modale sur un relevé
    // analysé il y a dix minutes montrerait un rapprochement périmé.
    reset();
    setEdits([]);
    setProgress(null);
    onClose();
  }, [onClose, reset]);

  /**
   * L'écriture, ligne à ligne.
   *
   * Séquentielle et non parallèle : l'API n'a pas de mutation d'import, et
   * lancer vingt requêtes de front ne ferait qu'exposer le serveur à un pic
   * pour gagner quelques secondes. Un échec n'interrompt pas la série — il est
   * collecté et rapporté à la fin, car ce qui a été créé l'est bel et bien.
   *
   * La modale se ferme dès la dernière écriture et le compte rendu part en
   * messages flash, comme partout ailleurs dans l'application : une boîte de
   * dialogue qui survit à son propre travail oblige à la congédier, et masque
   * la liste que l'on veut justement relire.
   *
   * Deux messages plutôt qu'un quand des lignes échouent : le succès et
   * l'échec n'ont pas la même couleur, et les fondre en une phrase obligerait
   * à choisir laquelle des deux porter.
   */
  const runImport = React.useCallback(async () => {
    const queue = lines
      .map((line, index) => ({ line, edit: edits[index] }))
      .filter((entry) => entry.edit?.selected);

    setProgress(0);
    const failures: { description: string; error: string }[] = [];
    let created = 0;

    for (const { line, edit } of queue) {
      const { row } = line;
      const response = await inversify.createOperationUsecase.execute({
        account_id: accountId,
        // `amount` est toujours positif en base : le sens est porté par le
        // type, jamais par le signe du nombre.
        amount: Math.abs(row.amount),
        date: row.date,
        description: row.description,
        status_id: STATUS_RECONCILED,
        type_id: row.amount < 0 ? TYPE_DEBIT : TYPE_CREDIT,
        category_id: edit.category_id ? Number(edit.category_id) : undefined,
        third_id: edit.third_id ? Number(edit.third_id) : undefined,
      });

      if (response.message === CODES.SUCCESS) created += 1;
      else
        failures.push({
          description: row.description,
          error: response.error ?? response.message,
        });

      setProgress((done) => (done ?? 0) + 1);
    }

    if (created > 0) {
      flash.success(t('import.done', { count: created }));
      onImported();
    }
    if (failures.length > 0) {
      flash.error(
        t('import.failed', {
          count: failures.length,
          details: failures.map((f) => f.description).join(', '),
        }),
      );
    }

    handleClose();
  }, [accountId, edits, flash, handleClose, lines, onImported, t]);

  const dropZone = (
    <Box
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        void handleFile(event.dataTransfer.files[0]);
      }}
      onClick={() => fileInputRef.current?.click()}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        py: '48px',
        borderRadius: '8px',
        cursor: 'pointer',
        border: dragging ? LINE.fieldHover : LINE.field,
        background: dragging ? SURFACE.rowHover : SURFACE.field,
        color: TEXT.label,
        '& .MuiSvgIcon-root': { fontSize: 34, color: TEXT.tertiary },
      }}
    >
      <UploadFileIcon />
      <Typography sx={{ fontSize: 13.5, color: TEXT.description }}>
        {t('import.drop-hint')}
      </Typography>
      <Typography sx={{ fontSize: 12, color: TEXT.tertiary }}>
        {t('import.drop-formats')}
      </Typography>
    </Box>
  );

  const notice = (text: string, tone: 'warning' | 'error' | 'info') => (
    <Box
      sx={{
        mt: '10px',
        px: '10px',
        py: '8px',
        borderRadius: '6px',
        fontSize: 12.5,
        background:
          tone === 'error'
            ? STATE.errorBg
            : tone === 'warning'
              ? STATE.warningBg
              : STATE.infoBg,
        color:
          tone === 'error'
            ? STATE.error
            : tone === 'warning'
              ? STATE.warning
              : TEXT.description,
      }}
    >
      {text}
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      slotProps={{
        paper: { sx: { background: SURFACE.raised, backgroundImage: 'none' } },
      }}
    >
      <DialogTitle
        sx={{ fontSize: 16, fontWeight: 600, color: TEXT.title, pb: '8px' }}
      >
        {t('import.title')}
      </DialogTitle>

      <DialogContent sx={{ pt: '4px !important' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
            // Sans cette remise à zéro, redéposer le même fichier après une
            // correction n'émettrait aucun événement.
            event.target.value = '';
          }}
        />

        {state.status === 'idle' && dropZone}

        {state.status === 'loading' && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: '48px' }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {state.status === 'error' &&
          notice(
            state.error === 'missing-columns'
              ? t('import.error-missing-columns', {
                  columns: state.columns.join(', '),
                })
              : t(`import.error-${state.error}`),
            'error',
          )}

        {state.status === 'ready' && (
          <>
            <Box
              sx={{
                display: 'flex',
                gap: '14px',
                flexWrap: 'wrap',
                fontSize: 12.5,
                color: TEXT.label,
                mb: '8px',
              }}
            >
              <span>{t('import.summary-read', { count: lines.length })}</span>
              <span>
                {t('import.summary-compared', { count: state.historyCount })}
              </span>
            </Box>

            {state.truncated &&
              notice(t('import.warning-truncated'), 'warning')}
            {state.skipped.length > 0 &&
              notice(
                t('import.warning-skipped', {
                  count: state.skipped.length,
                  lines: state.skipped.map((s) => s.line).join(', '),
                }),
                'warning',
              )}

            <Box sx={{ overflowX: 'auto', mt: '10px' }}>
              <Box sx={{ minWidth: 780 }}>
                <Box
                  sx={{
                    ...GRID_SX,
                    py: '6px',
                    fontSize: 10.5,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: TEXT.meta,
                  }}
                >
                  <span />
                  <span>{t('import.column-verdict')}</span>
                  <span>{t('import.column-date')}</span>
                  <span>{t('import.column-description')}</span>
                  <Box sx={{ textAlign: 'right' }}>
                    {t('import.column-amount')}
                  </Box>
                  <span>{t('import.column-category')}</span>
                  <span>{t('import.column-third')}</span>
                  <span />
                </Box>

                {lines.map((line, index) => (
                  <ImportRow
                    key={line.row.reference || `${line.row.line}`}
                    line={line}
                    edit={
                      edits[index] ?? {
                        selected: false,
                        category_id: '',
                        third_id: '',
                      }
                    }
                    onChange={(patch) => patchEdit(index, patch)}
                    onApplyToSiblings={() => applyToSiblings(index)}
                    siblings={siblingsOf(index)}
                  />
                ))}
              </Box>
            </Box>
          </>
        )}

        {progress !== null && (
          <Box sx={{ mt: '14px' }}>
            <LinearProgress
              variant="determinate"
              value={selectedCount ? (progress / selectedCount) * 100 : 0}
            />
            <Typography sx={{ mt: '6px', fontSize: 12, color: TEXT.label }}>
              {t('import.progress', { done: progress, total: selectedCount })}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: '24px', pb: '16px' }}>
        {state.status === 'ready' && (
          <Typography sx={{ mr: 'auto', fontSize: 12.5, color: TEXT.label }}>
            {t('import.selected', {
              count: selectedCount,
              total: lines.length,
            })}
          </Typography>
        )}
        <Button
          onClick={handleClose}
          disabled={progress !== null}
          sx={{ color: TEXT.label }}
        >
          {t('common.cancel')}
        </Button>
        {state.status === 'ready' && (
          <Button
            variant="contained"
            disabled={selectedCount === 0 || progress !== null}
            onClick={() => void runImport()}
          >
            {t('import.submit', { count: selectedCount })}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
