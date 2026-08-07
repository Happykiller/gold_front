import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { GetAccountUsecaseDto } from '@usecase/getAccount/getAccount.usecase.dto';
import { GetAccountUsecaseModel } from '@usecase/getAccount/getAccount.usecase.model';
import { GraphqlResponse } from '@service/graphql/graphql.response';
import { AccountQuery } from '@src/gql/graphql';

export class GetAccountUsecase {
  constructor(private inversify: Inversify) {}

  async execute(dto: GetAccountUsecaseDto): Promise<GetAccountUsecaseModel> {
    try {
      const response: GraphqlResponse<AccountQuery> =
        await this.inversify.graphqlService.send({
          operationName: 'account',
          variables: dto,
          query: /* GraphQL */ `
            query account($account_id: Int!) {
              account(dto: { account_id: $account_id }) {
                id
                type_id
                parent_account_id
                label
                description
                balance_reconcilied
                balance_not_reconcilied
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
        data: response.data.account,
      };
    } catch (e: any) {
      return {
        message: CODES.FAIL,
        error: e.message,
      };
    }
  }
}
