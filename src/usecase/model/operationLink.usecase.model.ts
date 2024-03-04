export interface OperationLinkUsecaseModel {
  id: number;
  operation_id: number;
  operation_ref_id: number;
  active: boolean;
  creator_id: number;
  creation_date: string;
  modificator_id: number;
  modification_date: string;
}