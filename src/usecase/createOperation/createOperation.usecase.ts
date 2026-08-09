// src\usecase\createOperation\createOperation.usecase.ts
import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { CreateOperationUsecaseDto } from '@usecase/createOperation/createOperation.usecase.dto';
import { CreateOperationUsecaseModel } from '@usecase/createOperation/createOperation.usecase.model';
import { GraphqlResponse } from '@service/graphql/graphql.response';
import { CreateOperationMutation } from '@src/gql/graphql';

export class CreateOperationUsecase {
  constructor(private inversify: Inversify) {}

  async execute(
    dto: CreateOperationUsecaseDto,
  ): Promise<CreateOperationUsecaseModel> {
    try {
      const response: GraphqlResponse<CreateOperationMutation> =
        await this.inversify.graphqlService.send({
          operationName: 'createOperation',
          variables: dto,
          query: /* GraphQL */ `
            mutation createOperation(
              $account_id: Int!
              $account_id_dest: Int
              $amount: Float!
              $vat_rate: Float
              $date: String!
              $status_id: Int!
              $type_id: Int!
              $third_id: Int
              $category_id: Int
              $description: String
              $linked_operation_ids: [Int!]
            ) {
              createOperation(
                dto: {
                  account_id: $account_id
                  account_id_dest: $account_id_dest
                  amount: $amount
                  vat_rate: $vat_rate
                  date: $date
                  status_id: $status_id
                  type_id: $type_id
                  third_id: $third_id
                  category_id: $category_id
                  description: $description
                  linked_operation_ids: $linked_operation_ids
                }
              ) {
                id
                account_id
                account_id_dest
                amount
                vat_rate
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
                linked_count
              }
            }
          `,
        });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      // Le serveur peut répondre sans `data` (erreur d'authentification,
      // réponse tronquée) : sans cette garde, l'accès plus bas lèverait un
      // TypeError peu lisible au lieu d'un échec explicite.
      if (!response.data) {
        throw new Error('Réponse GraphQL sans données');
      }

      return {
        message: CODES.SUCCESS,
        data: response.data.createOperation,
      };
    } catch (e: any) {
      return {
        message: CODES.CREATE_OPERATION_FAIL,
        error: e.message,
      };
    }
  }
}
