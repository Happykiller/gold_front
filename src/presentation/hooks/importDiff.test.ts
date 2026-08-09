import { describe, expect, it } from 'vitest';

import {
  analyseImport,
  diffBankStatement,
  normalizeLabel,
  similarity,
  suggestClassification,
} from './importDiff';
import type { Operation } from '@presentation/hooks/useAccountOperations';
import {
  CATEGORY_OTHER,
  THIRD_OTHER_CREDIT,
  THIRD_OTHER_DEBIT,
} from '@presentation/hooks/referentialIds';
import type { BankStatementRow } from '@presentation/hooks/bankStatementParse';

/**
 * Les libellés et les montants sont **inventés**.
 *
 * Ce rapprochement a été conçu sur un relevé réel, dont les commerçants, les
 * salaires et les échéances sont des données bancaires véritables : la loi n°7
 * leur interdit d'entrer dans le dépôt. Seules les *formes* qui font échouer un
 * rapprochement naïf sont reproduites — deux variantes d'une même enseigne, une
 * paire débit/crédit de même valeur absolue, deux prélèvements jumeaux.
 */
const ACCOUNT = 7;

/** Une ligne de relevé réduite à ce que le rapprochement regarde. */
const line = (
  date: string,
  amount: number,
  description: string,
  rawLabel = description,
): BankStatementRow => ({
  date,
  description,
  rawLabel,
  amount,
  reference: `${date}-${amount}-${description}`,
  bankType: 'Carte bancaire',
  line: 2,
});

let nextId = 1;

/**
 * Une opération telle que l'API la renvoie.
 *
 * Deux détails du contrat comptent ici : `amount` est **toujours positif**, le
 * sens vient de `type_id` (1 crédit, 2 débit) ; et `date` arrive en
 * millisecondes epoch **sous forme de chaîne**, pas en `YYYY-MM-DD`.
 */
const op = (
  date: string,
  signedAmount: number,
  description: string | null,
  extra: Partial<Operation> = {},
): Operation =>
  ({
    id: nextId++,
    account_id: ACCOUNT,
    account_id_dest: null,
    amount: Math.abs(signedAmount),
    type_id: signedAmount < 0 ? 2 : 1,
    date: String(Date.parse(`${date}T12:00:00Z`)),
    description,
    category_id: null,
    third_id: null,
    ...extra,
  }) as unknown as Operation;

const verdicts = (rows: BankStatementRow[], existing: Operation[]) =>
  diffBankStatement(rows, existing, ACCOUNT).map((d) => d.verdict);

describe('normalizeLabel', () => {
  it('rapproche les écritures d’un même commerçant', () => {
    expect(normalizeLabel('FR.HOTELS.CO')).toBe('FR HOTELS CO');
    expect(normalizeLabel('Resto du Coin')).toBe('RESTO DU COIN');
    expect(normalizeLabel('Café Crème')).toBe('CAFE CREME');
    expect(normalizeLabel(null)).toBe('');
  });
});

describe('similarity', () => {
  it('vaut 1 pour deux libellés identiques, 0 face au vide', () => {
    expect(similarity('HEBERGEUR', 'HEBERGEUR')).toBe(1);
    expect(similarity('HEBERGEUR', '')).toBe(0);
  });

  it('sépare deux commerçants distincts et rapproche deux variantes', () => {
    const variantes = similarity(
      normalizeLabel('PANIERS FRAIS FR FR LYON'),
      normalizeLabel('PANIERS FRAIS FRAFR LYON SUD'),
    );
    const distincts = similarity(
      normalizeLabel('RESTO DU COIN'),
      normalizeLabel('HEBERGEUR FR LILLE'),
    );

    expect(variantes).toBeGreaterThan(0.7);
    expect(distincts).toBeLessThan(0.3);
  });
});

describe('diffBankStatement', () => {
  it('déclare nouvelle une ligne sans équivalent', () => {
    const existing = [op('2026-08-03', -71.5, 'HEBERGEUR FR LILLE')];

    expect(verdicts([line('2026-08-07', -18.4, 'RESTO DU COIN')], existing)) //
      .toEqual(['new']);
  });

  it('reconnaît une opération déjà enregistrée', () => {
    const existing = [op('2026-08-07', -18.4, 'RESTO DU COIN')];

    expect(verdicts([line('2026-08-07', -18.4, 'RESTO DU COIN')], existing)) //
      .toEqual(['duplicate']);
  });

  it('n’apparie jamais deux montants différents, même libellé identique', () => {
    // Le montant est la condition stricte : c'est ce qui rend sûre une
    // comparaison de texte qui, elle, est approximative.
    const existing = [op('2026-08-03', -39.9, 'PANIERS FRAIS FR FR LYON')];

    expect(
      verdicts(
        [line('2026-08-03', -11.9, 'PANIERS FRAIS FR FR LYON')],
        existing,
      ),
    ).toEqual(['new']);
  });

  it('retrouve une opération dont le pointage a déplacé la date', () => {
    // `setReco` pose la date du jour : l'opération du 05/08 porte le 28/08.
    // Un rapprochement qui comparerait les dates créerait ici un doublon.
    const existing = [op('2026-08-28', -64.5, 'ASSURANCE AUTO')];

    expect(verdicts([line('2026-08-05', -64.5, 'ASSURANCE AUTO')], existing)) //
      .toEqual(['duplicate']);
  });

  it('ne laisse pas une opération expliquer deux lignes jumelles', () => {
    // Le cas qui casse un rapprochement ensembliste : deux prélèvements
    // identiques le même jour, dont un seul est déjà dans Gold.
    const existing = [op('2026-08-03', -11.9, 'PANIERS FRAIS FR FR LYON')];
    const rows = [
      line('2026-08-03', -11.9, 'PANIERS FRAIS FR FR LYON'),
      line('2026-08-03', -11.9, 'PANIERS FRAIS FR FR LYON'),
    ];

    expect(verdicts(rows, existing)).toEqual(['duplicate', 'new']);
  });

  it('apparie autant de jumelles qu’il en existe', () => {
    const existing = [
      op('2026-08-03', -11.9, 'PANIERS FRAIS FR FR LYON'),
      op('2026-08-03', -11.9, 'PANIERS FRAIS FR FR LYON'),
    ];
    const rows = [
      line('2026-08-03', -11.9, 'PANIERS FRAIS FR FR LYON'),
      line('2026-08-03', -11.9, 'PANIERS FRAIS FR FR LYON'),
    ];

    expect(verdicts(rows, existing)).toEqual(['duplicate', 'duplicate']);
  });

  it('refuse de trancher quand le montant coïncide mais pas le libellé', () => {
    const existing = [op('2026-08-07', -18.4, 'REMBOURSEMENT PHARMACIE')];
    const result = diffBankStatement(
      [line('2026-08-07', -18.4, 'RESTO DU COIN')],
      existing,
      ACCOUNT,
    );

    expect(result[0].verdict).toBe('uncertain');
    // Le candidat est montré pour que l'utilisateur puisse juger…
    expect(result[0].match?.description).toBe('REMBOURSEMENT PHARMACIE');
    expect(result[0].score).toBeLessThan(0.7);
  });

  it('ne consomme pas le candidat d’une ligne incertaine', () => {
    // Rien n'a été décidé : le même candidat doit rester disponible pour la
    // ligne suivante, qui elle le reconnaîtra peut-être vraiment.
    const existing = [op('2026-08-07', -18.4, 'REMBOURSEMENT PHARMACIE')];
    const rows = [
      line('2026-08-07', -18.4, 'RESTO DU COIN'),
      line('2026-08-07', -18.4, 'REMBOURSEMENT PHARMACIE'),
    ];

    expect(verdicts(rows, existing)).toEqual(['uncertain', 'duplicate']);
  });

  it('préfère, à libellé égal, l’opération la plus proche en date', () => {
    const juillet = op('2026-07-04', -15.2, 'HEBERGEUR FR LILLE');
    const aout = op('2026-08-04', -15.2, 'HEBERGEUR FR LILLE');
    const result = diffBankStatement(
      [line('2026-08-04', -15.2, 'HEBERGEUR FR LILLE')],
      [juillet, aout],
      ACCOUNT,
    );

    expect(result[0].match?.id).toBe(aout.id);
  });

  it('distingue un crédit d’un débit de même valeur absolue', () => {
    // `amount` est positif en base : sans le signe porté par `type_id`, un
    // remboursement de 50 € se confondrait avec une dépense de 50 €.
    const existing = [op('2026-08-05', 50, 'EMPLOYEUR')];

    expect(verdicts([line('2026-08-05', -50, 'EMPLOYEUR')], existing)) //
      .toEqual(['new']);
    expect(verdicts([line('2026-08-05', 50, 'EMPLOYEUR')], existing)) //
      .toEqual(['duplicate']);
  });

  it('voit un virement reçu comme un crédit sur le compte destinataire', () => {
    // Un virement est une écriture unique portant deux comptes : son signe
    // dépend du compte depuis lequel on le regarde.
    const recu = op('2026-08-05', 0, 'EMPLOYEUR', {
      amount: 2500.0,
      type_id: 3,
      account_id: 99,
      account_id_dest: ACCOUNT,
    });

    expect(verdicts([line('2026-08-05', 2500.0, 'EMPLOYEUR')], [recu])) //
      .toEqual(['duplicate']);
  });

  it('rend les verdicts dans l’ordre du fichier', () => {
    // L'appariement travaille par date croissante, mais l'utilisateur relit le
    // fichier dans son ordre d'origine : le plus récent d'abord.
    const existing = [op('2026-08-03', -71.5, 'HEBERGEUR FR LILLE')];
    const rows = [
      line('2026-08-07', -18.4, 'RESTO DU COIN'),
      line('2026-08-03', -71.5, 'HEBERGEUR FR LILLE'),
    ];

    const result = diffBankStatement(rows, existing, ACCOUNT);
    expect(result.map((d) => d.row.description)).toEqual([
      'RESTO DU COIN',
      'HEBERGEUR FR LILLE',
    ]);
    expect(result.map((d) => d.verdict)).toEqual(['new', 'duplicate']);
  });

  it('déclare tout nouveau face à un compte vide', () => {
    const rows = [
      line('2026-08-07', -18.4, 'RESTO DU COIN'),
      line('2026-08-05', 2500.0, 'EMPLOYEUR'),
    ];

    expect(verdicts(rows, [])).toEqual(['new', 'new']);
  });

  it('ne retient rien à réimporter d’un fichier déjà importé', () => {
    // Le contrôle qui prouve le rapprochement : rejouer le même fichier ne
    // doit produire aucune création.
    const rows = [
      line('2026-08-07', -18.4, 'RESTO DU COIN'),
      line('2026-08-05', -64.5, 'ASSURANCE AUTO'),
      line('2026-08-05', 2500.0, 'EMPLOYEUR'),
    ];
    const existing = rows.map((r) => op(r.date, r.amount, r.description));

    expect(verdicts(rows, existing)).toEqual([
      'duplicate',
      'duplicate',
      'duplicate',
    ]);
  });
});

describe('suggestClassification', () => {
  const historique = [
    op('2026-07-07', -17.2, 'RESTO DU COIN', { category_id: 2, third_id: 2 }),
    op('2026-07-04', -15.2, 'HEBERGEUR FR LILLE', {
      category_id: 14,
      third_id: 2,
    }),
  ];

  it('recopie le classement de l’opération passée la plus proche', () => {
    // Montant différent, libellé identique : le classement se transmet, alors
    // que le rapprochement, lui, ne les apparierait jamais.
    expect(
      suggestClassification(
        line('2026-08-07', -18.4, 'RESTO DU COIN'),
        historique,
      ),
    ).toEqual({ category_id: 2, third_id: 2 });
  });

  it('retombe sur « Autre » et « Débiteur » pour une dépense inédite', () => {
    expect(
      suggestClassification(
        line('2026-08-06', -420.0, 'HOTEL EN LIGNE'),
        historique,
      ),
    ).toEqual({ category_id: CATEGORY_OTHER, third_id: THIRD_OTHER_DEBIT });
  });

  it('retombe sur « Créditeur » pour une rentrée inédite', () => {
    // Le repli suit le sens de l'opération : classer un salaire en
    // « Débiteur » serait faux, et les deux tiers existent en paire.
    expect(
      suggestClassification(
        line('2026-08-05', 2500.0, 'EMPLOYEUR'),
        historique,
      ),
    ).toEqual({ category_id: CATEGORY_OTHER, third_id: THIRD_OTHER_CREDIT });
  });

  it('ignore les opérations passées dépourvues de classement', () => {
    const sansClassement = [op('2026-07-07', -17.2, 'RESTO DU COIN')];

    expect(
      suggestClassification(
        line('2026-08-07', -18.4, 'RESTO DU COIN'),
        sansClassement,
      ),
    ).toEqual({ category_id: CATEGORY_OTHER, third_id: THIRD_OTHER_DEBIT });
  });
});

describe('analyseImport', () => {
  it('ne suggère un classement que pour ce qui sera créé', () => {
    const existing = [
      op('2026-08-07', -18.4, 'RESTO DU COIN', { category_id: 2, third_id: 2 }),
    ];
    const rows = [
      line('2026-08-07', -18.4, 'RESTO DU COIN'), // déjà présente
      line('2026-08-09', -33.7, 'RESTO DU COIN'), // nouvelle, même enseigne
    ];

    const result = analyseImport(rows, existing, ACCOUNT);

    expect(result[0].verdict).toBe('duplicate');
    expect(result[0].suggestion).toEqual({ category_id: null, third_id: null });
    expect(result[1].verdict).toBe('new');
    expect(result[1].suggestion).toEqual({ category_id: 2, third_id: 2 });
  });
});
