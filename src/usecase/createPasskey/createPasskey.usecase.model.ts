import { PasskeyUsecaseModel } from '@usecase/model/passkey.usecase.model';

export interface CreatePasskeyUsecaseModel {
  message: string;
  data?: PasskeyUsecaseModel,
  error?: string;
}