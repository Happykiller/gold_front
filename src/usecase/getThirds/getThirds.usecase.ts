import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { GetThirdsUsecaseModel } from '@usecase/getThirds/getThirds.usecase.model';
import { OperationThridUsecaseModel } from '@usecase/model/operationThrid.usecase.model';

export class GetThirdsUsecase {

  constructor(
    private inversify:Inversify
  ){}

  thirds:OperationThridUsecaseModel[] = [];

  async execute(): Promise<GetThirdsUsecaseModel>  {
    try {
      if (this.thirds.length === 0) {
        const response:any = await this.inversify.graphqlService.send(
          {
            operationName: 'operationThirds',
            variables: {},
            query: `query operationThirds {  
              operationThirds {
                id
                label
              }
            }`
          }
        );

        if(response.errors) {
          throw new Error(response.errors[0].message);
        }

        this.thirds = response.data.operationThirds.sort((elt1:OperationThridUsecaseModel, elt2:OperationThridUsecaseModel) => elt1.label.localeCompare(elt2.label));
      }

      return {
        message: CODES.SUCCESS,
        data: this.thirds
      }
    } catch (e: any) {
      return {
        message: CODES.FAIL,
        error: e.message
      }
    }
  }
}