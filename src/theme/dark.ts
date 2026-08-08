// src\theme\dark.ts
import { createTheme, responsiveFontSizes } from '@mui/material/styles';

import {
  createSharedComponents,
  sharedRadius,
  sharedShape,
  sharedTypography,
} from './shared';
import { SURFACE, TEXT } from './tokens';

/**
 * La palette de l'application.
 *
 * Ses valeurs sont désormais **les jetons**, et non une seconde gamme posée à
 * côté d'eux : le fond de page valait `#0F0F2B` pendant que la table des
 * opérations dessinait sur `#0B0D1A`, et le décalage se voyait au bord du
 * conteneur.
 *
 * Ce qui reste dans la palette plutôt que dans les jetons, c'est ce que MUI et
 * `sunny-ui` lisent eux-mêmes : `primary`, `background`, `text`, `mode` et
 * `gradient`. Les jetons, eux, ne sont utilisables que dans un `sx`.
 */
export const darkPalette = {
  mode: 'dark' as const,
  primary: { main: '#F4B700', light: '#FFD447' },
  secondary: { main: '#8ECAE6', light: '#B2E4F3' },
  background: {
    default: SURFACE.page,
    /** Surfaces flottantes de MUI : menus, popovers, boîtes de dialogue. */
    paper: SURFACE.raised,
  },
  text: {
    primary: TEXT.title,
    secondary: TEXT.label,
  },
  divider: 'rgba(255, 255, 255, 0.07)',
  /**
   * Lu par le seul `Header` de `sunny-ui`, en fond de sa barre.
   *
   * Ramené sur la nouvelle gamme : il partait encore du bleu `#0F0F2B` de
   * l'ancien fond de page, et la barre se détachait du reste sur une teinte
   * que plus rien d'autre ne portait. Le lot suivant reprendra cette barre
   * par son `sx`.
   */
  gradient: `linear-gradient(180deg, ${SURFACE.header} 0%, ${SURFACE.page} 100%)`,
};

export const darkTheme = responsiveFontSizes(
  createTheme({
    palette: {
      ...darkPalette,
    },
    shape: sharedShape,
    radius: sharedRadius,
    typography: {
      ...sharedTypography,
      h1: { ...sharedTypography.h1, color: darkPalette.text.primary },
      body1: { ...sharedTypography.body1, color: darkPalette.text.primary },
    },
    components: {
      ...createSharedComponents(darkPalette.primary),
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: darkPalette.background.default,
          },
        },
      },
    },
  }),
);
