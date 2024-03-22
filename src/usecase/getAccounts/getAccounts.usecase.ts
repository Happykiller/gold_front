import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { AccountUsecaseModel } from '@usecase/model/account.usecase.model';
import { GetAccountsUsecaseDto } from '@usecase/getAccounts/getAccounts.usecase.dto';
import { GetAccountsUsecaseModel } from '@usecase/getAccounts/getAccounts.usecase.model';

export class GetAccountsUsecase {

  constructor(
    private inversify:Inversify
  ){}

  accounts:AccountUsecaseModel[] = [];

  async execute(dto?: GetAccountsUsecaseDto): Promise<GetAccountsUsecaseModel>  {
    try {
      if (dto?.cached === false || this.accounts.length === 0) {
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
      console.log(e.message)
      return {
        message: CODES.FAIL,
        error: e.message
      }
    }
  }
}