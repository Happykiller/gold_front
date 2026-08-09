import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { GetOperationsUsecaseDto } from '@usecase/getOperations/getOperations.usecase.dto';
import { GetOperationsUsecaseModel } from '@usecase/getOperations/getOperations.usecase.model';
import { GraphqlResponse } from '@service/graphql/graphql.response';
import { OperationsQuery } from '@src/gql/graphql';

export class GetOperationsUsecase {
  constructor(private inversify: Inversify) {}

  async execute(
    dto: GetOperationsUsecaseDto,
  ): Promise<GetOperationsUsecaseModel> {
    try {
      const response: GraphqlResponse<OperationsQuery> =
        await this.inversify.graphqlService.send({
          operationName: 'operations',
          variables: { ...dto },
          // `limit` était un littéral dans la requête : la taille du lot était
          // donc figée ici autant que dans le calcul de l'offset. En variable,
          // elle redevient une décision de l'appelant.
          //
          // Les critères de filtrage sont tous nullables : une requête sans
          // aucun d'eux produit exactement la requête d'avant la recherche.
          query: /* GraphQL */ `
            query operations(
              $account_id: Int!
              $limit: Int!
              $offset: Int!
              $category_ids: [Int!]
              $third_ids: [Int!]
              $dest_account_ids: [Int!]
              $type_ids: [Int!]
              $status_ids: [Int!]
              $description: String
              $text: String
              $amount_min: Float
              $amount_max: Float
              $date_from: String
              $date_to: String
            ) {
              operations(
                dto: {
                  account_id: $account_id
                  limit: $limit
                  offset: $offset
                  category_ids: $category_ids
                  third_ids: $third_ids
                  dest_account_ids: $dest_account_ids
                  type_ids: $type_ids
                  status_ids: $status_ids
                  description: $description
                  text: $text
                  amount_min: $amount_min
                  amount_max: $amount_max
                  date_from: $date_from
                  date_to: $date_to
                }
              ) {
                id
                account_id
                account {
                  id
                  label
                }
                account_id_dest
                account_dest {
                  id
                  label
                }
                amount
                vat_rate
                date
                status_id
                type_id
                third_id
                third {
                  id
                  label
                }
                category_id
                category {
                  id
                  label
                }
                description
                creator_id
                creation_date
                modificator_id
                modification_date
                # Deux compteurs, calculés par la même requête SQL que les
                # lignes : la liste marque les opérations prises en charge sans
                # un seul aller-retour de plus.
                linked_count
                linked_by_count
              }
            }
          `,
        });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      // Le serveur peut répondre sans `data` (erreur d'authentification,
      // réponse tronquée) : sans cette garde, l'accès plus bas lèverait un
      // TypeError peu lisible au lieu d'un échec explicite.
      if (!response.data) {
        throw new Error('Réponse GraphQL sans données');
      }

      return {
        message: CODES.SUCCESS,
        data: response.data.operations,
      };
    } catch (e: any) {
      return {
        message: CODES.FAIL,
        error: e.message,
      };
    }
  }
}
