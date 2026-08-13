// src\presentation\hooks\useOperationsChanged.ts
import { useEffect, useRef } from 'react';

import inversify from '@src/common/inversify';
import type { OperationsChangedEvent } from '@usecase/operationsChanged/operationsChanged.usecase.model';

/**
 * Délai de coalescence.
 *
 * **Il n'est pas cosmétique.** L'extension importe en envoyant *une mutation
 * `createOperation` par ligne* : sans regroupement, un relevé de quarante
 * lignes produirait quarante événements, donc quarante rechargements complets
 * — quatre-vingts requêtes GraphQL et une liste qui clignote. C'est exactement
 * le scénario qui a motivé ce chantier.
 */
const COALESCE_MS = 400;

/**
 * S'abonne aux changements d'opérations et livre les événements par paquets.
 *
 * Ce hook n'est que du câblage : toute la décision vit dans
 * `operationsChanged.ts`, module pur et testable. Lui traverse le conteneur
 * d'injection, donc Vitest ne peut pas le charger.
 */
export function useOperationsChanged(
  onEvents: (events: OperationsChangedEvent[]) => void,
  onReconnected?: () => void,
) {
  // Par une ref : l'appelant recrée sa callback à chaque rendu, et la prendre
  // en dépendance d'effet ferait fermer puis rouvrir l'abonnement en boucle.
  const handlerRef = useRef(onEvents);
  handlerRef.current = onEvents;
  const reconnectRef = useRef(onReconnected);
  reconnectRef.current = onReconnected;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lot: OperationsChangedEvent[] = [];

    const livrer = () => {
      timer = null;
      const paquet = lot;
      lot = [];
      if (paquet.length > 0) handlerRef.current(paquet);
    };

    const unsubscribe = inversify.operationsChangedUsecase.execute((event) => {
      lot.push(event);
      if (timer === null) timer = setTimeout(livrer, COALESCE_MS);
    });

    const unwatch = inversify.operationsChangedUsecase.onReconnected(() => {
      reconnectRef.current?.();
    });

    return () => {
      if (timer !== null) clearTimeout(timer);
      unsubscribe();
      unwatch();
    };
  }, []);
}
