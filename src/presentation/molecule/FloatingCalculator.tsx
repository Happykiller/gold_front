// src\presentation\molecule\FloatingCalculator.tsx
import { Typography } from '@mui/material';
import React, { useRef, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { useSearchParams } from 'react-router-dom';
import { Box, IconButton, Paper } from '@mui/material';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

import { useCalculatorStore } from '@stores/useCalculatorStore';
import { Operation } from '@components/hooks/useAccountOperations';
import {
  getSignedAmount,
  getVisualAmountMeta,
} from '@components/molecule/operationDisplay';

export const FloatingCalculator: React.FC = () => {
  const [searchParams] = useSearchParams();
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
        width: 300,
        borderRadius: 2,
        bgcolor: 'background.paper',
        zIndex: 1300,
        boxShadow: (theme) => `0 0 15px ${theme.palette.primary.main}`,
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
          <Typography variant="body2" color="text.secondary">
            Aucune opération. Cliquez sur une ligne pour en ajouter.
          </Typography>
        ) : (
          <Box>
            {operations.map((op: Operation, idx) => {
              const { value, color } = getVisualAmountMeta(op, accountId); // ou current_account_id si dispo
              return (
                <Typography
                  key={idx}
                  sx={{
                    fontFamily: 'monospace',
                    color,
                    display: 'flex',
                    alignItems: 'center',
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
              <Typography sx={{ fontWeight: 700 }}>Total</Typography>
              <Typography sx={{ fontWeight: 700 }}>
                {total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </Typography>
            </Box>
          </Box>
        )}

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton size="small" onClick={reset}>
            <DeleteSweepIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};
