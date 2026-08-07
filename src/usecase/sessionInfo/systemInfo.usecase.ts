import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { SessionInfoUsecaseModel } from '@usecase/sessionInfo/model/sessionInfo.usecase.model';
import { GraphqlResponse } from '@service/graphql/graphql.response';
import { GetSessionInfoQuery } from '@src/gql/graphql';

export class SessionInfoUsecase {
  SessionInfo: any;

  constructor(private inversify: Inversify) {}

  async execute(): Promise<SessionInfoUsecaseModel> {
    try {
      const response: GraphqlResponse<GetSessionInfoQuery> =
        await this.inversify.graphqlService.send({
          operationName: 'getSessionInfo',
          variables: {},
          query: /* GraphQL */ `
            query getSessionInfo {
              getSessionInfo {
                access_token
                id
                code
                name_first
                name_last
                description
                mail
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

      const info: any = {
        ...response.data.getSessionInfo,
        access_token: response.data.getSessionInfo.access_token,
      };

      return {
        message: CODES.SUCCESS,
        data: info,
      };
    } catch (e: any) {
      return {
        message: CODES.FAIL,
        error: e.message,
      };
    }
  }
}
