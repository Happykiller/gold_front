import { describe, expect, it } from 'vitest';

import {
  normalize,
  matchRef,
  parseToken,
  tokensToFilters,
  tokenLabel,
  tokenKey,
  suggest,
  type Referentials,
  type Token,
} from './searchTokens';

const refs: Referentials = {
  categories: [
    { id: 2, label: 'Alimentation' },
    { id: 7, label: 'Vacances' },
    { id: 11, label: 'Sortie' },
    { id: 20, label: 'Régulation' },
  ],
  thirds: [
    { id: 3, label: 'Hello Fresh' },
    { id: 4, label: 'operation.third-otherCredit' },
  ],
  accounts: [
    { id: 4, label: 'Alimentation' },
    { id: 9, label: 'Vacances' },
  ],
  types: [
    { id: 1, label: 'operation.type-credit' },
    { id: 3, label: 'operation.type-vire' },
  ],
  status: [
    { id: 1, label: 'operation.status-follow' },
    { id: 2, label: 'operation.status-reconciled' },
  ],
};

/** Traduit les clés i18n comme le ferait react-i18next. */
const translate = (label: string) =>
  ({
    'operation.third-otherCredit': 'Autre crédit',
    'operation.type-credit': 'Crédit',
    'operation.type-vire': 'Virement',
    'operation.status-follow': 'Non pointé',
    'operation.status-reconciled': 'Pointé',
  })[label] ?? label;

const parse = (input: string) => parseToken(input, refs, translate);

describe('normalize', () => {
  it('ignore la casse et les accents', () => {
    // La base ne le fait pas : sa collation ignore la casse mais pas les
    // accents. C'est donc ici que « regul » doit rejoindre « Régulation ».
    expect(normalize('RÉgulation')).toBe('regulation');
    expect(normalize('  Café  ')).toBe('cafe');
  });
});

describe('matchRef', () => {
  it('classe les correspondances par début avant les correspondances internes', () => {
    const items = [
      { id: 1, label: 'Frais alimentaires' },
      { id: 2, label: 'Alimentation' },
    ];
    expect(matchRef(items, 'ali').map((i) => i.id)).toEqual([2, 1]);
  });

  it('cherche dans le libellé traduit, pas dans la clé i18n', () => {
    // Sans traduction, « crédit » ne trouverait jamais
    // `operation.type-credit`.
    expect(
      matchRef(refs.types, 'virement', translate).map((i) => i.id),
    ).toEqual([3]);
    expect(matchRef(refs.types, 'virement').map((i) => i.id)).toEqual([]);
  });

  it('rend tout le référentiel sur une saisie vide', () => {
    expect(matchRef(refs.categories, '')).toHaveLength(4);
  });
});

describe('parseToken — référentiels', () => {
  it('résout un fragment de catégorie en identifiant', () => {
    expect(parse('cat:ali')).toEqual({
      kind: 'ref',
      field: 'cat',
      id: 2,
      label: 'Alimentation',
    });
  });

  it('résout malgré les accents manquants', () => {
    expect(parse('cat:regul')).toMatchObject({ id: 20 });
  });

  it('distingue une catégorie d’une enveloppe de même nom', () => {
    // « Alimentation » est à la fois une catégorie (2) et un compte (4) :
    // c'est le préfixe qui tranche.
    expect(parse('cat:Alimentation')).toMatchObject({ field: 'cat', id: 2 });
    expect(parse('enveloppe:Alimentation')).toMatchObject({
      field: 'enveloppe',
      id: 4,
    });
  });

  it('rejette une valeur qui ne correspond à rien', () => {
    // Fabriquer un critère approximatif donnerait une liste vide sans que
    // l'utilisateur comprenne pourquoi.
    expect(parse('cat:zzzz')).toBeNull();
  });

  it('accepte les raccourcis de statut sans préfixe', () => {
    expect(parse('non pointé')).toMatchObject({ field: 'statut', id: 1 });
    expect(parse('pointé')).toMatchObject({ field: 'statut', id: 2 });
  });

  it.each(['etat', 'état', 'statut', 'ETAT'])(
    'accepte le préfixe %s pour l’état',
    (prefix) => {
      expect(parse(`${prefix}:reco`)).toMatchObject({
        field: 'statut',
        id: 2,
      });
    },
  );

  it.each([
    ['reco', 2],
    ['reconcilié', 2],
    ['pointée', 2],
    ['rapproché', 2],
    ['attente', 1],
    ['en attente', 1],
    ['non pointé', 1],
  ])('résout la valeur d’état « %s »', (value, id) => {
    // Indispensable : le libellé traduit est « Pointée », qui ne contient pas
    // « reco ». Sans alias, la saisie la plus naturelle ne trouverait rien.
    expect(parse(`etat:${value}`)).toMatchObject({ field: 'statut', id });
  });

  it('accepte aussi le libellé affiché', () => {
    expect(parse('etat:Pointé')).toMatchObject({ field: 'statut', id: 2 });
  });

  it('rejette un état inconnu', () => {
    expect(parse('etat:zzz')).toBeNull();
  });

  it('accepte les autres alias de préfixe', () => {
    expect(parse('categorie:ali')).toMatchObject({ field: 'cat', id: 2 });
    expect(parse('compte:Vacances')).toMatchObject({
      field: 'enveloppe',
      id: 9,
    });
  });
});

describe('parseToken — texte', () => {
  it('reconnaît une recherche ciblée sur la description', () => {
    expect(parse('desc:fai')).toEqual({
      kind: 'text',
      field: 'desc',
      value: 'fai',
    });
  });

  it('traite une saisie nue comme une recherche large', () => {
    expect(parse('alimentation')).toEqual({
      kind: 'text',
      field: 'any',
      value: 'alimentation',
    });
  });

  it('ne coupe qu’au premier deux-points', () => {
    expect(parse('desc:achat: 12h')).toMatchObject({ value: 'achat: 12h' });
  });

  it('conserve une saisie à préfixe inconnu au lieu de la perdre', () => {
    expect(parse('http://exemple.fr')).toMatchObject({
      field: 'any',
      value: 'http://exemple.fr',
    });
  });

  it('rejette une saisie vide', () => {
    expect(parse('   ')).toBeNull();
    expect(parse('desc:')).toBeNull();
  });
});

describe('parseToken — comparaisons', () => {
  it.each([
    ['montant:>50', '>', '50'],
    ['montant:>=50', '>=', '50'],
    ['montant:<50', '<', '50'],
    ['montant:<=50', '<=', '50'],
    ['montant:=50', '=', '50'],
    ['montant:50', '=', '50'],
    ['montant:> 50', '>', '50'],
  ])('interprète %s', (input, op, from) => {
    expect(parse(input)).toMatchObject({ kind: 'range', op, from });
  });

  it('accepte une plage', () => {
    expect(parse('montant:10..50')).toMatchObject({ from: '10', to: '50' });
  });

  it('accepte les décimales, virgule comprise', () => {
    expect(parse('montant:>12,50')).toMatchObject({ from: '12,50' });
  });

  it('rejette un opérande non numérique', () => {
    expect(parse('montant:>abc')).toBeNull();
  });

  it.each(['date:2026', 'date:2026-06', 'date:2026-06-30'])(
    'accepte la date partielle %s',
    (input) => {
      expect(parse(input)).toMatchObject({ kind: 'range', field: 'date' });
    },
  );

  it('rejette une date malformée', () => {
    expect(parse('date:30/06/2026')).toBeNull();
  });
});

describe('tokensToFilters', () => {
  const filtersOf = (inputs: string[]) =>
    tokensToFilters(inputs.map(parse).filter(Boolean) as Token[]);

  it('cumule en OU les jetons de même nature', () => {
    // Un ET entre deux catégories ne renverrait jamais rien.
    expect(filtersOf(['cat:ali', 'cat:vacances']).category_ids).toEqual([2, 7]);
  });

  it('combine en ET les natures différentes', () => {
    expect(filtersOf(['cat:ali', 'montant:>50'])).toMatchObject({
      category_ids: [2],
      amount_min: 50,
    });
  });

  it('ne duplique pas un même identifiant', () => {
    expect(filtersOf(['cat:ali', 'cat:Alimentation']).category_ids).toEqual([
      2,
    ]);
  });

  it('sépare la recherche ciblée de la recherche large', () => {
    expect(filtersOf(['desc:fai', 'alimentation'])).toMatchObject({
      description: 'fai',
      text: 'alimentation',
    });
  });

  it('traduit les comparaisons en bornes', () => {
    expect(filtersOf(['montant:>50'])).toEqual({ amount_min: 50 });
    expect(filtersOf(['montant:<50'])).toEqual({ amount_max: 50 });
    expect(filtersOf(['montant:10..50'])).toEqual({
      amount_min: 10,
      amount_max: 50,
    });
  });

  it('interprète la virgule décimale', () => {
    expect(filtersOf(['montant:>12,50'])).toEqual({ amount_min: 12.5 });
  });

  it('étend une année en bornes de l’année', () => {
    expect(filtersOf(['date:2026'])).toEqual({
      date_from: '2026-01-01',
      date_to: '2026-12-31',
    });
  });

  it('étend un mois jusqu’à son dernier jour', () => {
    // Février 2024 est bissextile : le 29, pas le 28.
    expect(filtersOf(['date:2024-02'])).toEqual({
      date_from: '2024-02-01',
      date_to: '2024-02-29',
    });
    expect(filtersOf(['date:2026-06'])).toMatchObject({
      date_to: '2026-06-30',
    });
  });

  it('répartit les identifiants dans le bon critère', () => {
    expect(
      filtersOf(['cat:ali', 'tiers:Hello', 'enveloppe:Vacances', 'non pointé']),
    ).toEqual({
      category_ids: [2],
      third_ids: [3],
      dest_account_ids: [9],
      status_ids: [1],
    });
  });

  it('ne produit aucun critère sans jeton', () => {
    expect(tokensToFilters([])).toEqual({});
  });
});

describe('affichage et identité', () => {
  it('étiquette lisiblement chaque jeton', () => {
    expect(tokenLabel(parse('cat:ali')!)).toBe('cat: Alimentation');
    expect(tokenLabel(parse('montant:>50')!)).toBe('montant > 50 €');
    expect(tokenLabel(parse('montant:10..50')!)).toBe('montant 10 → 50 €');
    expect(tokenLabel(parse('alimentation')!)).toBe('alimentation');
  });

  it('donne la même identité à deux saisies équivalentes', () => {
    // C'est ce qui empêche d'empiler deux fois la même puce.
    expect(tokenKey(parse('cat:ali')!)).toBe(tokenKey(parse('cat:Aliment')!));
    expect(tokenKey(parse('FAI')!)).toBe(tokenKey(parse('fai')!));
  });
});

describe('suggest', () => {
  it('propose les trois lectures possibles d’une saisie ambiguë', () => {
    // « alimentation » est une catégorie, une enveloppe et un mot de
    // description : on ne choisit pas à la place de l'utilisateur.
    const fields = suggest('alimentation', refs, translate)
      .map((s) => s.token?.field)
      .filter(Boolean);
    expect(fields).toContain('cat');
    expect(fields).toContain('enveloppe');
    expect(fields).toContain('any');
  });

  it('restreint au référentiel visé quand le préfixe est donné', () => {
    const out = suggest('cat:a', refs, translate);
    expect(out.length).toBeGreaterThan(0);
    expect(
      out.every((s) => s.token?.kind === 'ref' && s.token.field === 'cat'),
    ).toBe(true);
  });

  it('présente les critères disponibles sur un champ vide', () => {
    // C'est le seul moment où la barre peut dire ce qu'elle sait faire :
    // sans cela, la grammaire reste invisible à qui ne la connaît pas.
    const out = suggest('', refs, translate);
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((s) => s.kind === 'prefix')).toBe(true);
    expect(out.map((s) => s.input)).toContain('statut:');
    expect(out.map((s) => s.input)).toContain('montant:');
  });

  it('propose le nom du critère pendant qu’on le tape', () => {
    // Le cas qui manquait : « sta » ne menait qu'à des valeurs de tiers, et
    // jamais à `statut:`.
    const out = suggest('sta', refs, translate);
    expect(out[0]).toMatchObject({ kind: 'prefix', input: 'statut:' });
    expect(out[0].hint).toBeTruthy();
  });

  it('mène d’un alias au critère canonique', () => {
    expect(suggest('eta', refs, translate)[0]).toMatchObject({
      kind: 'prefix',
      input: 'statut:',
    });
  });

  it('ne propose pas de préfixe quand rien ne correspond', () => {
    expect(
      suggest('alimentation', refs, translate).every((s) => s.kind === 'token'),
    ).toBe(true);
  });

  it('ne propose rien quand un jeton préfixé est invalide', () => {
    expect(suggest('montant:>abc', refs, translate)).toEqual([]);
  });

  it('respecte la limite demandée', () => {
    expect(suggest('a', refs, translate, 2).length).toBeLessThanOrEqual(2);
  });
});
