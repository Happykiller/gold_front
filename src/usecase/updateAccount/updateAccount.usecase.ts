import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { GraphqlResponse } from '@service/graphql/graphql.response';
import { UpdateAccountMutation } from '@src/gql/graphql';
import { UpdateAccountUsecaseDto } from '@usecase/updateAccount/updateAccount.usecase.dto';
import { UpdateAccountUsecaseModel } from '@usecase/updateAccount/updateAccount.usecase.model';

export class UpdateAccountUsecase {
  constructor(private inversify: Inversify) {}

  async execute(
    dto: UpdateAccountUsecaseDto,
  ): Promise<UpdateAccountUsecaseModel> {
    try {
      const response: GraphqlResponse<UpdateAccountMutation> =
        await this.inversify.graphqlService.send({
          operationName: 'updateAccount',
          variables: dto,
          // `label` et `type_id` sont optionnels côté serveur : ne pas les
          // passer laisse la valeur en place. Le compte est identifié par
          // `account_id`, et le serveur filtre sur le créateur — un compte qui
          // n'est pas le sien est traité comme inexistant.
          query: /* GraphQL */ `
            mutation updateAccount(
              $account_id: Int!
              $label: String
              $type_id: Int
            ) {
              updateAccount(
                dto: {
                  account_id: $account_id
                  label: $label
                  type_id: $type_id
                }
              ) {
                id
                label
                type_id
                parent_account_id
                description
                balance_reconcilied
                balance_not_reconcilied
              }
            }
          `,
        });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      if (!response.data) {
        throw new Error('Réponse GraphQL sans données');
      }

      return {
        message: CODES.SUCCESS,
        data: response.data.updateAccount,
      };
    } catch (e: any) {
      return {
        message: CODES.FAIL,
        error: e.message,
      };
    }
  }
}
