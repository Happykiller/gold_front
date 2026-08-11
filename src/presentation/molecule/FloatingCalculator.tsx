// src\presentation\molecule\FloatingCalculator.tsx
import { Typography } from '@mui/material';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CloseIcon from '@mui/icons-material/Close';
import { useSearchParams } from 'react-router-dom';
import { Box, IconButton, Paper } from '@mui/material';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

import { useCalculatorStore } from '@stores/useCalculatorStore';
import { LINE, MONO_FONT, SHADOW, SURFACE, TEXT } from '@src/theme/tokens';
import { Operation } from '@presentation/hooks/useAccountOperations';
import {
  formatEuroAmount,
  getCategoryIcon,
  getSignedAmount,
  getVisualAmountMeta,
} from '@presentation/molecule/operationDisplay';

const WIDTH = 320;

/**
 * Ramène le panneau dans la fenêtre.
 *
 * Sans cela, un glisser un peu vif le sortait de l'écran — et comme la poignée
 * de déplacement sort avec lui, il n'y avait plus aucun moyen de le ramener :
 * la position vit dans l'état du composant, que la fermeture ne réinitialise
 * pas. On garde toujours le panneau entièrement visible.
 */
function clampToViewport(
  x: number,
  y: number,
  el: HTMLElement | null,
): { x: number; y: number } {
  const width = el?.offsetWidth || WIDTH;
  const height = el?.offsetHeight || 0;
  const maxX = Math.max(0, window.innerWidth - width);
  const maxY = Math.max(0, window.innerHeight - height);
  return {
    x: Math.min(Math.max(0, x), maxX),
    y: Math.min(Math.max(0, y), maxY),
  };
}

export const FloatingCalculator: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const boxRef = useRef<HTMLDivElement>(null);
  const { open, close, operations, reset } = useCalculatorStore();
  const accountId = parseInt(searchParams.get('account_id') ?? '0');
  const total = operations.reduce(
    (acc, op) => acc + getSignedAmount(op, accountId),
    0,
  );

  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [dragging, setDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    const rect = boxRef.current?.getBoundingClientRect();
    offset.current = {
      x: e.clientX - (rect?.left || 0),
      y: e.clientY - (rect?.top || 0),
    };
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging) return;
    setPosition(
      clampToViewport(
        e.clientX - offset.current.x,
        e.clientY - offset.current.y,
        boxRef.current,
      ),
    );
  };

  const handleMouseUp = () => setDragging(false);

  React.useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging]);

  // Rétrécir la fenêtre laisserait sinon le panneau dehors, hors d'atteinte.
  React.useEffect(() => {
    const onResize = () =>
      setPosition((p) => clampToViewport(p.x, p.y, boxRef.current));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // La position survit à la fermeture — elle vit dans l'état du composant, que
  // `return null` ne démonte pas. Sans ce recadrage à l'ouverture, un panneau
  // laissé hors champ (fenêtre rétrécie entre-temps, position héritée)
  // reviendrait invisible, et la seule façon de le récupérer serait de
  // recharger la page.
  React.useEffect(() => {
    if (!open) return;
    setPosition((p) => clampToViewport(p.x, p.y, boxRef.current));
  }, [open]);

  if (!open) return null;

  return (
    <Paper
      ref={boxRef}
      sx={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: WIDTH,
        borderRadius: (theme) => `${theme.radius.lg}px`,
        background: SURFACE.raised,
        border: LINE.block,
        zIndex: 1300,
        // Une ombre noire, comme toute surface flottante. Le halo doré de 15 px
        // était le dernier vestige de l'ancien langage dans le dépôt.
        boxShadow: SHADOW.raised,
        cursor: 'default',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 1,
          py: 0.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          cursor: 'move',
          userSelect: 'none',
        }}
        onMouseDown={handleMouseDown}
      >
        <DragIndicatorIcon fontSize="small" />
        <IconButton size="small" onClick={close}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ p: 2 }}>
        {operations.length === 0 ? (
          <Typography sx={{ fontSize: 12.5, color: TEXT.meta }}>
            {t('calculator.empty')}
          </Typography>
        ) : (
          <Box>
            {/*
              Une colonne de montants seuls ne dit pas de quoi elle est faite :
              on additionne quatre nombres sans pouvoir vérifier qu'ils
              correspondent aux lignes qu'on a cliquées, ni retirer la bonne.
              Chaque ligne porte donc la même icône de catégorie et le même
              libellé que la table, pour qu'on la reconnaisse d'un coup d'œil.
            */}
            {operations.map((op: Operation, idx) => {
              const { value, color } = getVisualAmountMeta(op, accountId);
              return (
                <Box
                  key={`${op.id}-${idx}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    py: 0.15,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flex: '0 0 auto',
                      '& svg': { fontSize: 15 },
                    }}
                  >
                    {getCategoryIcon(op.category?.label ?? '')}
                  </Box>
                  {/*
                    minWidth: 0 est indispensable — sans lui un enfant flex
                    refuse de descendre sous sa largeur de contenu et le
                    montant se ferait pousser hors du panneau au lieu de voir
                    le libellé se tronquer.
                  */}
                  <Typography
                    title={op.description}
                    sx={{
                      flex: '1 1 auto',
                      minWidth: 0,
                      fontSize: 12,
                      color: TEXT.description,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {op.description}
                  </Typography>
                  <Typography
                    sx={{
                      flex: '0 0 auto',
                      fontFamily: MONO_FONT,
                      fontSize: 12.5,
                      fontVariantNumeric: 'tabular-nums',
                      textAlign: 'right',
                      color,
                    }}
                  >
                    {value}
                  </Typography>
                </Box>
              );
            })}
            <Box
              sx={{
                mt: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography sx={{ fontSize: 11, color: TEXT.meta }}>
                {t('calculator.total')}
              </Typography>
              <Typography
                sx={{
                  fontFamily: MONO_FONT,
                  fontWeight: 500,
                  fontSize: 13,
                  color: TEXT.title,
                }}
              >
                {formatEuroAmount(total)}
              </Typography>
            </Box>
          </Box>
        )}

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton
            size="small"
            aria-label={t('calculator.reset')}
            onClick={reset}
          >
            <DeleteSweepIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};
