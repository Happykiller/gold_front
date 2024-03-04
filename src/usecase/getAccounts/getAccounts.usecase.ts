import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { GetAccountsUsecaseModel } from '@usecase/getAccounts/getAccounts.usecase.model';

export class GetAccountsUsecase {

  constructor(
    private inversify:Inversify
  ){}

  async execute(): Promise<GetAccountsUsecaseModel>  {
    try {
      const response:any = await this.inversify.graphqlService.send(
        {
          operationName: 'accounts',
          variables: {},
          query: `query accounts {  
            accounts {
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
          }`
        }
      );

      if(response.errors) {
        throw new Error(response.errors[0].message);
      }

      return {
        message: CODES.SUCCESS,
        data: response.data.accounts
      }
    } catch (e: any) {
      return {
        message: CODES.FAIL,
        error: e.message
      }
    }
  }
}