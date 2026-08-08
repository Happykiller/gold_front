// src/theme/shared.ts
import { createTheme, Components } from '@mui/material/styles';

import { AMOUNT, LINE, SHADOW, STATE, SURFACE, TEXT } from './tokens';

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
        // Sombre sur fond doré. Le blanc précédent passait le contraste de
        // justesse en théorie et se lisait mal en pratique.
        color: TEXT.onAccent,
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
          // Teinte de la couleur du bouton, et non le bleu d'une palette
          // abandonnée qui traînait ici depuis.
          backgroundColor: SURFACE.chip,
        },
      },
      text: {
        color: TEXT.title,
        '&:hover': { backgroundColor: SURFACE.chip },
      },
      sizeSmall: { paddingTop: 6, paddingBottom: 6 },
    },
  },
  MuiLink: {
    styleOverrides: {
      root: {
        color: buttonPalette.main,
        textDecoration: 'none',
        '&:hover': {
          textDecoration: 'underline',
          color: buttonPalette.light,
        },
      },
    },
  },

  /**
   * Champs de saisie.
   *
   * Les écrans utilisent deux variantes concurrentes — `standard` pour les
   * sélecteurs, `outlined` pour le graphique — et les deux doivent tomber sur
   * la même surface. On règle donc les deux ici plutôt que d'imposer une
   * variante unique, qui obligerait à toucher chaque appelant.
   */
  MuiInputBase: {
    styleOverrides: {
      root: {
        color: TEXT.title,
        fontSize: 14,
        '&.Mui-disabled': { backgroundColor: SURFACE.disabled },
      },
      input: {
        '&::placeholder': { color: TEXT.tertiary, opacity: 1 },
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        backgroundColor: SURFACE.field,
        borderRadius: sharedRadius.md,
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: 'rgba(255, 255, 255, 0.09)',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: 'rgba(255, 255, 255, 0.16)',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderWidth: 1,
          borderColor: buttonPalette.main,
        },
        '&.Mui-error .MuiOutlinedInput-notchedOutline': {
          borderColor: AMOUNT.debit,
        },
      },
    },
  },
  MuiInput: {
    styleOverrides: {
      root: {
        '&:before': { borderBottom: LINE.field },
        '&:hover:not(.Mui-disabled, .Mui-error):before': {
          borderBottom: LINE.fieldHover,
        },
        '&:after': { borderBottomColor: buttonPalette.main },
      },
    },
  },
  MuiFormLabel: {
    styleOverrides: {
      root: {
        color: TEXT.label,
        fontSize: 13,
        '&.Mui-focused': { color: buttonPalette.main },
        '&.Mui-error': { color: AMOUNT.debit },
      },
    },
  },
  MuiFormHelperText: {
    styleOverrides: {
      root: {
        color: TEXT.meta,
        fontSize: 11.5,
        marginLeft: 0,
        '&.Mui-error': { color: AMOUNT.debit },
      },
    },
  },
  MuiSelect: {
    styleOverrides: {
      icon: { color: TEXT.meta },
    },
  },

  /**
   * Surfaces flottantes.
   *
   * `Paper` porte les menus, les popovers et les boîtes de dialogue, y compris
   * ceux de `sunny-ui`. Une ombre noire et un filet de 1 px les détachent de
   * la page, là où l'ancien langage employait un halo doré.
   */
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        borderRadius: sharedRadius.lg,
      },
      elevation1: { boxShadow: SHADOW.raised },
      elevation8: { boxShadow: SHADOW.raised },
    },
  },
  MuiMenu: {
    styleOverrides: {
      paper: {
        backgroundColor: SURFACE.raised,
        border: LINE.block,
        boxShadow: SHADOW.raised,
      },
      list: { paddingTop: 4, paddingBottom: 4 },
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: {
        fontSize: 13.5,
        color: TEXT.description,
        minHeight: 34,
        '&:hover': { backgroundColor: SURFACE.rowHover },
        '&.Mui-selected': { backgroundColor: SURFACE.chip },
        '&.Mui-selected:hover': { backgroundColor: SURFACE.rowHover },
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        backgroundColor: SURFACE.raised,
        border: LINE.block,
        borderRadius: sharedRadius.md,
        color: TEXT.description,
        fontSize: 11.5,
        fontWeight: 400,
        boxShadow: SHADOW.raised,
      },
      arrow: { color: SURFACE.raised },
    },
  },

  /**
   * Messages d'état.
   *
   * Fond teinté à 12 % plutôt que plein : une alerte opaque écrase tout ce qui
   * l'entoure alors qu'elle n'est presque jamais l'objet de l'écran.
   */
  MuiAlert: {
    styleOverrides: {
      // Les sévérités sont ciblées par leur classe depuis `root`, et non par
      // un emplacement dédié : l'`overridesResolver` d'`Alert` ne transmet que
      // `root` et la variante. Les clés `colorError` et consorts existent bien
      // comme noms de classe, mais rien ne les branche — un override écrit là
      // ne produit **aucune règle**, sans le moindre signal.
      root: {
        borderRadius: sharedRadius.md,
        fontSize: 13.5,
        border: LINE.block,
        alignItems: 'center',
        '&.MuiAlert-colorError': {
          backgroundColor: STATE.errorBg,
          color: AMOUNT.debit,
        },
        '&.MuiAlert-colorWarning': {
          backgroundColor: STATE.warningBg,
          color: buttonPalette.main,
        },
        '&.MuiAlert-colorSuccess': {
          backgroundColor: STATE.successBg,
          color: AMOUNT.credit,
        },
        '&.MuiAlert-colorInfo': {
          backgroundColor: STATE.infoBg,
          color: AMOUNT.destination,
        },
      },
      icon: { opacity: 1 },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: { borderRadius: sharedRadius.sm, fontSize: 12, height: 22 },
      outlined: { borderColor: 'rgba(255, 255, 255, 0.12)' },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        color: TEXT.label,
        borderRadius: sharedRadius.md,
        '&:hover': { backgroundColor: SURFACE.chip, color: TEXT.title },
      },
    },
  },
  MuiDivider: {
    styleOverrides: {
      root: { borderColor: 'rgba(255, 255, 255, 0.07)' },
    },
  },

  /**
   * Barre de navigation de `sunny-ui`.
   *
   * Sa `Toolbar` est le seul élément de l'en-tête qu'aucun `sx` ne verrouille :
   * c'est donc d'ici, et de nulle part ailleurs, qu'on règle sa hauteur.
   */
  MuiToolbar: {
    styleOverrides: {
      root: {
        minHeight: 56,
        [breakpoints.up('sm')]: { minHeight: 56 },
      },
    },
  },
});
