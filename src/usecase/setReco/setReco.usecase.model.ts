import { SetOperationReconciledMutation } from '@src/gql/graphql';

/**
 * La mutation de rapprochement ne redemande que l'identifiant : son retour ne
 * peut donc pas être une opération complète, contrairement à ce que déclarait
 * la version manuscrite.
 */
export interface SetRecoUsecaseModel {
  message: string;
  data?: SetOperationReconciledMutation['updateOperation'];
  error?: string;
}
