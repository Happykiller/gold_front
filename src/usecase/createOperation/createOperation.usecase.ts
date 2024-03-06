import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { CreateOperationUsecaseDto } from '@usecase/createOperation/createOperation.usecase.dto';
import { CreateOperationUsecaseModel } from '@usecase/createOperation/createOperation.usecase.model';

export class CreateOperationUsecase {

  constructor(
    private inversify:Inversify
  ){}

  async execute(dto: CreateOperationUsecaseDto): Promise<CreateOperationUsecaseModel>  {
    try {
      const graphqlDto:any = {
        ...dto,
        account_id_dest: dto.account_dest_id
      };
      delete graphqlDto.account_dest_id;

      const response:any = await this.inversify.graphqlService.send( 
        {
          operationName: 'createOperation',
          variables: graphqlDto,
          query: `mutation createOperation(
            $account_id: Int!
            $account_id_dest: Int
            $amount: Float!
            $date: String!
            $status_id: Int!
            $type_id: Int!
            $third_id: Int
            $category_id: Int
            $description: String
          ) {
            createOperation (
              dto: {
                account_id: $account_id
                account_id_dest: $account_id_dest
                amount: $amount
                date: $date
                status_id: $status_id
                type_id: $type_id
                third_id: $third_id
                category_id: $category_id
                description: $description
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
        data: response.data.createOperation
      }
    } catch (e: any) {
      return {
        message: CODES.CREATE_OPERATION_FAIL,
        error: e.message
      }
    }
  }
}