import { CreateOperationLinkMutation } from '@src/gql/graphql';

export interface CreateOperationLinkUsecaseModel {
  message: string;
  data?: CreateOperationLinkMutation['createOperationLink'];
  error?: string;
}
