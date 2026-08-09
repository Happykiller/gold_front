import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { DeleteOperationLinkUsecaseDto } from '@usecase/deleteOperationLink/deleteOperationLink.usecase.dto';
import { DeleteOperationLinkUsecaseModel } from '@usecase/deleteOperationLink/deleteOperationLink.usecase.model';
import { GraphqlResponse } from '@service/graphql/graphql.response';
import { DeleteOperationLinkMutation } from '@src/gql/graphql';

export class DeleteOperationLinkUsecase {
  constructor(private inversify: Inversify) {}

  async execute(
    dto: DeleteOperationLinkUsecaseDto,
  ): Promise<DeleteOperationLinkUsecaseModel> {
    try {
      const response: GraphqlResponse<DeleteOperationLinkMutation> =
        await this.inversify.graphqlService.send({
          operationName: 'deleteOperationLink',
          variables: dto,
          query: /* GraphQL */ `
            mutation deleteOperationLink($operation_link_id: Int!) {
              deleteOperationLink(
                dto: { operation_link_id: $operation_link_id }
              )
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
        data: response.data.deleteOperationLink,
      };
    } catch (e: any) {
      return {
        message: CODES.FAIL,
        error: e.message,
      };
    }
  }
}
