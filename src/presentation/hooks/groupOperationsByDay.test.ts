import { describe, expect, it } from 'vitest';

import { groupOperationsByDay } from './groupOperationsByDay';
import type { Operation } from '@presentation/hooks/useAccountOperations';

/**
 * Une opération réduite à sa date, en millisecondes epoch **sous forme de
 * chaîne** — c'est exactement ce que renvoie l'API.
 */
const at = (iso: string, id = 0) =>
  ({ id, date: String(Date.parse(iso)) }) as unknown as Operation;

const keys = (ops: Operation[]) =>
  groupOperationsByDay(ops, 'fr-FR').map((group) => group.key);

describe('groupOperationsByDay', () => {
  it('rend un groupe par journée, dans l’ordre reçu', () => {
    const groups = groupOperationsByDay(
      [
        at('2026-08-07T10:00:00Z', 1),
        at('2026-08-07T09:00:00Z', 2),
        at('2026-08-06T18:00:00Z', 3),
        at('2026-08-05T08:00:00Z', 4),
      ],
      'fr-FR',
    );

    expect(groups.map((g) => g.key)).toEqual([
      '2026-08-07',
      '2026-08-06',
      '2026-08-05',
    ]);
    expect(groups[0].operations.map((o) => o.id)).toEqual([1, 2]);
  });

  it('ne coupe pas une journée répartie sur deux lots concaténés', () => {
    // L'invariant du chargement continu : les lots arrivent par 50 et une
    // journée tombe forcément à cheval. Le regroupement étant dérivé de la
    // liste accumulée complète, elle doit redonner un seul bandeau.
    const first = [
      at('2026-08-07T12:00:00Z', 1),
      at('2026-08-07T11:00:00Z', 2),
    ];
    const second = [
      at('2026-08-07T10:00:00Z', 3),
      at('2026-08-06T09:00:00Z', 4),
    ];

    const groups = groupOperationsByDay([...first, ...second], 'fr-FR');

    expect(groups).toHaveLength(2);
    expect(groups[0].operations.map((o) => o.id)).toEqual([1, 2, 3]);
  });

  it('rend un tableau vide sur une liste vide', () => {
    expect(keys([])).toEqual([]);
  });

  it('rend deux bandeaux pour deux suites non contiguës du même jour', () => {
    // Comportement documenté et assumé : on segmente des suites, on ne trie
    // pas. Un regroupement par clé fusionnerait ces deux suites et ferait
    // sauter la ligne du 06 au milieu du 07.
    expect(
      keys([
        at('2026-08-07T12:00:00Z', 1),
        at('2026-08-06T12:00:00Z', 2),
        at('2026-08-07T08:00:00Z', 3),
      ]),
    ).toEqual(['2026-08-07', '2026-08-06', '2026-08-07']);
  });

  it('interprète la date malgré son transport en chaîne', () => {
    // Sans `parseInt`, dayjs rend `Invalid Date` sans rien signaler, et la clé
    // vaudrait la même chose pour toutes les lignes — donc un seul bandeau.
    expect(
      keys([at('2026-08-07T12:00:00Z'), at('2026-01-02T12:00:00Z')]),
    ).toEqual(['2026-08-07', '2026-01-02']);
  });

  it('étiquette le bandeau dans la langue demandée', () => {
    const [fr] = groupOperationsByDay([at('2026-08-06T12:00:00Z')], 'fr-FR');
    const [en] = groupOperationsByDay([at('2026-08-06T12:00:00Z')], 'en-US');

    expect(fr.label).toContain('AOÛT');
    expect(en.label).toContain('AUGUST');
    // Majuscules : le bandeau doit se lire comme une rubrique, pas comme du
    // texte courant.
    expect(fr.label).toBe(fr.label.toUpperCase());
  });
});
