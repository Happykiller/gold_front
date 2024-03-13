import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { AccountUsecaseModel } from '@usecase/model/account.usecase.model';
import { GetAccountsUsecaseModel } from '@usecase/getAccounts/getAccounts.usecase.model';

export class GetAccountsUsecase {

  constructor(
    private inversify:Inversify
  ){}

  accounts:AccountUsecaseModel[] = [];

  async execute(): Promise<GetAccountsUsecaseModel>  {
    try {
      if (this.accounts.length === 0) {
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

        this.accounts = response.data.accounts.sort((elt1:AccountUsecaseModel, elt2:AccountUsecaseModel) => elt1.label.localeCompare(elt2.label));
      }

      return {
        message: CODES.SUCCESS,
        data: this.accounts
      }
    } catch (e: any) {
      return {
        message: CODES.FAIL,
        error: e.message
      }
    }
  }
}