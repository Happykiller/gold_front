import { CreateOperationMutation } from '@src/gql/graphql';

/**
 * L'opération créée, telle que la mutation la renvoie.
 */
export interface CreateOperationUsecaseModel {
  message: string;
  data?: CreateOperationMutation['createOperation'];
  error?: string;
}
