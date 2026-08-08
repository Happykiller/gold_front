import { OperationStatusQuery } from '@src/gql/graphql';

/**
 * Un statut d'opération : suivi, ou rapproché.
 *
 * Dérivé du type généré par le codegen. La version manuscrite déclarait
 * `active`, `creator_id`, `creation_date`, `modificator_id` et
 * `modification_date` — des champs que la requête ne demande pas et qui
 * n'arrivent donc jamais. Le typage décrivait une réponse imaginaire.
 */
export type OperationStatutUsecaseModel =
  OperationStatusQuery['operationStatus'][number];
