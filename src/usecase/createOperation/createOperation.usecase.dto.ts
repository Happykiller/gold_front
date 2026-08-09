export interface CreateOperationUsecaseDto {
  amount: number;
  vat_rate?: number;
  date: string;
  description: string;
  account_id: number;
  account_id_dest?: number;
  status_id: number;
  type_id: number;
  third_id: number;
  category_id: number;
  /**
   * Les opérations que ce virement prend en charge.
   *
   * Le champ s'appelait `linkedOps`, était typé `any[]`, et n'apparaissait dans
   * aucune variable de la mutation : `createVir` le renseignait
   * consciencieusement et le serveur ne l'a jamais vu. C'est cette valeur jetée
   * en silence qui a fait disparaître la fonctionnalité début 2024.
   */
  linked_operation_ids?: number[];
}
