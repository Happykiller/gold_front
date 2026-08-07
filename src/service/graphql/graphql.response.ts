/**
 * Enveloppe d'une réponse GraphQL.
 *
 * `graphqlService.send()` vient de sunny-ui et renvoie `any` : le front n'a
 * pas de client GraphQL qui typerait le retour. Ce type sert à ré-attacher le
 * résultat du codegen (`src/gql/graphql.ts`) à ce que reçoit un usecase, sans
 * changer l'architecture.
 *
 * `data` est optionnel : sur une erreur d'authentification, le serveur répond
 * avec `errors` et sans `data`.
 */
export interface GraphqlResponse<TData> {
  data?: TData;
  errors?: { message: string }[];
}
