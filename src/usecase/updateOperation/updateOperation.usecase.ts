import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { OperationUsecaseModel } from '@usecase/model/operation.usecase.model';
import { UpdateOperationUsecaseModel } from '@usecase/updateOperation/updateOperation.usecase.mode';

export class UpdateOperationUsecase {

  constructor(
    private inversify:Inversify
  ){}

  async execute(dto: OperationUsecaseModel): Promise<UpdateOperationUsecaseModel>  {
    try {
      const finalDto:any = {
        operation_id: dto.id,
        ... dto
      };

      const response:any = await this.inversify.graphqlService.send(
        {
          operationName: 'updateOperation',
          variables: finalDto,
          query: `mutation updateOperation(
              $operation_id: Int!, 
              $account_id: Int!, 
              $account_id_dest: Int, 
              $amount: Float!, 
              $status_id: Int!, 
              $type_id: Int!, 
              $third_id: Int!, 
              $category_id: Int!, 
              $description: String,
              $date: String!
            ) {
            updateOperation (
              dto: {
                operation_id: $operation_id
                account_id: $account_id
                account_id_dest: $account_id_dest
                amount: $amount
                status_id: $status_id
                type_id: $type_id
                third_id: $third_id
                category_id: $category_id
                description: $description
                date: $date
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
        data: response.data.updateOperation
      }
    } catch (e: any) {
      return {
        message: CODES.FAIL,
        error: e.message
      }
    }
  }
}