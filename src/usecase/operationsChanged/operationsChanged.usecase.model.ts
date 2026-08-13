// src\usecase\operationsChanged\operationsChanged.usecase.model.ts
import { OperationsChangedSubscription } from '@src/gql/graphql';

/**
 * Dérivé, jamais réécrit à la main (loi 4) : le type suit le schéma sans
 * qu'on ait à y penser, et une divergence devient impossible plutôt que
 * seulement détectable.
 */
export type OperationsChangedEvent =
  OperationsChangedSubscription['operationsChanged'];
