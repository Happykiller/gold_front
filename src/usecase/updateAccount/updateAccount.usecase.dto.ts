/**
 * Mise à jour partielle d'un compte : seul l'identifiant est requis, les
 * autres champs ne sont envoyés que s'ils changent.
 *
 * L'API accepte aussi `description` et `parent_account_id`. Ils ne sont pas
 * exposés ici : le second réorganise la hiérarchie, donc l'agrégation des
 * soldes, ce qui mérite son propre écran plutôt qu'un champ de formulaire.
 */
export interface UpdateAccountUsecaseDto {
  account_id: number;
  label?: string;
  type_id?: number;
}
