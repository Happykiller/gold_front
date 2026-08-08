/**
 * Lecture d'une tranche d'opérations d'un compte.
 *
 * Le DTO parlait auparavant en numéro de `page`, et l'usecase le traduisait en
 * `offset` avec une taille de lot écrite en dur. La liste se consulte
 * maintenant en chargement continu : c'est l'appelant qui décide de la taille
 * du lot, et lui seul sait combien de lignes il a déjà.
 *
 * Les critères de filtrage sont tous optionnels et arrivent en identifiants —
 * la résolution des libellés se fait dans `searchTokens.ts`.
 */
export interface GetOperationsUsecaseDto {
  account_id: number;
  limit: number;
  offset: number;

  category_ids?: number[];
  third_ids?: number[];
  dest_account_ids?: number[];
  type_ids?: number[];
  status_ids?: number[];
  description?: string;
  text?: string;
  amount_min?: number;
  amount_max?: number;
  date_from?: string;
  date_to?: string;
}
