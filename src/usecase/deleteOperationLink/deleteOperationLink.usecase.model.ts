import { DeleteOperationLinkMutation } from '@src/gql/graphql';

export interface DeleteOperationLinkUsecaseModel {
  message: string;
  data?: DeleteOperationLinkMutation['deleteOperationLink'];
  error?: string;
}
