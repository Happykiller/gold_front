import { OperationQuery } from '@src/gql/graphql';

/**
 * Une opération telle que la requête `operation` la renvoie — c'est-à-dire avec
 * ses liens, que la liste ne demande pas.
 *
 * Dérivé de `OperationQuery` et non de `OperationsQuery` : les deux requêtes ne
 * sélectionnent pas les mêmes champs, et emprunter le type de la liste faisait
 * disparaître `linked_operations` et `linked_by_operations` du typage alors que
 * le serveur les renvoie.
 */
export type OperationDetailUsecaseModel = OperationQuery['operation'];

/** Une opération vue depuis un lien, dans un sens ou dans l'autre. */
export type LinkedOperationUsecaseModel =
  OperationDetailUsecaseModel['linked_operations'][number];

export interface GetOperationUsecaseModel {
  message: string;
  data?: OperationDetailUsecaseModel;
  error?: string;
}
