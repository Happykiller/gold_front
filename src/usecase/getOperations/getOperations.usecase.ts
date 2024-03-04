import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { GetOperationsUsecaseDto } from '@usecase/getOperations/getOperations.usecase.dto';
import { GetOperationsUsecaseModel } from '@usecase/getOperations/getOperations.usecase.model';

export class GetOperationsUsecase {

  constructor(
    private inversify:Inversify
  ){}

  async execute(dto: GetOperationsUsecaseDto): Promise<GetOperationsUsecaseModel>  {
    try {
      const response:any = await this.inversify.graphqlService.send(
        {
          operationName: 'operations',
          variables: dto,
          query: `query operations($account_id: Int!) {
            operations (
              dto: {
                account_id: $account_id
                limit: 25
              }
            ) {
              id
              account_id
              account {
                  id
                  label
              }
              account_id_dest
              account_dest {
                  id
                  label
              }
              amount
              date
              status_id
              type_id
              third_id
              third {
                  id
                  label
              }
              category_id
              category {
                  id
                  label
              }
              description
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
        data: response.data.operations
      }
    } catch (e: any) {
      return {
        message: CODES.FAIL,
        error: e.message
      }
    }
  }
}