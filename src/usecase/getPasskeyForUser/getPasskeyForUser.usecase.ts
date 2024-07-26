import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { GetPasskeyForUserUsecaseModel } from '@usecase/getPasskeyForUser/getPasskeyForUser.usecase.model';

export class GetPasskeyForUserUsecase {

  constructor(
    private inversify:Inversify
  ){}

  async execute(): Promise<GetPasskeyForUserUsecaseModel>  {
    try {
      const response:any = await this.inversify.graphqlService.send(
        {
          operationName: 'passkeys_for_user',
          variables: {},
          query: `query passkeys_for_user {
            passkeys_for_user {
              id
              label
              user_id
              hostname
              user_code
              challenge
              credential_id
            }
          }`
        }
      );

      if(response.errors) {
        throw new Error(response.errors[0].message);
      }

      return {
        message: CODES.SUCCESS,
        data: response.data.passkeys_for_user
      }
    } catch (e: any) {
      return {
        message: CODES.GET_PASSKEY_FOR_USER_FAIL,
        error: e.message
      }
    }
  }
}