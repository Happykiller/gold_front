import dayjs from 'dayjs';

import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { SetRecoUsecaseDto } from '@usecase/setReco/setReco.usecase.dto';
import { SetRecoUsecaseModel } from '@usecase/setReco/setReco.usecase.model';
import { GraphqlResponse } from '@service/graphql/graphql.response';
import { SetOperationReconciledMutation } from '@src/gql/graphql';

export class SetRecoUsecase {
  constructor(private inversify: Inversify) {}

  async execute(dto: SetRecoUsecaseDto): Promise<SetRecoUsecaseModel> {
    try {
      const response: GraphqlResponse<SetOperationReconciledMutation> =
        await this.inversify.graphqlService.send({
          operationName: 'setOperationReconciled',
          variables: {
            ...dto,
            date: dayjs().format('YYYY-MM-DD'),
          },
          query: /* GraphQL */ `
            mutation setOperationReconciled(
              $operation_id: Int!
              $date: String!
            ) {
              updateOperation(
                dto: { operation_id: $operation_id, status_id: 2, date: $date }
              ) {
                id
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
