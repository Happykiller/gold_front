import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { SetRecoUsecaseDto } from '@usecase/setReco/setReco.usecase.dto';
import { SetRecoUsecaseModel } from '@usecase/setReco/setReco.usecase.model';

export class SetRecoUsecase {

  constructor(
    private inversify:Inversify
  ){}

  async execute(dto: SetRecoUsecaseDto): Promise<SetRecoUsecaseModel>  {
    try {
      const response:any = await this.inversify.graphqlService.send(
        {
          operationName: 'updateOperation',
          variables: dto,
          query: `mutation updateOperation($operation_id: Int!) {
            updateOperation (
              dto: {
                operation_id: $operation_id
                status_id: 2
              }
            ) {
              id
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