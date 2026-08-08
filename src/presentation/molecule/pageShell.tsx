// src\presentation\molecule\pageShell.tsx
import * as React from 'react';
import { Box, Typography } from '@mui/material';

import { LINE, SURFACE, TEXT } from '@src/theme/tokens';
import { APP_MAX_WIDTH } from '@presentation/molecule/appLayout';

type Props = {
  /** Titre de l'écran. Omis, l'en-tête n'est pas rendu du tout. */
  title?: React.ReactNode;
  /** Actions alignées à droite du titre. */
  actions?: React.ReactNode;
  /**
   * Un écran de saisie tient dans une colonne étroite ; une liste prend toute
   * la largeur. C'est la seule variation admise.
   */
  width?: 'form' | 'full';
  /** Sans cadre : l'écran fournit lui-même son conteneur. */
  bare?: boolean;
  children: React.ReactNode;
};

/** Un formulaire au-delà de cette largeur devient pénible à parcourir. */
const FORM_WIDTH = 720;

/**
 * Le cadre commun à tous les écrans.
 *
 * Il remplace trois gestes recopiés six fois chacun : un conteneur centré, une
 * carte cerclée d'or avec un halo de 32 px, et un titre en `h6` gras centré.
 * Les six exemplaires avaient déjà divergé — cinq largeurs maximales
 * différentes, deux avec un `100vh` fautif, quatre avec une prop `color` qui
 * n'appliquait rien.
 *
 * Le bloc se délimite par un filet de 1 px. Le halo doré a disparu : l'or
 * désigne une action, il ne fait pas léviter un conteneur.
 */
export const PageShell: React.FC<Props> = ({
  title,
  actions,
  width = 'form',
  bare = false,
  children,
}) => (
  <Box
    sx={{
      width: '100%',
      maxWidth: width === 'form' ? FORM_WIDTH : APP_MAX_WIDTH,
      mx: 'auto',
      // Le conteneur du layout est un flex en colonne avec
      // `justifyContent: center` : un écran court dérive donc vers le milieu de
      // la fenêtre. On ne peut pas le corriger depuis le thème — c'est écrit
      // en `sx` dans la bibliothèque — mais une marge basse automatique absorbe
      // l'espace libre et gagne sur `justify-content`. `alignSelf` serait sans
      // effet : il porte sur l'axe transversal, donc horizontal ici.
      mb: 'auto',
    }}
  >
    {title && (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          minHeight: 52,
          px: bare ? 0 : '20px',
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
          }}
        >
          {title}
        </Typography>
        {actions && (
          <Box
            sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}
          >
            {actions}
          </Box>
        )}
      </Box>
    )}
    {bare ? (
      children
    ) : (
      <Box
        sx={(theme) => ({
          background: SURFACE.header,
          border: { xs: 'none', sm: LINE.block },
          borderRadius: { xs: 0, sm: `${theme.radius.lg}px` },
          p: { xs: '16px', sm: '20px' },
        })}
      >
        {children}
      </Box>
    )}
  </Box>
);
