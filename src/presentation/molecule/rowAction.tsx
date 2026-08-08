// src\presentation\molecule\rowAction.tsx
import * as React from 'react';
import { Box, Tooltip } from '@mui/material';

import { SURFACE, TEXT } from '@src/theme/tokens';

type Props = {
  /** Nom accessible et contenu de l'infobulle. */
  label: string;
  icon: React.ReactNode;
  /** Texte visible à côté de l'icône, quand le bouton doit se lire. */
  text?: React.ReactNode;
  onClick: (event: React.MouseEvent) => void;
};

/**
 * Un bouton d'action discret, sur fond de surface.
 *
 * Sans badge de raccourci : le `E` accolé au crayon n'apprenait rien que
 * l'infobulle ne dise mieux, et doublait la largeur du bouton. Le seul
 * raccourci qui vaut d'être affiché est rappelé une fois, dans la légende de
 * la liste.
 */
export const RowAction: React.FC<Props> = ({ label, icon, text, onClick }) => (
  <Tooltip title={label} placement="top">
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
        maxWidth: 260,
        borderRadius: `${theme.radius.sm}px`,
        background: SURFACE.action,
        color: TEXT.label,
        '& .MuiSvgIcon-root': { fontSize: 13 },
        '&:hover': { color: TEXT.title },
      })}
    >
      {icon}
      {text && (
        <Box
          component="span"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {text}
        </Box>
      )}
    </Box>
  </Tooltip>
);
