export interface AccountUsecaseModel {
  id: number
  type_id: number
  parent_account_id: number
  label: string
  description: string
  balance_reconcilied: number
  balance_not_reconcilied: number
  active: boolean
  creator_id: number
  creation_date: string
  modificator_id: number
  modification_date: string
}