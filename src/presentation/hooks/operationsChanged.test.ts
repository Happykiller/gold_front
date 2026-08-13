import { describe, expect, it } from 'vitest';

import {
  concernsAccount,
  decide,
  mergePending,
  NO_PENDING,
  pendingCount,
} from '@presentation/hooks/operationsChanged';
import type { OperationsChangedEvent } from '@usecase/operationsChanged/operationsChanged.usecase.model';

const evenement = (
  partiel: Partial<OperationsChangedEvent> = {},
): OperationsChangedEvent => ({
  kind: 'created',
  account_ids: [2],
  operation_ids: [10],
  origin: 'un-autre-onglet',
  ...partiel,
});

const contexte = { accountId: 2, clientId: 'moi', atTop: true };

describe('decide', () => {
  it("ignore l'écho de ses propres écritures", () => {
    // Sans cela, pointer une opération depuis la liste ferait revenir un
    // événement provoqué par soi-même : la liste se rechargerait et remonterait
    // en tête, en écrasant la mise à jour locale.
    expect(decide(evenement({ origin: 'moi' }), contexte)).toBe('ignore');
  });

  it('ignore un événement qui vise un autre compte', () => {
    expect(decide(evenement({ account_ids: [7] }), contexte)).toBe('ignore');
  });

  it('recharge quand on est en tête de liste', () => {
    expect(decide(evenement(), contexte)).toBe('reload');
  });

  it("met en attente quand l'utilisateur a fait défiler", () => {
    expect(decide(evenement(), { ...contexte, atTop: false })).toBe('pending');
  });

  it('recharge sur un événement sans compte connu, même en tête', () => {
    // `account_ids` vide veut dire « inconnu », pas « aucun » : c'est le cas
    // d'une suppression, qui ne rend rien d'exploitable côté serveur.
    expect(decide(evenement({ account_ids: [] }), contexte)).toBe('reload');
  });
});

describe('concernsAccount', () => {
  it("reconnaît le compte de destination d'un virement", () => {
    expect(concernsAccount(evenement({ account_ids: [7, 2] }), 2)).toBe(true);
  });

  it('traite une liste vide comme « inconnu », donc concernant', () => {
    expect(concernsAccount(evenement({ account_ids: [] }), 2)).toBe(true);
  });
});

describe('mergePending', () => {
  it('cumule sans compter deux fois la même opération', () => {
    const un = mergePending(NO_PENDING, evenement({ operation_ids: [10, 11] }));
    const deux = mergePending(un, evenement({ operation_ids: [11, 12] }));
    expect(deux.ids).toEqual([10, 11, 12]);
    expect(pendingCount(deux)).toBe(3);
  });

  it('reste « new » tant que tout est création ou clonage', () => {
    const un = mergePending(NO_PENDING, evenement({ kind: 'created' }));
    const deux = mergePending(un, evenement({ kind: 'cloned' }));
    expect(deux.kind).toBe('new');
  });

  it("bascule en « changed » dès qu'une suppression s'en mêle", () => {
    // Annoncer « 2 nouvelles opérations » alors que l'une a été supprimée
    // serait faux, et le bandeau est précisément là pour dire quoi attendre.
    const un = mergePending(NO_PENDING, evenement({ kind: 'created' }));
    const deux = mergePending(un, evenement({ kind: 'deleted' }));
    expect(deux.kind).toBe('changed');
  });

  it('ne redevient jamais « new » après un changement', () => {
    const un = mergePending(NO_PENDING, evenement({ kind: 'updated' }));
    const deux = mergePending(un, evenement({ kind: 'created' }));
    expect(deux.kind).toBe('changed');
  });
});

describe('pendingCount', () => {
  it("compte les événements quand aucune opération n'est nommée", () => {
    // Un lien posé ne porte pas toujours d'identifiant : compter les seuls
    // identifiants afficherait « 0 » sur une pastille pourtant visible.
    const un = mergePending(NO_PENDING, evenement({ operation_ids: [] }));
    const deux = mergePending(un, evenement({ operation_ids: [] }));
    expect(pendingCount(deux)).toBe(2);
  });

  it("ne compte rien quand rien n'attend", () => {
    expect(pendingCount(NO_PENDING)).toBe(0);
  });
});
