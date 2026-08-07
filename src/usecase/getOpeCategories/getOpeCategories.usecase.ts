import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { OperationCategoryUsecaseModel } from '@usecase/model/operationCategory.usecase.model';
import { GetOpeCategoriesUsecaseModel } from '@usecase/getOpeCategories/getOpeCategories.usecase.model';
import { GraphqlResponse } from '@service/graphql/graphql.response';
import { OperationCategoriesQuery } from '@src/gql/graphql';

export class GetOpeCategoriesUsecase {
  constructor(private inversify: Inversify) {}

  categories: OperationCategoryUsecaseModel[] = [];

  async execute(): Promise<GetOpeCategoriesUsecaseModel> {
    try {
      if (this.categories.length === 0) {
        const response: GraphqlResponse<OperationCategoriesQuery> =
          await this.inversify.graphqlService.send({
            operationName: 'operationCategories',
            variables: {},
            query: /* GraphQL */ `
              query operationCategories {
                operationCategories {
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

        this.categories = response.data.operationCategories.sort(
          (
            elt1: OperationCategoryUsecaseModel,
            elt2: OperationCategoryUsecaseModel,
          ) => elt1.label.localeCompare(elt2.label),
        );
      }

      return {
        message: CODES.SUCCESS,
        data: this.categories,
      };
    } catch (e: any) {
      return {
        message: CODES.FAIL,
        error: e.message,
      };
    }
  }
}
