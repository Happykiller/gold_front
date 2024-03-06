import { OperationUsecaseModel } from '@usecase/model/operation.usecase.model';

export interface CloneOperationsUsecaseModel {
  message: string;
  data?: OperationUsecaseModel[],
  error?: string;
}