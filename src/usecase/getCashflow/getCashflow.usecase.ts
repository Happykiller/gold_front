import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { GetCashflowUsecaseDto } from '@usecase/getCashflow/getCashflow.usecase.dto';
import { GetCashflowUsecaseModel } from '@usecase/getCashflow/getCashflow.usecase.model';
import { GraphqlResponse } from '@service/graphql/graphql.response';
import { CashflowQuery } from '@src/gql/graphql';

export class GetCashflowUsecase {
  constructor(private inversify: Inversify) {}

  async execute(dto: GetCashflowUsecaseDto): Promise<GetCashflowUsecaseModel> {
    try {
      const response: GraphqlResponse<CashflowQuery> =
        await this.inversify.graphqlService.send({
          operationName: 'cashflow',
          variables: dto,
          query: /* GraphQL */ `
            query cashflow(
              $account_ids: [Int!]!
              $start_date: String!
              $end_date: String!
            ) {
              cashflow(
                dto: {
                  account_ids: $account_ids
                  start_date: $start_date
                  end_date: $end_date
                }
              ) {
                account_id
                date
                reconciled_balance
                total_balance
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
        data: response.data.cashflow,
      };
    } catch (e: any) {
      return {
        message: CODES.FAIL,
        error: e.message,
      };
    }
  }
}
