import { CloneOperationsMutation } from '@src/gql/graphql';

/**
 * Les opérations clonées, telles que la mutation les renvoie.
 */
export interface CloneOperationsUsecaseModel {
  message: string;
  data?: CloneOperationsMutation['cloneOperations'];
  error?: string;
}
