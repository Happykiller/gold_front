// src\service\subscription\subscription.service.graphqlWs.ts
import { Client, createClient } from 'graphql-ws';

import config from '@src/config';
import { CLIENT_ID } from '@src/common/clientId';
import { Inversify } from '@src/common/inversify';
import {
  SubscriptionHandlers,
  SubscriptionRequest,
  SubscriptionService,
} from '@service/subscription/subscription.service';

/**
 * Le transport WebSocket, par le client `graphql-ws`.
 *
 * C'est la seule dépendance GraphQL du front, et elle n'en fait pas un client
 * GraphQL : `graphql-ws` implémente un **protocole**, il n'apporte ni cache, ni
 * normalisation, ni magie de rechargement. L'architecture « chaque usecase
 * écrit sa requête » reste entière.
 */
export class SubscriptionServiceGraphqlWs implements SubscriptionService {
  private client: Client | null = null;
  /**
   * Les écouteurs de reconnexion.
   *
   * `graphql-ws` rejoue les abonnements après une coupure, mais **ne rejoue pas
   * les événements émis pendant** : il n'y a pas de file d'attente. Un onglet
   * laissé en veille pendant un import raterait donc tout. Les écrans se
   * réabonnent à ce signal pour se resynchroniser une fois, plutôt que de
   * découvrir un jour un « bug intermittent » impossible à reproduire.
   */
  private readonly reconnectListeners = new Set<() => void>();
  private everConnected = false;

  constructor(private inversify: Inversify) {}

  private getClient(): Client {
    if (this.client) return this.client;

    this.client = createClient({
      url: config.ws_url,
      // La socket ne s'ouvre qu'au premier abonnement : jamais sur un écran
      // public, jamais avant la connexion de l'utilisateur.
      lazy: true,
      // Une **fonction**, pas un objet : elle est réévaluée à chaque
      // (re)connexion. Un objet figerait le jeton lu au chargement de la page,
      // et une reconnexion après renouvellement de session rejouerait un jeton
      // périmé.
      connectionParams: async () => {
        const stored = await this.inversify.storageService.getItem(
          config.local_storage_name,
        );
        const token = stored ? JSON.parse(stored)?.state?.access_token : null;
        return {
          Authorization: `Bearer ${token ?? 'token'}`,
          'x-gold-client': CLIENT_ID,
        };
      },
      // Borné, pas infini : tant qu'un reverse proxy ne relaie pas l'`Upgrade`,
      // une reconnexion perpétuelle hurlerait en console sans rien apporter —
      // et le harnais e2e traite une `console.error` comme un échec. Dix
      // tentatives suffisent largement à passer un redémarrage de l'API.
      retryAttempts: 10,
      // **`retryAttempts` seul ne suffit pas**, et c'est contre-intuitif : par
      // défaut, `graphql-ws` ne réessaie que sur un *événement de fermeture*.
      // Une API qui redémarre fait tomber la tentative suivante sur un
      // `ECONNRESET`, qui n'en est pas un — le client abandonne alors après une
      // seule tentative, abonnement compris, et l'onglet reste muet jusqu'au
      // prochain rechargement de page. Mesuré : sans cette ligne, un
      // `docker compose restart` de l'API suffit à tuer le temps réel.
      shouldRetry: () => true,
      on: {
        connected: () => {
          if (this.everConnected) {
            this.reconnectListeners.forEach((listener) => listener());
          }
          this.everConnected = true;
        },
      },
    });

    return this.client;
  }

  subscribe<TData>(
    request: SubscriptionRequest,
    handlers: SubscriptionHandlers<TData>,
  ): () => void {
    try {
      return this.getClient().subscribe<TData>(
        {
          operationName: request.operationName,
          query: request.query,
          variables: request.variables,
        },
        {
          next: (result) => {
            if (result.data) handlers.next(result.data);
          },
          // Un jeton expiré, une socket refusée : c'est une information de
          // diagnostic, pas une panne d'écran. En `error`, elle ferait échouer
          // le harnais e2e sur un cas parfaitement normal.
          error: (error) => {
            this.inversify.loggerService.debug(String(error));
            handlers.error?.(error);
          },
          complete: () => undefined,
        },
      );
    } catch (e) {
      this.inversify.loggerService.debug(String(e));
      return () => undefined;
    }
  }

  /** S'inscrire aux reconnexions. Rend la fonction de retrait. */
  onReconnected(listener: () => void): () => void {
    this.reconnectListeners.add(listener);
    return () => {
      this.reconnectListeners.delete(listener);
    };
  }
}
