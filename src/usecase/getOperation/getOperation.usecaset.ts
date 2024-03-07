import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { GetOperationUsecaseDto } from '@usecase/getOperation/getOperation.usecase.dto';
import { GetOperationUsecaseModel } from '@usecase/getOperation/getOperation.usecase.model';

export class GetOperationUsecase {

  constructor(
    private inversify:Inversify
  ){}

  async execute(dto: GetOperationUsecaseDto): Promise<GetOperationUsecaseModel>  {
    try {
      const response:any = await this.inversify.graphqlService.send(
        {
          operationName: 'operation',
          variables: dto,
          query: `query operation($operation_id: Int!) {
            operation (
              dto: {
                operation_id: $operation_id
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
        data: response.data.operation
      }
    } catch (e: any) {
      return {
        message: CODES.FAIL,
        error: e.message
      }
    }
  }
}