import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import CreatePasskeyUsecaseDto from '@usecase/createPasskey/createPasskey.usecase.dto';
import { CreatePasskeyUsecaseModel } from '@usecase/createPasskey/createPasskey.usecase.model';

export class CreatePasskeyUsecase {

  constructor(
    private inversify:Inversify
  ){}

  async execute(dto: CreatePasskeyUsecaseDto): Promise<CreatePasskeyUsecaseModel>  {
    try {
      let dtobis:any = dto;
      delete dtobis.registration.clientExtensionResults;
      const response:any = await this.inversify.graphqlService.send(
        {
          operationName: 'create_passkey',
          variables: {
            dto
          },
          query: `mutation create_passkey($dto: CreatePasskeyResolverDto!) {
            create_passkey (
              dto: $dto
            ) {
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
        data: response.data.create_passkey
      }
    } catch (e: any) {
      return {
        message: CODES.CREATE_PASSKEY_FAIL,
        error: e.message
      }
    }
  }
}