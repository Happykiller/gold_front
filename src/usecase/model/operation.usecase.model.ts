export interface OperationUsecaseModel {
  id: number;
  account_id: number;
  account: {
    id: number;
    lable: string;
  }
  account_id_dest: number;
  account_dest: {
    id: number;
    lable: string;
  }
  amount: number;
  date: string;
  status_id: number;
  type_id: number;
  third_id: number;
  third: {
    id: number;
    lable: string;
  }
  category_id: number;
  ategory: {
    id: number;
    lable: string;
  }
  description: string;
  active: boolean;
  creator_id: number;
  creation_date: string;
  modificator_id: number;
  modification_date: string;
}