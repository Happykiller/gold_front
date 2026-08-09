// src/theme/tokens.ts

/**
 * Jetons visuels de l'écran compte.
 *
 * Des constantes exportées plutôt que des entrées de palette, pour trois
 * raisons :
 *
 * 1. cette gamme est **sombre uniquement**, alors que l'application a un thème
 *    clair actif. L'y verser donnerait des couleurs justes dans un mode et
 *    fausses dans l'autre ;
 * 2. l'écran compte était déjà entièrement écrit en hexadécimaux en dur — les
 *    rassembler ici est un gain net, sans régression de thème ;
 * 3. un jeton n'est utilisable que dans `sx`, donc hors d'atteinte de la prop
 *    `color=` de MUI, qui n'accepte que des clés de palette et **n'applique
 *    rien, en silence**, sur une valeur hexadécimale.
 *
 * Contrepartie assumée : en thème clair, l'écran compte reste sombre. Le
 * rendre bicolore est un chantier à part — mais il commence ici, ces jetons
 * étant désormais le seul endroit à toucher.
 */

/** Échelle de gris du texte, du plus lisible au plus effacé. */
export const TEXT = {
  /** Ligne survolée ou sélectionnée. */
  hover: '#FFFFFF',
  /** Titres et montants neutres. */
  title: '#E8EAF2',
  /** Description d'une opération. */
  description: '#DDE1EC',
  /** Libellés secondaires. */
  label: '#8A90A6',
  /** En-têtes de colonne, méta. */
  meta: '#6D7490',
  /** Aides, compteurs, chevrons. */
  tertiary: '#5D6478',
  /** Identifiant d'opération : présent, mais silencieux. */
  id: '#454B5E',
  /** Tiers. */
  third: '#636A80',
  /** Sur fond doré — le seul endroit où le texte est sombre. */
  onAccent: '#181203',
};

/**
 * Sémantique des montants. Le sens de lecture est porté par la couleur : ce
 * qui entre est vert, ce qui sort est rouge, un mouvement interne est violet.
 */
export const AMOUNT = {
  credit: '#34C97B',
  debit: '#F2635B',
  /** Virement émis — un mouvement entre deux comptes à soi. */
  regulation: '#B08BE0',
  /** Virement reçu, et libellé du compte de destination. */
  destination: '#8ECAE6',
  /** Type inconnu : on n'invente pas un sens. */
  neutral: '#9AA0B4',
};

/** Fonds. Les blocs sont délimités par des filets, jamais par une ombre. */
export const SURFACE = {
  page: '#0B0D1A',
  header: '#0D1120',
  /** Bandeau de séparation de jour. */
  band: '#0F1322',
  rowHover: '#12172A',
  /**
   * Surface flottante — menu, infobulle, calculatrice, boîte de dialogue.
   *
   * Nettement plus claire que la page : c'est elle qui dit « ceci passe
   * au-dessus », à la place de l'ombre portée dorée qu'on a retirée.
   */
  raised: '#141A2E',
  /** Champ de saisie. */
  field: '#101425',
  /** Champ inactif : présent, mais visiblement hors service. */
  disabled: 'rgba(255, 255, 255, 0.03)',
  /** Fond discret d'une puce ou d'un bouton d'action. */
  chip: 'rgba(255, 255, 255, 0.05)',
  action: 'rgba(255, 255, 255, 0.07)',
};

/** Filets. Un bloc se délimite par un trait de 1 px, pas par un halo. */
export const LINE = {
  /** Contour d'un conteneur. */
  block: '1px solid rgba(255, 255, 255, 0.07)',
  /** Séparateur entre deux lignes : plus discret encore. */
  row: '1px solid rgba(255, 255, 255, 0.04)',
  /** Filet du bandeau de jour. */
  band: 'rgba(255, 255, 255, 0.05)',
  /** Bordure d'un champ de saisie. */
  field: '1px solid rgba(255, 255, 255, 0.09)',
  /** Le même champ survolé : il répond, sans crier. */
  fieldHover: '1px solid rgba(255, 255, 255, 0.16)',
};

/**
 * Fonds des messages d'état.
 *
 * Teintés à 12 % de leur couleur sémantique plutôt que pleins : un bandeau
 * d'alerte opaque écrase tout ce qui l'entoure, alors qu'il n'est presque
 * jamais l'objet de l'écran.
 */
export const STATE = {
  errorBg: 'rgba(242, 99, 91, 0.12)',
  warningBg: 'rgba(244, 183, 0, 0.12)',
  successBg: 'rgba(52, 201, 123, 0.12)',
  infoBg: 'rgba(142, 202, 230, 0.12)',
  /**
   * Les mêmes teintes, pleines, pour le texte posé sur ces fonds.
   *
   * Un fond à 12 % ne suffit pas à porter un sens : sur `warningBg`, un
   * libellé en gris de méta se lit comme n'importe quelle ligne. Seul
   * l'avertissement manquait à la gamme des montants — `error` et `success`
   * y renvoient plutôt que d'introduire deux verts et deux rouges voisins.
   */
  warning: '#F4B700',
  error: '#F2635B',
  success: '#34C97B',
};

/**
 * Élévation d'une surface flottante.
 *
 * Une ombre noire portée, et non le halo doré de 32 px de l'ancien langage :
 * l'or sert à désigner une action, pas à faire léviter un conteneur.
 */
export const SHADOW = {
  raised: '0 8px 24px rgba(0, 0, 0, 0.45)',
};

/**
 * Chasse fixe pour tout ce qui est chiffré — identifiants, montants, soldes,
 * compteurs. La pile système reste derrière, au cas où la police ne se
 * chargerait pas : sans elle, l'échec serait une chasse proportionnelle et des
 * colonnes qui ne s'alignent plus.
 */
export const MONO_FONT =
  '"Roboto Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';
