import { OperationUsecaseModel } from '@usecase/model/operation.usecase.model';

export interface UpdateOperationUsecaseModel {
  message: string;
  data?: OperationUsecaseModel,
  error?: string;
}