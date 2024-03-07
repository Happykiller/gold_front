import { OperationUsecaseModel } from '@usecase/model/operation.usecase.model';

export interface GetOperationUsecaseModel {
  message: string;
  data?: OperationUsecaseModel,
  error?: string;
}