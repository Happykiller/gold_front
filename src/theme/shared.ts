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

/**
 * Taille des étiquettes de champ. Sortie en constante parce que **trois** règles
 * doivent tomber dessus : l'étiquette elle-même, l'encoche du champ `outlined`
 * qui doit faire exactement la largeur du texte, et le décalage vertical qui
 * l'amène dedans.
 */
const LABEL_FONT_SIZE = 13;

/** Taille des messages sous les champs (aide, erreur de saisie). */
const HELPER_FONT_SIZE = 11.5;

/** Espace entre le bas d'un champ et son message. */
const HELPER_GAP = 3;

/**
 * Gouttière qu'une ligne de formulaire doit garder sous ses champs pour leurs
 * messages, qui sont rendus hors du flux (cf. `MuiFormHelperText` plus bas).
 *
 * `1.66` est le `lineHeight` par défaut de `caption`, dont hérite le message.
 */
export const HELPER_GUTTER = Math.ceil(HELPER_FONT_SIZE * 1.66) + HELPER_GAP;

/**
 * Géométrie d'un champ `outlined`, dont l'étiquette vit **hors du flux**.
 *
 * Le projet est en `standard` partout, sauf deux endroits qu'il ne choisit pas :
 * le graphique, et surtout le composant `Input` de `@happykiller/sunny-ui`, qui
 * écrit `variant="outlined"` en dur *après* le spread de ses props — donc
 * insurchargeable depuis un appelant. Il sert le montant et la description de
 * six écrans, plus les écrans du socle (connexion, profil). Le thème doit donc
 * savoir rendre l'`outlined` correctement, faute de pouvoir l'éviter.
 *
 * Deux défauts, tous deux invisibles pour le typage, le lint, les tests et le
 * build — et trouvés sur une capture d'écran de `operation_new` :
 *
 * 1. **L'étiquette réduite ne réserve aucune place.** Elle est en
 *    `position: absolute` et remonte au-dessus du champ ; le trait du cadre en
 *    fait autant, de 5px. `FormSection` n'espace ses lignes que de 6px et deux
 *    `FormSection` successifs se touchent : l'étiquette « Description » venait
 *    donc se poser SUR le champ « Montant » de la section du dessus.
 * 2. **L'étiquette ne tombait plus dans son encoche.** MUI code son décalage en
 *    dur (`translate(14px, -9px)`), calibré pour une étiquette de 16px ; le
 *    thème les met à 13px, ce qui raccourcit la boîte de 4px et la laissait
 *    2,5px trop haut. L'encoche, elle, se dimensionne sur la taille du *champ*
 *    (14px) et non de l'étiquette : le trou était 13px plus large que le texte.
 *
 * D'où les valeurs ci-dessous, dérivées et non devinées.
 */
export const OUTLINED = {
  /** Place rendue au-dessus du champ, celle que l'étiquette occupe hors du flux. */
  reserve: 9,
  /** Ce dont MUI remonte le cadre au-dessus du champ (`top: -5px` du fieldset). */
  outlineRise: 5,
  /** Hauteur de l'encoche, codée en dur par MUI sur le `legend` réduit. */
  notchHeight: 11,
  /** Facteur de réduction de l'étiquette, codé en dur par MUI. */
  shrinkScale: 0.75,
  /** `lineHeight` de `InputLabel`, en em. */
  labelLineHeight: 1.4375,
};

/** Hauteur réelle de l'étiquette réduite, une fois la mise à l'échelle appliquée. */
const shrunkLabelHeight =
  LABEL_FONT_SIZE * OUTLINED.labelLineHeight * OUTLINED.shrinkScale;

/**
 * Décalage vertical de l'étiquette réduite : sa boîte doit être centrée sur le
 * **milieu de l'encoche**, pas sur le trait — c'est ce que fait MUI par défaut,
 * à 0,9px près.
 */
export const outlinedShrunkLabelOffset =
  OUTLINED.reserve -
  OUTLINED.outlineRise +
  OUTLINED.notchHeight / 2 -
  shrunkLabelHeight / 2;

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
        // La place de l'étiquette, qui est hors du flux et ne la demande donc à
        // personne. Sans elle, elle se sert sur le champ du dessus — cf. OUTLINED.
        //
        // Conditionnée au frère qui précède : un champ sans étiquette n'a rien à
        // réserver, et MUI rend toujours l'étiquette juste avant le champ.
        'label + &': {
          marginTop: OUTLINED.reserve,
        },
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
      // L'encoche mesure sa largeur sur la taille de police du `fieldset`, qui
      // hérite de celle du champ (14px) et non de celle de l'étiquette : le trou
      // était plus large que le texte qu'il doit dégager.
      notchedOutline: {
        fontSize: LABEL_FONT_SIZE,
      },
    },
  },
  MuiInputLabel: {
    styleOverrides: {
      // Ciblé par sa classe et non par l'emplacement `outlined` : un emplacement
      // que le composant ne câble pas ne produit rien, en silence (cf.
      // docs/KB/DAT/interface-mui.md).
      root: {
        '&.MuiInputLabel-outlined': {
          // Champ vide et non focalisé : l'étiquette est DEDANS, et le champ
          // vient d'être poussé de `reserve`. `top: 50%` porte sur le conteneur
          // entier (réserve + champ) ; la moitié de la réserve ramène le centre
          // sur celui du champ seul. Aucune hauteur de champ n'est écrite ici —
          // `sunny-ui` fixe la sienne par un padding, le graphique la sienne.
          top: `calc(50% + ${OUTLINED.reserve / 2}px)`,
          transform: 'translate(14px, -50%)',
          '&.MuiInputLabel-shrink': {
            top: 0,
            transform: `translate(14px, ${outlinedShrunkLabelOffset}px) scale(${OUTLINED.shrinkScale})`,
          },
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
        fontSize: HELPER_FONT_SIZE,
        marginLeft: 0,
        '&.Mui-error': { color: AMOUNT.debit },
        // Hors du flux, sous le champ. Un message qui compte dans la hauteur de
        // son conteneur fait deux dégâts : il pousse la ligne quand il apparaît,
        // et il désaligne durablement le champ qui le réserve — c'est ce qui
        // mettait le taux de TVA 22px plus haut que le montant et la date, la
        // grille de `FormSection` alignant des boîtes par le bas et non des
        // champs. `FormControl` étant déjà `position: relative`, il suffit de
        // l'en sortir ; `FormSection` réserve la gouttière correspondante.
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        marginTop: HELPER_GAP,
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
