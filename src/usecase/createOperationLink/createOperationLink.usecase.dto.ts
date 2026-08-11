export interface CreateOperationLinkUsecaseDto {
  /**
   * Le virement **porteur** : celui qui prend l'autre en charge. C'est lui
   * qu'on est en train d'éditer.
   */
  operation_id: number;
  /**
   * L'opération **prise en charge** — la dépense que le virement couvre.
   *
   * Le sens n'est pas symétrique : l'inverser fait apparaître le virement dans
   * la section « pris en charge par » de la dépense, et rien dans celle du
   * virement.
   */
  operation_ref_id: number;
}
