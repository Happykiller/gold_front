export interface OperationUsecaseModel {
  id: number;
  account_id: number;
  account: {
    id: number;
    label: string;
  }
  account_id_dest: number;
  account_dest: {
    id: number;
    label: string;
  }
  amount: number;
  date: string;
  status_id: number;
  type_id: number;
  third_id: number;
  third: {
    id: number;
    label: string;
  }
  category_id: number;
  category: {
    id: number;
    label: string;
  }
  description: string;
  active: boolean;
  creator_id: number;
  creation_date: string;
  modificator_id: number;
  modification_date: string;
}