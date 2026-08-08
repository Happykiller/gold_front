import { OperationStatutUsecaseModel } from '@usecase/model/operationStatut.usecase.model';

export interface GetOpeStatusUsecaseModel {
  message: string;
  data?: OperationStatutUsecaseModel[];
  error?: string;
}
