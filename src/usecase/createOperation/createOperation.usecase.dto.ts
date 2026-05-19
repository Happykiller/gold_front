export interface CreateOperationUsecaseDto {
  amount: number
  vat_rate?: number
  date: string
  description: string
  account_id: number
  account_id_dest?: number
  status_id: number
  type_id: number
  third_id: number
  category_id: number
  linkedOps?: any[]
}
