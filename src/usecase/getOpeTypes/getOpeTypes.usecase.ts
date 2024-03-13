import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { OperationTypeUsecaseModel } from '@usecase/model/operationType.usecase.model';
import { GetOpeTypesUsecaseModel } from '@usecase/getOpeTypes/getOpeTypes.usecase.model';

export class GetOpeTypesUsecase {

  constructor(
    private inversify:Inversify
  ){}

  types:OperationTypeUsecaseModel[] = [];

  async execute(): Promise<GetOpeTypesUsecaseModel>  {
    try {
      if (this.types.length === 0) {
        const response:any = await this.inversify.graphqlService.send(
          {
            operationName: 'operationTypes',
            variables: {},
            query: `query operationTypes {  
              operationTypes {
                id
                label
              }
            }`
          }
        );

        if(response.errors) {
          throw new Error(response.errors[0].message);
        }

        this.types = response.data.operationTypes.sort((elt1:OperationTypeUsecaseModel, elt2:OperationTypeUsecaseModel) => elt1.label.localeCompare(elt2.label));
      }

      return {
        message: CODES.SUCCESS,
        data: this.types
      }
    } catch (e: any) {
      return {
        message: CODES.FAIL,
        error: e.message
      }
    }
  }
}