import { AccountUsecaseModel } from '../model/account.usecase.model';

export interface GetAccountsUsecaseModel {
  message: string;
  data?: AccountUsecaseModel[],
  error?: string;
}