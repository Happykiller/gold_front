import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { GetAccountUsecaseDto } from '@usecase/getAccount/getAccount.usecase.dto';
import { GetAccountUsecaseModel } from '@usecase/getAccount/getAccount.usecase.model';

export class GetAccountUsecase {

  constructor(
    private inversify:Inversify
  ){}

  async execute(dto: GetAccountUsecaseDto): Promise<GetAccountUsecaseModel>  {
    try {
      const response:any = await this.inversify.graphqlService.send(
        {
          operationName: 'account',
          variables: dto,
          query: `query account($account_id: Int!) {
            account (
              dto: {
                account_id: $account_id
              }
            ) {
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
        data: response.data.account
      }
    } catch (e: any) {
      return {
        message: CODES.FAIL,
        error: e.message
      }
    }
  }
}