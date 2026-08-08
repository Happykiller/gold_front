// src/theme/shared/index.ts
import { createTheme, Components } from '@mui/material/styles';

const baseTheme = createTheme();
const { breakpoints, typography } = baseTheme;
const { pxToRem } = typography;

/**
 * Échelle de rayons de l'application, exposée en `theme.radius`.
 *
 * Il n'en existait aucune : chaque écran improvisait (`2`, `1.5`, `'16px'`,
 * `{ xs: 0, sm: 4 }`), et le résultat était un vocabulaire de formes
 * incohérent d'un écran à l'autre.
 */
export const sharedRadius = {
  /** Puces, boutons d'action, jetons de recherche. */
  sm: 3,
  /** Champs, boutons, conteneurs internes. */
  md: 4,
  /** Conteneur de page — la valeur **maximale** de l'application. */
  lg: 6,
};

/**
 * Rayon par défaut de tous les composants MUI, et de ceux de `sunny-ui` qui
 * lisent `theme.shape`.
 *
 * Il valait 10 et le plafond annoncé par l'échelle était 6 : la contradiction
 * était assumée le temps que les autres écrans migrent, puisque les ramener
 * d'un coup aurait changé leur aspect au milieu d'un chantier qui ne les
 * concernait pas. Cette condition est levée.
 */
export const sharedShape = {
  borderRadius: sharedRadius.lg,
};

export const sharedTypography = {
  fontFamily: ['Montserrat', 'Roboto', 'sans-serif'].join(','),
  h1: {
    fontFamily: 'Montserrat',
    fontWeight: 600,
    fontSize: pxToRem(28),
    lineHeight: 1.4,
    letterSpacing: '0.25px',
    [breakpoints.up('sm')]: {
      fontSize: pxToRem(32),
    },
    [breakpoints.up('md')]: {
      fontSize: pxToRem(36),
    },
  },
  body1: {
    fontFamily: 'Roboto',
    fontWeight: 400,
    fontSize: pxToRem(15),
    lineHeight: 1.6,
  },
  button: {
    fontFamily: 'Montserrat',
    fontWeight: 600,
    fontSize: pxToRem(14),
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
  },
};

export const createSharedComponents = (buttonPalette: {
  main: string;
  light: string;
}): Components => ({
  MuiButton: {
    styleOverrides: {
      root: {
        // Lu dans l'échelle, et non recopié : le doublon avait déjà divergé.
        borderRadius: sharedRadius.md,
        fontWeight: 600,
        letterSpacing: '0.05em',
        textTransform: 'none',
        paddingTop: 12,
        paddingBottom: 12,
      },
      contained: {
        backgroundColor: buttonPalette.main,
        color: '#fff',
        '&:hover': {
          backgroundColor: buttonPalette.light,
        },
      },
      outlined: {
        borderColor: buttonPalette.main,
        color: buttonPalette.main,
        '&:hover': {
          borderColor: buttonPalette.light,
          color: buttonPalette.light,
          backgroundColor: 'rgba(89,138,227,0.05)',
        },
      },
    },
  },
  MuiLink: {
    styleOverrides: {
      root: (_props: any) => {
        return {
          color: buttonPalette.main,
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
            color: buttonPalette.light,
          },
        };
      },
    },
  },
});
