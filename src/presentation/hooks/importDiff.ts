// src\presentation\hooks\importDiff.ts
import dayjs from 'dayjs';

import type { Operation } from '@presentation/hooks/useAccountOperations';
import {
  CATEGORY_OTHER,
  THIRD_OTHER_CREDIT,
  THIRD_OTHER_DEBIT,
} from '@presentation/hooks/referentialIds';
import type { BankStatementRow } from '@presentation/hooks/bankStatementParse';
import { getSignedAmount } from '@presentation/molecule/operationDisplay';

/**
 * Confrontation d'un relevé bancaire à ce que Gold contient déjà.
 *
 * Deux contraintes gouvernent tout ce fichier, et aucune n'est évidente :
 *
 * **1. La date n'est pas une clé.** `setReco` n'est pas une mutation dédiée :
 * c'est un `updateOperation` qui pose le statut *et* la date du jour. Une
 * opération déjà pointée porte donc la date de son pointage, pas celle du
 * relevé — parfois des semaines plus tard. Comparer sur la date classerait
 * « nouvelles » des opérations déjà présentes, et l'import créerait des
 * doublons. La date ne sert ici qu'à départager deux candidats équivalents.
 *
 * **2. Deux lignes identiques sont légitimes.** Un relevé porte couramment
 * deux prélèvements du même montant, le même jour, sous le même libellé. Un
 * rapprochement ensembliste en écarterait un à tort. L'appariement se fait
 * donc **par multiensemble** : une opération existante est *consommée* par la
 * ligne qu'elle explique, et ne peut plus en expliquer une seconde.
 */

/**
 * Ce que le rapprochement conclut d'une ligne.
 *
 * `uncertain` n'est pas un demi-`duplicate` : c'est le refus de trancher. Le
 * montant coïncide, le libellé non — la modale le montre et laisse choisir,
 * plutôt que de créer un doublon ou d'escamoter une opération en silence.
 */
export type ImportVerdict = 'new' | 'duplicate' | 'uncertain';

export type DiffedRow = {
  row: BankStatementRow;
  verdict: ImportVerdict;
  /** L'opération existante la plus proche — `null` pour une ligne nouvelle. */
  match: Operation | null;
  /** Similarité du libellé avec `match`, dans `[0, 1]`. */
  score: number;
};

/**
 * Au-delà, deux libellés désignent le même mouvement.
 *
 * 0,7 sur le coefficient de Dice : `HELLOFRESH FR FR NEUILLY` et
 * `HELLOFRESH FRANFR NEUILLY SUR` se rejoignent, `MC DONALD'S` et `MCDO`
 * restent séparés — et c'est voulu, l'utilisateur tranche.
 */
export const DUPLICATE_THRESHOLD = 0.7;

/**
 * Forme comparable d'un libellé.
 *
 * Les relevés mélangent casse, accents et ponctuation d'un mois sur l'autre
 * pour un même commerçant. Tout ce qui n'est pas lettre ou chiffre devient une
 * césure : `FR.HOTELS.CO` et `FR HOTELS CO` doivent se ressembler.
 */
export function normalizeLabel(label: string | null | undefined): string {
  return (label ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

/**
 * Coefficient de Dice sur les bigrammes de caractères.
 *
 * Préféré à une distance d'édition : il ignore l'ordre des blocs, ce qui
 * convient à des libellés où la banque déplace la ville, le pays ou un numéro
 * de contrat. Écrit ici plutôt qu'importé — quinze lignes ne justifient pas
 * une dépendance de plus dans le bundle.
 */
export function similarity(left: string, right: string): number {
  if (!left || !right) return 0;
  if (left === right) return 1;
  // En deçà de deux caractères il n'existe aucun bigramme : sans ce cas, deux
  // libellés d'une lettre auraient un score de 0 même identiques.
  if (left.length < 2 || right.length < 2) return left === right ? 1 : 0;

  const bigrams = new Map<string, number>();
  for (let i = 0; i < left.length - 1; i += 1) {
    const bigram = left.slice(i, i + 2);
    bigrams.set(bigram, (bigrams.get(bigram) ?? 0) + 1);
  }

  let shared = 0;
  for (let i = 0; i < right.length - 1; i += 1) {
    const bigram = right.slice(i, i + 2);
    const count = bigrams.get(bigram) ?? 0;
    if (count > 0) {
      bigrams.set(bigram, count - 1);
      shared += 1;
    }
  }

  return (2 * shared) / (left.length - 1 + (right.length - 1));
}

/**
 * Ressemblance d'une ligne de relevé avec une opération enregistrée.
 *
 * Les deux libellés du relevé sont essayés et le meilleur l'emporte : rien ne
 * dit lequel a servi aux opérations déjà saisies. L'extension navigateur qui
 * les alimentait pouvait prendre l'un comme l'autre, et l'utilisateur a pu
 * retoucher la description à la main.
 */
export function rowSimilarity(row: BankStatementRow, operation: Operation) {
  const target = normalizeLabel(operation.description);
  return Math.max(
    similarity(normalizeLabel(row.description), target),
    similarity(normalizeLabel(row.rawLabel), target),
  );
}

/** Centimes entiers : `0.1 + 0.2 !== 0.3` interdit de comparer des euros. */
const cents = (amount: number) => Math.round(amount * 100);

/** Écart en jours entre une ligne (`YYYY-MM-DD`) et une opération (epoch ms). */
function dayGap(row: BankStatementRow, operation: Operation): number {
  return Math.abs(
    dayjs(row.date).diff(dayjs(parseInt(operation.date, 10)), 'day'),
  );
}

/**
 * Classe chaque ligne du relevé face aux opérations déjà enregistrées.
 *
 * Le **montant signé est une condition stricte** : deux opérations de montants
 * différents ne sont jamais le même mouvement, quelle que soit la ressemblance
 * des libellés. C'est ce qui rend le rapprochement sûr malgré une comparaison
 * de texte approximative.
 *
 * `existing` doit avoir été chargé depuis une date antérieure à la plus
 * ancienne ligne du fichier : la borne temporelle est posée au chargement, pas
 * ici. Sans borne haute, en revanche — une opération pointée a pu migrer
 * jusqu'à aujourd'hui.
 */
export function diffBankStatement(
  rows: BankStatementRow[],
  existing: Operation[],
  currentAccountId: number,
): DiffedRow[] {
  const consumed = new Set<number>();

  // Le relevé est parcouru du plus ancien au plus récent pour que le résultat
  // ne dépende pas de l'ordre du fichier : deux lignes jumelles consomment
  // alors les candidats dans un ordre reproductible. Ce sont les *indices* qui
  // sont triés, de sorte que l'ordre du fichier — celui que l'utilisateur
  // relira — soit restitué sans avoir à retrouver chaque ligne ensuite.
  const order = rows
    .map((_, index) => index)
    .sort((a, b) => rows[a].date.localeCompare(rows[b].date));
  const verdicts: DiffedRow[] = new Array(rows.length);

  for (const index of order) {
    const row = rows[index];
    const candidates = existing
      .filter(
        (operation) =>
          !consumed.has(operation.id) &&
          cents(getSignedAmount(operation, currentAccountId)) ===
            cents(row.amount),
      )
      .map((operation) => ({
        operation,
        score: rowSimilarity(row, operation),
        gap: dayGap(row, operation),
      }))
      // À score égal, la plus proche en date l'emporte : sur un abonnement
      // mensuel au libellé constant, c'est le seul critère qui distingue la
      // ligne de juillet de celle d'août.
      .sort((a, b) => b.score - a.score || a.gap - b.gap);

    const best = candidates[0];

    if (!best) {
      verdicts[index] = { row, verdict: 'new', match: null, score: 0 };
      continue;
    }

    if (best.score >= DUPLICATE_THRESHOLD) {
      // Consommée : elle n'expliquera pas une seconde ligne du relevé.
      consumed.add(best.operation.id);
      verdicts[index] = {
        row,
        verdict: 'duplicate',
        match: best.operation,
        score: best.score,
      };
      continue;
    }

    // Incertaine : le candidat est montré, **jamais consommé**. Rien n'est
    // décidé, donc rien n'est retiré du jeu pour les lignes suivantes.
    verdicts[index] = {
      row,
      verdict: 'uncertain',
      match: best.operation,
      score: best.score,
    };
  }

  return verdicts;
}

/**
 * Catégorie et tiers recopiés de l'opération passée la plus ressemblante.
 *
 * L'historique est déjà en mémoire pour le rapprochement : la suggestion ne
 * coûte qu'un parcours de plus. Elle ne s'appuie que sur des choix que
 * l'utilisateur a lui-même faits — la colonne `Categorie` du relevé est
 * ignorée, les nomenclatures de la banque et de Gold ne se recouvrant pas.
 *
 * Sous le seuil, on retombe sur le classement de repli du référentiel —
 * « Autre » et le tiers créditeur ou débiteur selon le sens — plutôt que sur
 * des champs vides. C'est un choix de l'utilisateur : une opération non
 * classée n'apporte rien de plus qu'une opération classée « Autre », et le
 * repli lui évite d'avoir à renseigner deux champs sur chaque ligne inédite.
 *
 * Ce repli n'est **jamais** une déduction déguisée : il ne dit rien de plus
 * que « on ne sait pas ». Ce qui vient de l'historique, lui, vient toujours
 * d'un classement que l'utilisateur a fait lui-même.
 */
export function suggestClassification(
  row: BankStatementRow,
  existing: Operation[],
): { category_id: number; third_id: number } {
  let best: { operation: Operation; score: number } | null = null;

  for (const operation of existing) {
    // Une opération sans classement n'a rien à transmettre.
    if (!operation.category_id && !operation.third_id) continue;

    const score = rowSimilarity(row, operation);
    if (score >= DUPLICATE_THRESHOLD && (!best || score > best.score)) {
      best = { operation, score };
    }
  }

  return {
    category_id: best?.operation.category_id ?? CATEGORY_OTHER,
    third_id:
      best?.operation.third_id ??
      (row.amount < 0 ? THIRD_OTHER_DEBIT : THIRD_OTHER_CREDIT),
  };
}

/** Une ligne prête pour la modale : verdict et suggestion en une passe. */
export type AnalysedRow = DiffedRow & {
  suggestion: { category_id: number | null; third_id: number | null };
};

/**
 * Le point d'entrée de la modale.
 *
 * La suggestion n'est calculée que pour ce qui sera créé : une ligne déjà
 * présente n'a pas de classement à proposer, elle en a déjà un.
 */
export function analyseImport(
  rows: BankStatementRow[],
  existing: Operation[],
  currentAccountId: number,
): AnalysedRow[] {
  return diffBankStatement(rows, existing, currentAccountId).map((diffed) => ({
    ...diffed,
    suggestion:
      diffed.verdict === 'duplicate'
        ? { category_id: null, third_id: null }
        : suggestClassification(diffed.row, existing),
  }));
}
