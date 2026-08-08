// src/theme/highcharts.ts
import { AMOUNT, LINE, MONO_FONT, SHADOW, SURFACE, TEXT } from './tokens';

/**
 * Palette catégorielle des séries.
 *
 * Distincte de la sémantique des montants : ici les couleurs ne veulent rien
 * dire, elles séparent des comptes. Elles sont choisies pour rester
 * distinguables à faible opacité, puisque les aires sont empilées et remplies
 * à 30 %.
 */
export const CHART_SERIES = [
  '#8ECAE6',
  '#34C97B',
  '#B08BE0',
  '#F4B700',
  '#F2635B',
  '#7FB3D5',
  '#4DB6AC',
  '#FF9E6D',
];

/**
 * Le thème du graphique de trésorerie.
 *
 * Highcharts n'en avait **aucun** : il rendait avec ses défauts, conçus pour
 * un fond blanc. La série cumulée était tracée en `#000000` sur fond sombre et
 * ses marqueurs en blanc — donc invisible, sauf ses points.
 *
 * Fusionné dans les options plutôt que posé par `Highcharts.setOptions` : un
 * réglage global s'appliquerait aussi à tout graphique futur sans que
 * personne ne l'ait demandé, et il est plus difficile à retrouver.
 */
export const chartTheme = {
  chart: {
    backgroundColor: 'transparent',
    style: { fontFamily: 'Roboto, sans-serif' },
    spacing: [8, 0, 8, 0],
  },
  title: { style: { color: TEXT.title, fontSize: '14px', fontWeight: '600' } },
  subtitle: { style: { color: TEXT.meta } },
  colors: CHART_SERIES,
  xAxis: {
    lineColor: LINE.band,
    tickColor: LINE.band,
    gridLineColor: 'rgba(255, 255, 255, 0.04)',
    labels: { style: { color: TEXT.meta, fontSize: '10px' } },
    title: { style: { color: TEXT.label } },
  },
  yAxis: {
    gridLineColor: 'rgba(255, 255, 255, 0.06)',
    lineColor: LINE.band,
    labels: {
      style: { color: TEXT.meta, fontSize: '10px', fontFamily: MONO_FONT },
    },
    title: { style: { color: TEXT.label } },
  },
  legend: {
    itemStyle: { color: TEXT.label, fontWeight: '400', fontSize: '11.5px' },
    itemHoverStyle: { color: TEXT.hover },
    itemHiddenStyle: { color: TEXT.id },
  },
  tooltip: {
    backgroundColor: SURFACE.raised,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 6,
    shadow: { color: SHADOW.raised },
    style: { color: TEXT.description, fontSize: '11.5px' },
  },
  credits: { enabled: false },
};

/**
 * La série de cumul, tracée par-dessus la pile.
 *
 * Elle doit se lire comme un trait de référence, pas comme un compte de plus :
 * d'où le blanc cassé des titres plutôt qu'une couleur de la palette.
 */
export const chartSumSeriesStyle = {
  color: TEXT.title,
  lineWidth: 2,
  marker: { lineWidth: 2, lineColor: TEXT.title, fillColor: SURFACE.page },
  zIndex: 10,
};

/** Couleur d'un solde, quand une série porte un sens. */
export const chartBalanceColor = {
  reconciled: AMOUNT.credit,
  projected: AMOUNT.destination,
};
