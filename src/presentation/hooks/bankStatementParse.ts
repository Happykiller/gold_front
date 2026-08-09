// src\presentation\hooks\bankStatementParse.ts

/**
 * Lecture d'un export CSV de relevé bancaire.
 *
 * Module **pur** : il ne connaît ni React, ni Gold, ni les identifiants de
 * référentiel. Il traduit un fichier de banque en lignes neutres, et c'est
 * `importDiff` puis la modale qui décident ce qu'on en fait. C'est ce qui rend
 * la partie la plus fragile de l'import — la lecture d'un format qu'on ne
 * maîtrise pas — testable sans monter un écran.
 *
 * Format de référence : export BPCE, séparateur `;`, fins de ligne CRLF, une
 * ligne d'en-tête, treize colonnes, une ligne vide en fin de fichier.
 */

/** Le libellé retenu pour la description, et celui du relevé brut. */
export type BankStatementRow = {
  /** `YYYY-MM-DD`, le format qu'attend `createOperation`. */
  date: string;
  /** `Libelle simplifie` — deviendra la description de l'opération Gold. */
  description: string;
  /**
   * `Libelle operation` — le libellé brut du relevé.
   *
   * Conservé bien qu'inutilisé à la création : le rapprochement teste les deux
   * libellés, car rien ne garantit lequel a servi aux opérations déjà saisies.
   */
  rawLabel: string;
  /** Signé : négatif au débit, positif au crédit. */
  amount: number;
  /**
   * `Reference` — identifiant de transaction, unique dans le fichier.
   *
   * Il ferait une clé de déduplication parfaite si Gold le stockait ; il ne le
   * stocke pas. Il ne sert donc qu'à l'intérieur du fichier : identité stable
   * d'une ligne pour React, et détection d'un doublon intra-fichier.
   */
  reference: string;
  /** `Type operation` tel que la banque le nomme : `Carte bancaire`, `Virement`… */
  bankType: string;
  /** Numéro de ligne dans le fichier, en-tête comprise — pour les messages. */
  line: number;
};

/** Une ligne que le parseur a refusée, et pourquoi. */
export type SkippedLine = {
  line: number;
  reason: 'date' | 'amount';
  /** Le contenu fautif, tel quel, pour que le message soit vérifiable. */
  value: string;
};

export type BankStatementParseResult =
  | { ok: true; rows: BankStatementRow[]; skipped: SkippedLine[] }
  | { ok: false; error: 'empty' | 'missing-columns'; columns: string[] };

/**
 * Les colonnes dont l'import a besoin, sous leur forme normalisée.
 *
 * La date de l'opération est préférée à celle de comptabilisation : elles ne
 * diffèrent qu'en bord de mois — des frais du 31/07 comptabilisés le 01/08 —
 * et c'est la date de l'opération qui a un sens pour l'utilisateur.
 */
const COLUMNS = {
  date: 'date operation',
  dateFallback: 'date de comptabilisation',
  description: 'libelle simplifie',
  rawLabel: 'libelle operation',
  reference: 'reference',
  bankType: 'type operation',
  debit: 'debit',
  credit: 'credit',
} as const;

/**
 * Forme comparable d'un intitulé de colonne : minuscules, sans accents, sans
 * espaces superflus.
 *
 * L'export observé est en ASCII pur — `Libelle simplifie`, sans accent — mais
 * rien ne dit que la banque ne livrera pas un jour `Libellé simplifié`. Le
 * coût de la tolérance est de trois lignes ; celui de l'intolérance serait un
 * import qui refuse un fichier valide.
 */
function normalizeHeader(header: string): string {
  return header
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Découpe une ligne CSV en respectant les guillemets.
 *
 * Aucun champ quoté n'apparaît dans l'export observé, et un simple `split(';')`
 * suffirait aujourd'hui. Mais un libellé de commerçant est une chaîne libre :
 * le jour où l'un d'eux contient un point-virgule, un `split` naïf décalerait
 * toutes les colonnes suivantes — et le montant lu serait celui d'une autre
 * colonne, sans que rien ne le signale.
 */
function splitCsvLine(line: string, separator: string): string[] {
  const fields: string[] = [];
  let current = '';
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (quoted) {
      // `""` à l'intérieur d'un champ quoté est un guillemet littéral.
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === separator) {
      fields.push(current);
      current = '';
    } else current += char;
  }

  fields.push(current);
  return fields.map((field) => field.trim());
}

/**
 * Montant bancaire français vers nombre.
 *
 * Les deux colonnes portent déjà leur signe (`-23,10` au débit, `+4497,32` au
 * crédit) : on ne le déduit pas de la colonne d'origine, on lit ce qui est
 * écrit.
 *
 * Le séparateur de milliers n'est pas observable sur l'échantillon, qui ne
 * dépasse pas quatre chiffres — d'où la règle prudente : si une virgule est
 * présente, elle est le séparateur décimal et le point ne peut être qu'un
 * séparateur de milliers ; sans virgule, le point est décimal. L'inverse
 * transformerait `1.234` en `1,234 €`.
 */
function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[\s\u00a0\u202f]/g, '');
  if (!cleaned) return null;

  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned;

  if (!/^[+-]?\d+(\.\d+)?$/.test(normalized)) return null;

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/**
 * `JJ/MM/AAAA` vers `YYYY-MM-DD`.
 *
 * Sans `dayjs` : celui-ci accepte des entrées approximatives et corrige en
 * silence — un 31/02 deviendrait le 03/03. Ici une date qui n'est pas celle
 * qu'on croit doit être refusée, pas rattrapée.
 */
function parseDate(raw: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw.trim());
  if (!match) return null;

  const [, day, month, year] = match;
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  if (monthNumber < 1 || monthNumber > 12) return null;

  // Le jour est validé contre le mois réel : `new Date` replierait le 31
  // avril sur le 1er mai au lieu de refuser.
  const daysInMonth = new Date(Number(year), monthNumber, 0).getDate();
  if (dayNumber < 1 || dayNumber > daysInMonth) return null;

  return `${year}-${month}-${day}`;
}

/**
 * Le séparateur du fichier, déduit de sa ligne d'en-tête.
 *
 * `;` dans l'export français observé, mais la même banque livre `,` à ses
 * clients d'autres pays. Compter les occurrences coûte moins qu'un réglage à
 * demander à l'utilisateur.
 */
function detectSeparator(headerLine: string): string {
  const semicolons = (headerLine.match(/;/g) ?? []).length;
  const commas = (headerLine.match(/,/g) ?? []).length;
  return commas > semicolons ? ',' : ';';
}

/**
 * Traduit le contenu d'un fichier en lignes exploitables.
 *
 * Les colonnes sont retrouvées **par leur intitulé**, jamais par leur rang :
 * une colonne insérée par la banque décalerait tout, et l'import écrirait des
 * montants pris dans la mauvaise colonne — l'erreur la plus coûteuse possible
 * ici, puisqu'elle est silencieuse.
 *
 * Une ligne dont la date ou le montant est illisible n'interrompt pas la
 * lecture : elle part dans `skipped`, que la modale affiche. Un fichier qui
 * perdrait deux lignes sans le dire serait pire qu'un fichier refusé.
 */
export function parseBankStatement(content: string): BankStatementParseResult {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length < 2) return { ok: false, error: 'empty', columns: [] };

  const separator = detectSeparator(lines[0]);
  const headers = splitCsvLine(lines[0], separator).map(normalizeHeader);

  const indexOf = (name: string) => headers.indexOf(name);
  const dateIndex =
    indexOf(COLUMNS.date) >= 0
      ? indexOf(COLUMNS.date)
      : indexOf(COLUMNS.dateFallback);

  const descriptionIndex = indexOf(COLUMNS.description);
  const debitIndex = indexOf(COLUMNS.debit);
  const creditIndex = indexOf(COLUMNS.credit);

  const missing = (
    [
      [COLUMNS.date, dateIndex],
      [COLUMNS.description, descriptionIndex],
      [COLUMNS.debit, debitIndex],
      [COLUMNS.credit, creditIndex],
    ] as const
  )
    .filter(([, index]) => index < 0)
    .map(([name]) => name);

  if (missing.length > 0) {
    return { ok: false, error: 'missing-columns', columns: missing };
  }

  // Facultatives : leur absence dégrade le confort, jamais la justesse.
  const rawLabelIndex = indexOf(COLUMNS.rawLabel);
  const referenceIndex = indexOf(COLUMNS.reference);
  const bankTypeIndex = indexOf(COLUMNS.bankType);

  const rows: BankStatementRow[] = [];
  const skipped: SkippedLine[] = [];
  const seenReferences = new Set<string>();

  for (let i = 1; i < lines.length; i += 1) {
    const fields = splitCsvLine(lines[i], separator);
    const at = (index: number) => (index >= 0 ? (fields[index] ?? '') : '');
    // Numéro tel que l'utilisateur le verra dans un tableur : 1-indexé.
    const line = i + 1;

    const date = parseDate(at(dateIndex));
    if (!date) {
      skipped.push({ line, reason: 'date', value: at(dateIndex) });
      continue;
    }

    const debit = at(debitIndex);
    const credit = at(creditIndex);
    const amount = parseAmount(debit) ?? parseAmount(credit);
    // Un montant nul n'est pas une opération : la banque ne l'écrit pas, et le
    // laisser passer créerait une ligne à 0 € impossible à rapprocher.
    if (amount === null || amount === 0) {
      skipped.push({ line, reason: 'amount', value: debit || credit });
      continue;
    }

    const reference = at(referenceIndex);
    // Deux exports qui se chevauchent partagent des références : la seconde
    // occurrence est le même mouvement, pas un mouvement de plus.
    if (reference && seenReferences.has(reference)) continue;
    if (reference) seenReferences.add(reference);

    rows.push({
      date,
      description: at(descriptionIndex),
      rawLabel: at(rawLabelIndex),
      amount,
      reference,
      bankType: at(bankTypeIndex),
      line,
    });
  }

  return { ok: true, rows, skipped };
}
