// src\service\subscription\subscription.service.fake.ts
import {
  SubscriptionHandlers,
  SubscriptionRequest,
  SubscriptionService,
} from '@service/subscription/subscription.service';

/**
 * Le service d'abonnement en mode factice : il n'émet jamais rien.
 *
 * C'est le comportement voulu, pas un manque. En mode `mock`, le front tourne
 * sans serveur : il n'y a pas de socket à ouvrir, et un faux flux d'événements
 * ferait recharger des écrans qui lisent déjà des données figées.
 */
export class SubscriptionServiceFake implements SubscriptionService {
  subscribe<TData>(
    _request: SubscriptionRequest,
    _handlers: SubscriptionHandlers<TData>,
  ): () => void {
    return () => undefined;
  }

  onReconnected(_listener: () => void): () => void {
    return () => undefined;
  }
}
