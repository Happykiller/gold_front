import { OperationUsecaseModel } from '@usecase/model/operation.usecase.model';

export interface CreateOperationUsecaseModel {
  message: string;
  data?: OperationUsecaseModel,
  error?: string;
}