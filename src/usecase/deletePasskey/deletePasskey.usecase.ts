import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import DeletePasskeyUsecaseDto from '@usecase/deletePasskey/deletePasskey.usecase.dto';
import DeletePasskeyUsecaseModel from '@usecase/deletePasskey/deletePasskey.usecase.model';

export class DeletePasskeyUsecase {

  constructor(
    private inversify:Inversify
  ){}

  async execute(dto: DeletePasskeyUsecaseDto): Promise<DeletePasskeyUsecaseModel>  {
    try {
      const response:any = await this.inversify.graphqlService.send(
        {
          operationName: 'delete_passkey',
          variables: dto,
          query: `mutation delete_passkey($passkey_id: String!) {
            delete_passkey (
              dto: {
                passkey_id: $passkey_id
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
      if(e.message in CODES) {
        return {
          message: e.message,
          error: e.message
        }
      } else {
        return {
          message: CODES.DELETE_PASSKEY_FAIL,
          error: e.message
        }
      }
    }
  }
}