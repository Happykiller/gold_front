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
  getSignedAmount,
  getVisualAmountMeta,
} from '@presentation/molecule/operationDisplay';

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
    setPosition({
      x: e.clientX - offset.current.x,
      y: e.clientY - offset.current.y,
    });
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

  if (!open) return null;

  return (
    <Paper
      ref={boxRef}
      sx={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: 280,
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
            {operations.map((op: Operation, idx) => {
              const { value, color } = getVisualAmountMeta(op, accountId);
              return (
                <Typography
                  key={idx}
                  sx={{
                    fontFamily: MONO_FONT,
                    fontSize: 12.5,
                    fontVariantNumeric: 'tabular-nums',
                    textAlign: 'right',
                    color,
                  }}
                >
                  {value}
                </Typography>
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
