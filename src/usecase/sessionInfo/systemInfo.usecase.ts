import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { SessionInfoUsecaseModel } from '@usecase/sessionInfo/model/sessionInfo.usecase.model';

export class SessionInfoUsecase {

  SessionInfo:any;

  constructor(
    private inversify:Inversify
  ){}

  async execute(): Promise<SessionInfoUsecaseModel>  {
    try {
      const response:any = await this.inversify.graphqlService.send(
        {
          operationName: 'getSessionInfo',
          variables: {},
          query: `query getSessionInfo {  
            getSessionInfo {
              accessToken
              id
              code
              name_first
              name_last
              description
              mail
            }
          }`
        }
      );

      if(response.errors) {
        throw new Error(response.errors[0].message);
      }

      const info: any = {
        ... response.data.getSessionInfo,
        access_token: response.data.getSessionInfo.accessToken
      };

      return {
        message: CODES.SUCCESS,
        data: info
      }
    } catch (e: any) {
      return {
        message: CODES.FAIL,
        error: e.message
      }
    }
  }
}