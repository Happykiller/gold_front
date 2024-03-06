import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { CloneOperationsUsecaseDto } from '@usecase/cloneOperations/cloneOperations.usecase.dto';
import { CloneOperationsUsecaseModel } from '@usecase/cloneOperations/cloneOperations.usecase.model';

export class CloneOperationsUsecase {

  constructor(
    private inversify:Inversify
  ){}

  async execute(dto: CloneOperationsUsecaseDto): Promise<CloneOperationsUsecaseModel>  {
    try {
      const response:any = await this.inversify.graphqlService.send( 
        {
          operationName: 'cloneOperations',
          variables: dto,
          query: `mutation cloneOperations(
            $account_id: Int!
            $template_account_id: Int!
            $date: String!
          ) {
            cloneOperations (
              dto: {
                account_id: $account_id
                template_account_id: $template_account_id
                date: $date
              }
            ) {
              id
              account_id
              account_id_dest
              amount
              date
              status_id
              type_id
              third_id
              category_id
              description
              creator_id
              creation_date
              modificator_id
              modification_date
            }
          }`
        }
      );

      if(response.errors) {
        throw new Error(response.errors[0].message);
      }

      return {
        message: CODES.SUCCESS,
        data: response.data.cloneOperations
      }
    } catch (e: any) {
      return {
        message: CODES.CLONE_OPERATION_FAIL,
        error: e.message
      }
    }
  }
}