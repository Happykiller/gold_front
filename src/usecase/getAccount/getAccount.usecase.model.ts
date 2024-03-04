import { AccountUsecaseModel } from '../model/account.usecase.model';

export interface GetAccountUsecaseModel {
  message: string;
  data?: AccountUsecaseModel,
  error?: string;
}