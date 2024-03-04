import { OperationUsecaseModel } from '@usecase/model/operation.usecase.model';

export interface SetRecoUsecaseModel {
  message: string;
  data?: OperationUsecaseModel,
  error?: string;
}