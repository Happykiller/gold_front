import { describe, expect, it } from 'vitest';

import { parseBankStatement } from './bankStatementParse';

/**
 * Les fixtures sont **inventées**.
 *
 * L'export réel qui a servi à concevoir ce parseur contient des données
 * bancaires véritables : la loi n°7 lui interdit d'entrer dans le dépôt. Seule
 * la *forme* du fichier est reproduite ici — mêmes intitulés de colonnes, même
 * séparateur, mêmes conventions de montant et de date.
 */
const HEADER =
  'Date de comptabilisation;Libelle simplifie;Libelle operation;Reference;' +
  'Informations complementaires;Type operation;Categorie;Sous categorie;' +
  'Debit;Credit;Date operation;Date de valeur;Pointage operation';

/** Une ligne de relevé, dans l'ordre des colonnes de l'en-tête ci-dessus. */
const row = ({
  booked = '07/08/2026',
  simple = 'BOULANGERIE DU COIN',
  raw = 'CB BOULANGERIE DU COIN',
  reference = 'REF001',
  bankType = 'Carte bancaire',
  debit = '-12,50',
  credit = '',
  operated = '07/08/2026',
} = {}) =>
  [
    booked,
    simple,
    raw,
    reference,
    'informations',
    bankType,
    'Alimentation',
    'Boulangerie',
    debit,
    credit,
    operated,
    operated,
    'x',
  ].join(';');

/** Le fichier tel que la banque le livre : CRLF, et une ligne vide au bout. */
const file = (...lines: string[]) => [HEADER, ...lines, ''].join('\r\n');

/** Raccourci : la lecture doit réussir, sinon le test s'arrête ici. */
const parseOk = (content: string) => {
  const result = parseBankStatement(content);
  if (!result.ok) throw new Error(`lecture refusée : ${result.error}`);
  return result;
};

describe('parseBankStatement', () => {
  it('lit une ligne de débit et convertit sa date', () => {
    const { rows, skipped } = parseOk(file(row()));

    expect(skipped).toEqual([]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      date: '2026-08-07',
      description: 'BOULANGERIE DU COIN',
      rawLabel: 'CB BOULANGERIE DU COIN',
      amount: -12.5,
      reference: 'REF001',
      bankType: 'Carte bancaire',
    });
  });

  it('garde le signe positif d’un crédit', () => {
    const { rows } = parseOk(
      file(row({ debit: '', credit: '+1450,08', bankType: 'Virement recu' })),
    );

    expect(rows[0].amount).toBe(1450.08);
    expect(rows[0].bankType).toBe('Virement recu');
  });

  it('préfère la date d’opération à celle de comptabilisation', () => {
    // Le cas des frais de fin de mois : opérés le 31/07, comptabilisés le 01/08.
    const { rows } = parseOk(
      file(row({ booked: '01/08/2026', operated: '31/07/2026' })),
    );

    expect(rows[0].date).toBe('2026-07-31');
  });

  it('retrouve les colonnes par leur nom, quel que soit leur rang', () => {
    // Colonnes réordonnées et une colonne inconnue insérée : lire par rang
    // prendrait le montant dans la mauvaise colonne, en silence.
    const content = [
      'Libelle simplifie;Nouvelle colonne;Credit;Debit;Date operation',
      'PEAGE A61;peu importe;;-8,40;03/08/2026',
      '',
    ].join('\r\n');

    const { rows } = parseOk(content);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      description: 'PEAGE A61',
      amount: -8.4,
      date: '2026-08-03',
    });
  });

  it('tolère des intitulés accentués ou espacés', () => {
    const content = [
      'Date opération ;  Libellé simplifié;Débit;Crédit',
      '05/08/2026;ASSURANCE AUTO;-86,40;',
      '',
    ].join('\r\n');

    expect(parseOk(content).rows[0]).toMatchObject({
      description: 'ASSURANCE AUTO',
      amount: -86.4,
    });
  });

  it('refuse un fichier dont une colonne indispensable manque', () => {
    const content = ['Date operation;Libelle simplifie', '05/08/2026;X'].join(
      '\r\n',
    );

    const result = parseBankStatement(content);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('missing-columns');
    expect(result.columns).toEqual(expect.arrayContaining(['debit', 'credit']));
  });

  it('refuse un fichier vide ou réduit à son en-tête', () => {
    expect(parseBankStatement('').ok).toBe(false);
    expect(parseBankStatement(HEADER).ok).toBe(false);
    expect(parseBankStatement(`${HEADER}\r\n`).ok).toBe(false);
  });

  it('écarte une date impossible sans interrompre la lecture', () => {
    // 31 février : `new Date` le replierait sur le 3 mars, ce qui donnerait une
    // opération datée d'un jour qui n'existe pas dans le relevé.
    const { rows, skipped } = parseOk(
      file(row({ operated: '31/02/2026', reference: 'REF_KO' }), row()),
    );

    expect(rows).toHaveLength(1);
    expect(skipped).toEqual([{ line: 2, reason: 'date', value: '31/02/2026' }]);
  });

  it('écarte un montant illisible ou nul, et le signale', () => {
    const { rows, skipped } = parseOk(
      file(
        row({ debit: 'n/a', reference: 'REF_KO' }),
        row({ debit: '0,00', reference: 'REF_ZERO' }),
        row(),
      ),
    );

    expect(rows).toHaveLength(1);
    expect(skipped.map((s) => s.reason)).toEqual(['amount', 'amount']);
  });

  it('lit un champ quoté contenant le séparateur', () => {
    const content = [
      'Date operation;Libelle simplifie;Debit;Credit',
      '05/08/2026;"DUPONT; MARTIN ET FILS";-42,00;',
      '',
    ].join('\r\n');

    expect(parseOk(content).rows[0]).toMatchObject({
      description: 'DUPONT; MARTIN ET FILS',
      amount: -42,
    });
  });

  it('lit un montant à séparateur de milliers', () => {
    const content = [
      'Date operation;Libelle simplifie;Debit;Credit',
      '05/08/2026;LOYER;-1 250,00;',
      '05/08/2026;SALAIRE;;+2.480,55',
      '',
    ].join('\r\n');

    expect(parseOk(content).rows.map((r) => r.amount)).toEqual([
      -1250, 2480.55,
    ]);
  });

  it('détecte un fichier séparé par des virgules', () => {
    const content = [
      'Date operation,Libelle simplifie,Debit,Credit',
      '05/08/2026,PARKING,-3.50,',
      '',
    ].join('\r\n');

    expect(parseOk(content).rows[0]).toMatchObject({
      description: 'PARKING',
      amount: -3.5,
    });
  });

  it('ne retient qu’une fois une référence déjà vue', () => {
    // Deux exports qui se chevauchent décrivent le même mouvement deux fois.
    const { rows } = parseOk(file(row(), row()));

    expect(rows).toHaveLength(1);
  });

  it('garde deux lignes jumelles dépourvues de référence', () => {
    // Sans référence, rien ne distingue deux prélèvements identiques du même
    // jour — et ce sont bien deux opérations, pas un doublon.
    const content = [
      'Date operation;Libelle simplifie;Debit;Credit',
      '03/08/2026;CANTINE;-11,96;',
      '03/08/2026;CANTINE;-11,96;',
      '',
    ].join('\r\n');

    expect(parseOk(content).rows).toHaveLength(2);
  });

  it('accepte des fins de ligne LF', () => {
    const content = [HEADER, row(), ''].join('\n');

    expect(parseOk(content).rows).toHaveLength(1);
  });
});
