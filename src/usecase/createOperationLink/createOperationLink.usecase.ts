import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { CreateOperationLinkUsecaseDto } from '@usecase/createOperationLink/createOperationLink.usecase.dto';
import { CreateOperationLinkUsecaseModel } from '@usecase/createOperationLink/createOperationLink.usecase.model';
import { GraphqlResponse } from '@service/graphql/graphql.response';
import { CreateOperationLinkMutation } from '@src/gql/graphql';

/**
 * Rattache une opération à un virement existant.
 *
 * Pendant de `deleteOperationLink`. La mutation existait côté serveur depuis
 * l'origine, mais seul le **retrait** avait été câblé ici : à l'édition d'un
 * virement on pouvait défaire un lien, jamais en poser un. Le rattachement
 * n'était possible qu'à la création, via `linked_operation_ids`.
 *
 * On demande `id` en retour : c'est l'identifiant du LIEN, celui qu'il faudra
 * repasser à `deleteOperationLink` pour retirer la puce qu'on vient d'ajouter.
 * Sans lui, la puce serait posée mais non retirable avant un rechargement.
 */
export class CreateOperationLinkUsecase {
  constructor(private inversify: Inversify) {}

  async execute(
    dto: CreateOperationLinkUsecaseDto,
  ): Promise<CreateOperationLinkUsecaseModel> {
    try {
      const response: GraphqlResponse<CreateOperationLinkMutation> =
        await this.inversify.graphqlService.send({
          operationName: 'createOperationLink',
          variables: dto,
          query: /* GraphQL */ `
            mutation createOperationLink(
              $operation_id: Int!
              $operation_ref_id: Int!
            ) {
              createOperationLink(
                dto: {
                  operation_id: $operation_id
                  operation_ref_id: $operation_ref_id
                }
              ) {
                id
                operation_id
                operation_ref_id
                active
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
        data: response.data.createOperationLink,
      };
    } catch (e: any) {
      return {
        message: CODES.FAIL,
        error: e.message,
      };
    }
  }
}
