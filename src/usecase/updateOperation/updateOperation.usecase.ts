import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { OperationUsecaseModel } from '@usecase/model/operation.usecase.model';
import { UpdateOperationUsecaseModel } from '@usecase/updateOperation/updateOperation.usecase.mode';
import { GraphqlResponse } from '@service/graphql/graphql.response';
import { UpdateOperationMutation } from '@src/gql/graphql';

export class UpdateOperationUsecase {
  constructor(private inversify: Inversify) {}

  async execute(
    dto: OperationUsecaseModel,
  ): Promise<UpdateOperationUsecaseModel> {
    try {
      const finalDto: any = {
        operation_id: dto.id,
        ...dto,
      };

      const response: GraphqlResponse<UpdateOperationMutation> =
        await this.inversify.graphqlService.send({
          operationName: 'updateOperation',
          variables: finalDto,
          query: /* GraphQL */ `
            mutation updateOperation(
              $operation_id: Int!
              $account_id: Int!
              $account_id_dest: Int
              $amount: Float!
              $vat_rate: Float
              $status_id: Int!
              $type_id: Int!
              $third_id: Int!
              $category_id: Int!
              $description: String
              $date: String!
            ) {
              updateOperation(
                dto: {
                  operation_id: $operation_id
                  account_id: $account_id
                  account_id_dest: $account_id_dest
                  amount: $amount
                  vat_rate: $vat_rate
                  status_id: $status_id
                  type_id: $type_id
                  third_id: $third_id
                  category_id: $category_id
                  description: $description
                  date: $date
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
                # Le retour d'une mise à jour alimente les mêmes écrans que la
                # liste : sans ces deux champs, son type ne serait plus celui
                # d'une opération.
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
        data: response.data.updateOperation,
      };
    } catch (e: any) {
      return {
        message: CODES.FAIL,
        error: e.message,
      };
    }
  }
}
