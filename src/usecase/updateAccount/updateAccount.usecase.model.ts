import { UpdateAccountMutation } from '@src/gql/graphql';

export interface UpdateAccountUsecaseModel {
  message: string;
  data?: UpdateAccountMutation['updateAccount'];
  error?: string;
}
