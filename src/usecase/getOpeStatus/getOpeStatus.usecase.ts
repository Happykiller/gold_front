import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { OperationStatutUsecaseModel } from '@usecase/model/operationStatut.usecase.model';
import { GetOpeStatusUsecaseModel } from '@usecase/getOpeStatus/getOpeStatus.usecase.model';
import { GraphqlResponse } from '@service/graphql/graphql.response';
import { OperationStatusQuery } from '@src/gql/graphql';

export class GetOpeStatusUsecase {
  constructor(private inversify: Inversify) {}

  // Référentiel fermé de deux entrées, mis en cache comme les autres : il est
  // relu à chaque saisie dans la barre de recherche.
  status: OperationStatutUsecaseModel[] = [];

  async execute(): Promise<GetOpeStatusUsecaseModel> {
    try {
      if (this.status.length === 0) {
        const response: GraphqlResponse<OperationStatusQuery> =
          await this.inversify.graphqlService.send({
            operationName: 'operationStatus',
            variables: {},
            query: /* GraphQL */ `
              query operationStatus {
                operationStatus {
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

        this.status = response.data.operationStatus.sort(
          (
            elt1: OperationStatutUsecaseModel,
            elt2: OperationStatutUsecaseModel,
          ) => elt1.label.localeCompare(elt2.label),
        );
      }

      return {
        message: CODES.SUCCESS,
        data: this.status,
      };
    } catch (e: any) {
      return {
        message: CODES.FAIL,
        error: e.message,
      };
    }
  }
}
