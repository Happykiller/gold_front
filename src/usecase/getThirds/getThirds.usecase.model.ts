import { OperationThridUsecaseModel } from "@usecase/model/operationThrid.usecase.model";

export interface GetThirdsUsecaseModel {
  message: string;
  data?: OperationThridUsecaseModel[],
  error?: string;
}