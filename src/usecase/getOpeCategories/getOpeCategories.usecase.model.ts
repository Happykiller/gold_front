import { OperationCategoryUsecaseModel } from '@usecase/model/operationCategory.usecase.model';

export interface GetOpeCategoriesUsecaseModel {
  message: string;
  data?: OperationCategoryUsecaseModel[],
  error?: string;
}