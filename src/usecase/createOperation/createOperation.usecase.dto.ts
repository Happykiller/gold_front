export interface CreateOperationUsecaseDto {
  amount: number
  date: string
  description: string
  account_id: number
  account_dest_id?: number
  status_id: number
  type_id: number
  third_id: number
  category_id: number
}