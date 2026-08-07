/**
 * Lecture d'une tranche d'opérations d'un compte.
 *
 * Le DTO parlait auparavant en numéro de `page`, et l'usecase le traduisait en
 * `offset` avec une taille de lot écrite en dur. La liste se consulte
 * maintenant en chargement continu : c'est l'appelant qui décide de la taille
 * du lot, et lui seul sait combien de lignes il a déjà.
 */
export interface GetOperationsUsecaseDto {
  account_id: number;
  limit: number;
  offset: number;
}
