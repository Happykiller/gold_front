// src\presentation\hooks\operationsChanged.ts
import type { OperationsChangedEvent } from '@usecase/operationsChanged/operationsChanged.usecase.model';

/**
 * Ce qu'un écran fait d'un événement de changement d'opérations.
 *
 * Module **sans import de valeur** — seul un `import type`, effacé à la
 * compilation. Il ne traverse donc pas le conteneur d'injection et reste
 * testable sous Vitest, contrairement au hook qui l'emploie (voir
 * `docs/KB/DAT/injection-dependances.md`).
 */

/** Ce qu'attend la liste des opérations pour trancher. */
export interface DecideContext {
  /** Le compte affiché. */
  accountId: number;
  /** L'identité de cet onglet — voir `common/clientId.ts`. */
  clientId: string;
  /** L'utilisateur est-il en tête de liste ? */
  atTop: boolean;
}

export type Decision = 'ignore' | 'reload' | 'pending';

/**
 * `ignore` — l'événement vient de cet onglet, ou d'un autre compte.
 * `reload`  — on est en tête de liste : rien ne bouge sous les yeux.
 * `pending` — on a fait défiler : on annonce, on ne recharge pas.
 */
export function decide(
  event: OperationsChangedEvent,
  { accountId, clientId, atTop }: DecideContext,
): Decision {
  // L'écho de ses propres écritures : l'écran les a déjà appliquées, parfois de
  // façon optimiste. Recharger les écraserait et ferait remonter la liste.
  if (event.origin === clientId) return 'ignore';
  if (!concernsAccount(event, accountId)) return 'ignore';
  return atTop ? 'reload' : 'pending';
}

/**
 * L'événement touche-t-il le compte affiché ?
 *
 * **Une liste de comptes vide veut dire « inconnu », pas « aucun »** : la
 * suppression d'une opération et les liens ne rendent rien d'exploitable côté
 * serveur. On recharge alors plutôt que d'ignorer — un rafraîchissement de trop
 * ne coûte qu'une requête, un rafraîchissement manqué laisse un écran faux.
 */
export function concernsAccount(
  event: OperationsChangedEvent,
  accountId: number,
): boolean {
  return (
    event.account_ids.length === 0 || event.account_ids.includes(accountId)
  );
}

/** Ce qui attend d'être rechargé, tel qu'on l'annonce à l'utilisateur. */
export interface PendingChanges {
  /** Opérations distinctes touchées depuis le dernier rafraîchissement. */
  ids: number[];
  /**
   * Nombre d'événements cumulés. Nécessaire parce qu'un événement peut ne
   * porter aucun identifiant d'opération — un lien posé, par exemple — et que
   * compter les seuls identifiants annoncerait alors « 0 » sur un bandeau
   * pourtant affiché.
   */
  events: number;
  /**
   * `new` tant que tout ce qui attend est une création ; `changed` dès qu'une
   * modification ou une suppression s'en mêle. Annoncer « 3 nouvelles
   * opérations » pour trois suppressions serait faux.
   */
  kind: 'new' | 'changed';
}

export const NO_PENDING: PendingChanges = { ids: [], events: 0, kind: 'new' };

/** Cumule un événement dans ce qui attend, sans doublon d'opération. */
export function mergePending(
  pending: PendingChanges,
  event: OperationsChangedEvent,
): PendingChanges {
  const ajout = event.kind === 'created' || event.kind === 'cloned';
  return {
    ids: [...new Set([...pending.ids, ...event.operation_ids])],
    events: pending.events + 1,
    kind: pending.kind === 'new' && ajout ? 'new' : 'changed',
  };
}

/** Combien d'opérations annoncer : ce qu'on sait, à défaut ce qu'on a compté. */
export function pendingCount(pending: PendingChanges): number {
  return pending.ids.length > 0 ? pending.ids.length : pending.events;
}
