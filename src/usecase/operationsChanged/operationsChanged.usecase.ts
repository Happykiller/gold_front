// src\usecase\operationsChanged\operationsChanged.usecase.ts
import { Inversify } from '@src/common/inversify';
import { OperationsChangedSubscription } from '@src/gql/graphql';
import { OperationsChangedEvent } from '@usecase/operationsChanged/operationsChanged.usecase.model';

/**
 * L'abonnement aux changements d'opérations.
 *
 * **Ce usecase ne suit pas le contrat `{ message, data }`** des autres, et ne
 * figure donc pas dans `usecase.contract.test.ts` : il n'a pas de réponse, il a
 * un flux. Ce qu'il partage avec eux et qui compte, c'est de **ne jamais
 * lever** — les écrans l'appellent sans `try/catch`.
 *
 * Le document vit ici, et non dans le service, pour la même raison que les
 * autres requêtes : c'est le seul endroit où le codegen va les chercher. Le
 * marqueur `/* GraphQL *\/` n'est pas décoratif — sans lui, la requête échappe
 * à `codegen:check`, donc à toute vérification contre le schéma.
 */
export class OperationsChangedUsecase {
  constructor(private inversify: Inversify) {}

  /** S'abonne et rend la fonction de désabonnement. */
  execute(onEvent: (event: OperationsChangedEvent) => void): () => void {
    return this.inversify.subscriptionService.subscribe<OperationsChangedSubscription>(
      {
        operationName: 'operationsChanged',
        query: /* GraphQL */ `
          subscription operationsChanged {
            operationsChanged {
              kind
              account_ids
              operation_ids
              origin
            }
          }
        `,
      },
      {
        next: (data) => onEvent(data.operationsChanged),
      },
    );
  }

  /** Voir `SubscriptionService.onReconnected`. */
  onReconnected(listener: () => void): () => void {
    return this.inversify.subscriptionService.onReconnected(listener);
  }
}
