import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { AuthUsecaseDto } from '@usecase/auth/dto/auth.usecase.dto';
import { AuthUsecaseModel } from '@usecase/auth/model/auth.usecase.model';

export class AuthUsecase {

  constructor(
    private inversify:Inversify
  ){}

  async execute(dto: AuthUsecaseDto): Promise<AuthUsecaseModel>  {
    try {
      const response:any = await this.inversify.graphqlService.send(
        {
          operationName: 'auth',
          variables: dto,
          query: `query auth($login: String!, $password: String!) {
            auth (
              dto: {
                login: $login
                password: $password
              }
            ) {
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
        ... response.data.auth,
        access_token: response.data.auth.accessToken
      };

      return {
        message: CODES.SUCCESS,
        data: info
      }
    } catch (e: any) {
      return {
        message: CODES.AUTH_FAIL_WRONG_CREDENTIAL,
        error: e.message
      }
    }
  }
}