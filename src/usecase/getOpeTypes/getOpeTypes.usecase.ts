import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { OperationTypeUsecaseModel } from '@usecase/model/operationType.usecase.model';
import { GetOpeTypesUsecaseModel } from '@usecase/getOpeTypes/getOpeTypes.usecase.model';
import { GraphqlResponse } from '@service/graphql/graphql.response';
import { OperationTypesQuery } from '@src/gql/graphql';

export class GetOpeTypesUsecase {
  constructor(private inversify: Inversify) {}

  types: OperationTypeUsecaseModel[] = [];

  async execute(): Promise<GetOpeTypesUsecaseModel> {
    try {
      if (this.types.length === 0) {
        const response: GraphqlResponse<OperationTypesQuery> =
          await this.inversify.graphqlService.send({
            operationName: 'operationTypes',
            variables: {},
            query: /* GraphQL */ `
              query operationTypes {
                operationTypes {
                  id
                  label
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

        this.types = response.data.operationTypes.sort(
          (elt1: OperationTypeUsecaseModel, elt2: OperationTypeUsecaseModel) =>
            elt1.label.localeCompare(elt2.label),
        );
      }

      return {
        message: CODES.SUCCESS,
        data: this.types,
      };
    } catch (e: any) {
      return {
        message: CODES.FAIL,
        error: e.message,
      };
    }
  }
}
