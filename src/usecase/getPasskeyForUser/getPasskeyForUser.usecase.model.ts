import { PasskeyUsecaseModel } from '@usecase/model/passkey.usecase.model';

export interface GetPasskeyForUserUsecaseModel {
  message: string;
  data?: PasskeyUsecaseModel[],
  error?: string;
}