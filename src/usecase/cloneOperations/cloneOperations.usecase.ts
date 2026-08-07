import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { CloneOperationsUsecaseDto } from '@usecase/cloneOperations/cloneOperations.usecase.dto';
import { CloneOperationsUsecaseModel } from '@usecase/cloneOperations/cloneOperations.usecase.model';
import { GraphqlResponse } from '@service/graphql/graphql.response';
import { CloneOperationsMutation } from '@src/gql/graphql';

export class CloneOperationsUsecase {
  constructor(private inversify: Inversify) {}

  async execute(
    dto: CloneOperationsUsecaseDto,
  ): Promise<CloneOperationsUsecaseModel> {
    try {
      const response: GraphqlResponse<CloneOperationsMutation> =
        await this.inversify.graphqlService.send({
          operationName: 'cloneOperations',
          variables: dto,
          query: /* GraphQL */ `
            mutation cloneOperations(
              $account_id: Int!
              $template_account_id: Int!
              $date: String!
            ) {
              cloneOperations(
                dto: {
                  account_id: $account_id
                  template_account_id: $template_account_id
                  date: $date
                }
              ) {
                id
                account_id
                account_id_dest
                amount
                date
                status_id
                type_id
                third_id
                category_id
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
        data: response.data.cloneOperations,
      };
    } catch (e: any) {
      return {
        message: CODES.CLONE_OPERATION_FAIL,
        error: e.message,
      };
    }
  }
}
