import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { DeleteOperationUsecaseDto } from '@usecase/deleteOperation/deleteOperation.usecase.dto';
import { DeleteOperationUsecaseModel } from '@usecase/deleteOperation/deleteOperation.usecase.model';

export class DeleteOperationUsecase {

  constructor(
    private inversify:Inversify
  ){}

  async execute(dto: DeleteOperationUsecaseDto): Promise<DeleteOperationUsecaseModel>  {
    try {
      const response:any = await this.inversify.graphqlService.send( 
        {
          operationName: 'deleteOperation',
          variables: dto,
          query: `mutation deleteOperation(
            $operation_id: Int!
          ) {
            deleteOperation (
              dto: {
                operation_id: $operation_id
              }
            )
          }`
        }
      );

      if(response.errors) {
        throw new Error(response.errors[0].message);
      }

      return {
        message: CODES.SUCCESS,
        data: true
      }
    } catch (e: any) {
      return {
        message: CODES.DELETE_OPERATION_FAIL,
        error: e.message
      }
    }
  }
}