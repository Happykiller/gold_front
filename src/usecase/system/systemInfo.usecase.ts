import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { SystemInfoUsecaseModel } from '@usecase/system/model/systemInfo.usecase.model';

export class SystemInfoUsecase {

  systemInfo:any;

  constructor(
    private inversify:Inversify
  ){}

  async execute(): Promise<SystemInfoUsecaseModel>  {
    try {
      if (this.systemInfo) {
        return {
          message: CODES.SUCCESS,
          data: this.systemInfo
        }
      }

      const response:any = await this.inversify.graphqlService.send( 
        {
          operationName: 'systemInfo',
          variables: {},
          query: `query systemInfo {  
            systemInfo {
              version
            }
          }`
        }
      );

      if(response.errors) {
        throw new Error(response.errors[0].message);
      }

      this.systemInfo = response.data.systemInfo;

      return {
        message: CODES.SUCCESS,
        data: this.systemInfo
      }
    } catch (e: any) {
      return {
        message: CODES.FAIL,
        error: e.message
      }
    }
  }
}