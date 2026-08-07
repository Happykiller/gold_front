import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { GetOperationUsecaseDto } from '@usecase/getOperation/getOperation.usecase.dto';
import { GetOperationUsecaseModel } from '@usecase/getOperation/getOperation.usecase.model';
import { GraphqlResponse } from '@service/graphql/graphql.response';
import { OperationQuery } from '@src/gql/graphql';

export class GetOperationUsecase {
  constructor(private inversify: Inversify) {}

  async execute(
    dto: GetOperationUsecaseDto,
  ): Promise<GetOperationUsecaseModel> {
    try {
      const response: GraphqlResponse<OperationQuery> =
        await this.inversify.graphqlService.send({
          operationName: 'operation',
          variables: dto,
          query: /* GraphQL */ `
            query operation($operation_id: Int!) {
              operation(dto: { operation_id: $operation_id }) {
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
        data: response.data.operation,
      };
    } catch (e: any) {
      return {
        message: CODES.FAIL,
        error: e.message,
      };
    }
  }
}
