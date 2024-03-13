import { OperationTypeUsecaseModel } from '@usecase/model/operationType.usecase.model';

export interface GetOpeTypesUsecaseModel {
  message: string;
  data?: OperationTypeUsecaseModel[],
  error?: string;
}