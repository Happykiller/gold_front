export interface DeleteOperationLinkUsecaseDto {
  /**
   * L'identifiant du LIEN, et non celui de l'opération : une même opération
   * peut être prise en charge par plusieurs virements, seul le lien désigne
   * sans ambiguïté ce qu'on retire.
   */
  operation_link_id: number;
}
