import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { GraphqlResponse } from '@service/graphql/graphql.response';
import { AccountTypesQuery } from '@src/gql/graphql';
import {
  AccountTypeUsecaseModel,
  GetAccountTypesUsecaseModel,
} from '@usecase/getAccountTypes/getAccountTypes.usecase.model';

export class GetAccountTypesUsecase {
  constructor(private inversify: Inversify) {}

  // Référentiel fermé de deux valeurs : on le garde en mémoire après le
  // premier appel, comme le fait GetOpeTypesUsecase.
  types: AccountTypeUsecaseModel[] = [];

  async execute(): Promise<GetAccountTypesUsecaseModel> {
    try {
      if (this.types.length === 0) {
        const response: GraphqlResponse<AccountTypesQuery> =
          await this.inversify.graphqlService.send({
            operationName: 'accountTypes',
            variables: {},
            query: /* GraphQL */ `
              query accountTypes {
                accountTypes {
                  id
                  label
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

        this.types = response.data.accountTypes;
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
