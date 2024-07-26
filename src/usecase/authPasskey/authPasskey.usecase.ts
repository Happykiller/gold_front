import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { AuthPasskeyUsecaseDto } from '@usecase/authPasskey/authPasskey.usecase.dto';
import { AuthPasskeyUsecaseModel } from '@usecase/authPasskey/authPasskey.usecase.model';

export class AuthPasskeyUsecase {

  constructor(
    private inversify:Inversify
  ){}

  async execute(dto: any): Promise<any>  {
    try {
      const response:any = await this.inversify.graphqlService.send(
        {
          operationName: 'auth_passkey',
          variables: {
            dto
          },
          query: `query auth_passkey($dto: PasskeyAuthResolverDto!) {
            auth_passkey (
              dto: $dto
            ) {
              access_token
              id
              code
              name_first
              name_last
              description
              mail
              role
            }
          }`
        }
      );

      if(response.errors) {
        throw new Error(response.errors[0].message);
      }

      return {
        message: CODES.SUCCESS,
        data: response.data.auth_passkey
      }
    } catch (e: any) {
      return {
        message: CODES.AUTH_FAIL_WRONG_CREDENTIAL,
        error: e.message
      }
    }
  }
}