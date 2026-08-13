// src\service\subscription\subscription.service.ts
/**
 * Le pendant temps réel de `GraphqlService`.
 *
 * Même philosophie que le reste du front : aucun client GraphQL, aucun cache à
 * invalider. Le service ne fait que transporter un document et rendre ce qui
 * arrive ; ce sont les écrans qui décident quoi recharger, avec les requêtes
 * qu'ils utilisent déjà.
 */
export interface SubscriptionRequest {
  operationName: string;
  query: string;
  variables?: Record<string, unknown>;
}

export interface SubscriptionHandlers<TData> {
  next: (data: TData) => void;
  error?: (error: unknown) => void;
}

export interface SubscriptionService {
  /**
   * Ouvre un abonnement et rend la fonction de désabonnement.
   *
   * **Ne lève jamais** : les écrans appellent sans `try/catch`, comme pour les
   * usecases. Un transport indisponible rend une fonction inerte, il ne casse
   * pas l'écran.
   */
  subscribe<TData>(
    request: SubscriptionRequest,
    handlers: SubscriptionHandlers<TData>,
  ): () => void;

  /**
   * Prévient quand la connexion a été **rétablie** après une coupure, et rend
   * la fonction de retrait.
   *
   * Les événements émis pendant la coupure sont perdus — le protocole ne les
   * rejoue pas. Un écran s'y raccroche pour se resynchroniser une fois, au lieu
   * de rester silencieusement en retard.
   */
  onReconnected(listener: () => void): () => void;
}
