// src\presentation\hooks\searchTokens.ts
//
// Grammaire de la barre de recherche : traduction d'une saisie libre en
// critères envoyés au serveur.
//
// Module pur, sans React ni MUI : c'est ici que vit tout ce qui mérite d'être
// testé — le composant qui l'utilise ne fait que du rendu. Même partage que
// `ventilation.calc.ts`, et le dossier `hooks/` est dans le périmètre de
// couverture Vitest.

/** Un référentiel réduit à ce dont la recherche a besoin. */
export type RefItem = { id: number; label: string };

export type Referentials = {
  categories: RefItem[];
  thirds: RefItem[];
  /** Comptes de ventilation, dits « enveloppes ». */
  accounts: RefItem[];
  types: RefItem[];
  status: RefItem[];
};

export const EMPTY_REFERENTIALS: Referentials = {
  categories: [],
  thirds: [],
  accounts: [],
  types: [],
  status: [],
};

/** Champs adossés à un référentiel : la saisie est résolue en identifiant. */
export type RefField = 'cat' | 'tiers' | 'enveloppe' | 'type' | 'statut';
/** Champs numériques ou datés, qui acceptent une comparaison. */
export type RangeField = 'montant' | 'date';

export type Token =
  | { kind: 'ref'; field: RefField; id: number; label: string }
  | { kind: 'text'; field: 'desc' | 'any'; value: string }
  | {
      kind: 'range';
      field: RangeField;
      op: '>' | '<' | '>=' | '<=' | '=';
      from: string;
      to?: string;
    };

/** Critères tels que la query GraphQL les attend. */
export type OperationFilters = {
  category_ids?: number[];
  third_ids?: number[];
  dest_account_ids?: number[];
  type_ids?: number[];
  status_ids?: number[];
  description?: string;
  text?: string;
  amount_min?: number;
  amount_max?: number;
  date_from?: string;
  date_to?: string;
};

export type Suggestion = {
  /** Ce qui serait saisi si on retenait cette proposition. */
  input: string;
  /** Ce que l'utilisateur lit. */
  label: string;
  token: Token;
};

const REF_FIELDS: Record<RefField, keyof Referentials> = {
  cat: 'categories',
  tiers: 'thirds',
  enveloppe: 'accounts',
  type: 'types',
  statut: 'status',
};

/**
 * Comparaison indulgente : casse et accents ignorés.
 *
 * Nécessaire côté client parce que la base ne le fait pas — sa collation
 * `utf8mb3_general_ci` ignore la casse mais **pas** les accents. Ici au moins,
 * `cat:regul` trouve « Régulation ».
 */
export function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // diacritiques
    .toLowerCase()
    .trim();
}

/** Raccourcis nus, reconnus avant d'être traités comme du texte libre. */
const STATUS_SHORTCUTS: Record<string, string> = {
  pointe: 'operation.status-reconciled',
  pointee: 'operation.status-reconciled',
  reconcilie: 'operation.status-reconciled',
  'non pointe': 'operation.status-follow',
  'non pointee': 'operation.status-follow',
  'a pointer': 'operation.status-follow',
};

/**
 * Coupe `préfixe:valeur`.
 *
 * Le premier `:` seulement — une description peut en contenir, et
 * `desc:achat: 12h` doit chercher « achat: 12h ».
 */
function splitPrefix(input: string): { prefix: string; value: string } | null {
  const at = input.indexOf(':');
  if (at <= 0) return null;
  return {
    prefix: normalize(input.slice(0, at)),
    value: input.slice(at + 1).trim(),
  };
}

/**
 * Candidats d'un référentiel pour une saisie donnée.
 *
 * `startsWith` avant `includes` : taper « ali » doit proposer « Alimentation »
 * avant « Frais alimentaires ». Une saisie vide propose tout le référentiel.
 *
 * `translate` résout les libellés qui sont des clés i18n (tiers, types,
 * statuts viennent du seed serveur sous forme de clés) ; sans lui la
 * correspondance porterait sur la clé et non sur le mot affiché.
 */
export function matchRef(
  items: RefItem[],
  value: string,
  translate: (label: string) => string = (l) => l,
): RefItem[] {
  const needle = normalize(value);
  if (!needle) return items;
  const scored = items
    .map((item) => ({ item, hay: normalize(translate(item.label)) }))
    .filter(({ hay }) => hay.includes(needle));
  return [
    ...scored.filter(({ hay }) => hay.startsWith(needle)),
    ...scored.filter(({ hay }) => !hay.startsWith(needle)),
  ].map(({ item }) => item);
}

/** `>50`, `<=50`, `=50`, `50..80`, ou `50` (égalité implicite). */
function parseRange(
  field: RangeField,
  raw: string,
): Extract<Token, { kind: 'range' }> | null {
  const value = raw.trim();
  if (!value) return null;

  const between = value.match(/^(.+?)\.\.(.+)$/);
  if (between) {
    const [, from, to] = between;
    if (!isValidOperand(field, from) || !isValidOperand(field, to)) return null;
    return { kind: 'range', field, op: '=', from: from.trim(), to: to.trim() };
  }

  const compared = value.match(/^(>=|<=|>|<|=)\s*(.+)$/);
  const op = (compared?.[1] ?? '=') as '>' | '<' | '>=' | '<=' | '=';
  const operand = (compared?.[2] ?? value).trim();
  if (!isValidOperand(field, operand)) return null;

  return { kind: 'range', field, op, from: operand };
}

function isValidOperand(field: RangeField, operand: string): boolean {
  const value = operand.trim();
  if (field === 'montant') {
    return /^-?\d+([.,]\d+)?$/.test(value);
  }
  // Date : année, mois ou jour — `2026`, `2026-06`, `2026-06-30`.
  return /^\d{4}(-\d{2}(-\d{2})?)?$/.test(value);
}

/** Complète une date partielle vers sa borne basse ou haute. */
function expandDate(value: string, edge: 'from' | 'to'): string {
  const parts = value.split('-');
  if (parts.length === 1)
    return edge === 'from' ? `${value}-01-01` : `${value}-12-31`;
  if (parts.length === 2) {
    if (edge === 'from') return `${value}-01`;
    // Dernier jour du mois : le jour 0 du mois suivant.
    const last = new Date(Number(parts[0]), Number(parts[1]), 0).getDate();
    return `${value}-${String(last).padStart(2, '0')}`;
  }
  return value;
}

/**
 * Transforme une saisie validée en jeton, ou `null` si elle n'a pas de sens.
 *
 * Rendre `null` plutôt que de fabriquer un critère approximatif est
 * délibéré : un jeton `cat:` qui ne correspond à aucune catégorie filtrerait
 * sur rien et donnerait une liste vide sans que l'utilisateur comprenne
 * pourquoi.
 */
export function parseToken(
  input: string,
  refs: Referentials = EMPTY_REFERENTIALS,
  translate: (label: string) => string = (l) => l,
): Token | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const split = splitPrefix(trimmed);

  if (split) {
    const { prefix, value } = split;

    if (prefix in REF_FIELDS) {
      const field = prefix as RefField;
      const match = matchRef(refs[REF_FIELDS[field]], value, translate)[0];
      if (!match) return null;
      return {
        kind: 'ref',
        field,
        id: match.id,
        label: translate(match.label),
      };
    }

    if (prefix === 'desc') {
      return value ? { kind: 'text', field: 'desc', value } : null;
    }

    if (prefix === 'montant' || prefix === 'date') {
      return parseRange(prefix, value);
    }

    // Préfixe inconnu : la saisie entière devient du texte libre, plutôt que
    // d'être rejetée. « http://x » ne doit pas disparaître.
  }

  // Raccourcis de statut avant le texte libre : « non pointé » est un filtre,
  // pas une recherche de description.
  const shortcut = STATUS_SHORTCUTS[normalize(trimmed)];
  if (shortcut) {
    const match = refs.status.find((s) => s.label === shortcut);
    if (match) {
      return {
        kind: 'ref',
        field: 'statut',
        id: match.id,
        label: translate(match.label),
      };
    }
  }

  return { kind: 'text', field: 'any', value: trimmed };
}

/**
 * Agrège les jetons en critères GraphQL.
 *
 * Même nature ⇒ OU (les identifiants s'accumulent dans une liste) ; natures
 * différentes ⇒ ET. Un ET entre deux catégories ne renverrait jamais rien.
 */
export function tokensToFilters(tokens: Token[]): OperationFilters {
  const filters: OperationFilters = {};
  const push = (key: keyof OperationFilters, id: number) => {
    const list = (filters[key] as number[] | undefined) ?? [];
    if (!list.includes(id)) list.push(id);
    (filters[key] as number[]) = list;
  };

  const refKeys: Record<RefField, keyof OperationFilters> = {
    cat: 'category_ids',
    tiers: 'third_ids',
    enveloppe: 'dest_account_ids',
    type: 'type_ids',
    statut: 'status_ids',
  };

  const descriptions: string[] = [];
  const texts: string[] = [];

  for (const token of tokens) {
    if (token.kind === 'ref') {
      push(refKeys[token.field], token.id);
      continue;
    }

    if (token.kind === 'text') {
      (token.field === 'desc' ? descriptions : texts).push(token.value);
      continue;
    }

    const numeric = token.field === 'montant';
    const toNumber = (v: string) => Number(v.replace(',', '.'));

    if (token.to !== undefined) {
      if (numeric) {
        filters.amount_min = toNumber(token.from);
        filters.amount_max = toNumber(token.to);
      } else {
        filters.date_from = expandDate(token.from, 'from');
        filters.date_to = expandDate(token.to, 'to');
      }
      continue;
    }

    const lower = token.op === '>' || token.op === '>=' || token.op === '=';
    const upper = token.op === '<' || token.op === '<=' || token.op === '=';
    if (numeric) {
      if (lower) filters.amount_min = toNumber(token.from);
      if (upper) filters.amount_max = toNumber(token.from);
    } else {
      if (lower) filters.date_from = expandDate(token.from, 'from');
      if (upper) filters.date_to = expandDate(token.from, 'to');
    }
  }

  // Le serveur n'accepte qu'une chaîne par champ : plusieurs jetons textuels
  // sont concaténés, faute de pouvoir exprimer un ET entre deux LIKE.
  if (descriptions.length) filters.description = descriptions.join(' ');
  if (texts.length) filters.text = texts.join(' ');

  return filters;
}

/** Ce que la puce affiche une fois le jeton validé. */
export function tokenLabel(token: Token): string {
  if (token.kind === 'ref') return `${token.field}: ${token.label}`;
  if (token.kind === 'text')
    return token.field === 'desc' ? `desc: ${token.value}` : token.value;
  const unit = token.field === 'montant' ? ' €' : '';
  if (token.to !== undefined)
    return `${token.field} ${token.from} → ${token.to}${unit}`;
  return `${token.field} ${token.op} ${token.from}${unit}`;
}

/**
 * Forme textuelle **re-parsable** d'un jeton, pour l'URL.
 *
 * Distincte de `tokenLabel`, qui vise la lisibilité (« montant > 50 € ») et ne
 * repasserait pas dans `parseToken`.
 */
export function tokenToInput(token: Token): string {
  if (token.kind === 'ref') return `${token.field}:${token.label}`;
  if (token.kind === 'text')
    return token.field === 'desc' ? `desc:${token.value}` : token.value;
  if (token.to !== undefined)
    return `${token.field}:${token.from}..${token.to}`;
  return `${token.field}:${token.op}${token.from}`;
}

/** Sérialise une barre entière pour l'URL. */
export function serializeTokens(tokens: Token[]): string {
  return tokens.map(tokenToInput).join(';');
}

/**
 * Relit une barre depuis l'URL.
 *
 * Les jetons qui ne se résolvent plus — une catégorie supprimée depuis le
 * partage du lien — sont écartés silencieusement plutôt que de bloquer
 * l'affichage.
 */
export function deserializeTokens(
  serialized: string,
  refs: Referentials = EMPTY_REFERENTIALS,
  translate: (label: string) => string = (l) => l,
): Token[] {
  if (!serialized) return [];
  const seen = new Set<string>();
  const out: Token[] = [];
  for (const part of serialized.split(';')) {
    const token = parseToken(part, refs, translate);
    if (!token) continue;
    const key = tokenKey(token);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(token);
  }
  return out;
}

/** Identité d'un jeton, pour éviter les doublons dans la barre. */
export function tokenKey(token: Token): string {
  if (token.kind === 'ref') return `${token.field}:${token.id}`;
  if (token.kind === 'text') return `${token.field}:${normalize(token.value)}`;
  return `${token.field}:${token.op}:${token.from}:${token.to ?? ''}`;
}

/**
 * Propositions affichées sous la barre pendant la frappe.
 *
 * Sans préfixe, la même saisie peut vouloir dire plusieurs choses —
 * « alimentation » est à la fois une catégorie, une enveloppe et un mot de
 * description. On propose les trois plutôt que de choisir à la place de
 * l'utilisateur.
 */
export function suggest(
  input: string,
  refs: Referentials = EMPTY_REFERENTIALS,
  translate: (label: string) => string = (l) => l,
  limit = 8,
): Suggestion[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const out: Suggestion[] = [];
  const split = splitPrefix(trimmed);

  if (split && split.prefix in REF_FIELDS) {
    const field = split.prefix as RefField;
    for (const item of matchRef(
      refs[REF_FIELDS[field]],
      split.value,
      translate,
    )) {
      const label = translate(item.label);
      out.push({
        input: `${field}:${label}`,
        label: `${field}: ${label}`,
        token: { kind: 'ref', field, id: item.id, label },
      });
      if (out.length >= limit) return out;
    }
    return out;
  }

  if (split) {
    const token = parseToken(trimmed, refs, translate);
    return token ? [{ input: trimmed, label: tokenLabel(token), token }] : [];
  }

  // Saisie nue : on propose les référentiels qui correspondent, puis la
  // recherche textuelle en dernier recours.
  for (const field of ['cat', 'tiers', 'enveloppe'] as RefField[]) {
    for (const item of matchRef(refs[REF_FIELDS[field]], trimmed, translate)) {
      const label = translate(item.label);
      out.push({
        input: `${field}:${label}`,
        label: `${field}: ${label}`,
        token: { kind: 'ref', field, id: item.id, label },
      });
      if (out.length >= limit - 1) break;
    }
    if (out.length >= limit - 1) break;
  }

  const free = parseToken(trimmed, refs, translate);
  if (free) out.push({ input: trimmed, label: tokenLabel(free), token: free });

  return out.slice(0, limit);
}
