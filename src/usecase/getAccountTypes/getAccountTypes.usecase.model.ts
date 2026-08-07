import { AccountTypesQuery } from '@src/gql/graphql';

/**
 * Un type de compte, tel que la requête `accountTypes` le renvoie.
 *
 * Deux valeurs au référentiel : `account.type-regular` et
 * `account.type-template`. Ce sont des **clés i18n**, pas des libellés — elles
 * se résolvent via `src/locales/`.
 */
export type AccountTypeUsecaseModel = AccountTypesQuery['accountTypes'][number];

export interface GetAccountTypesUsecaseModel {
  message: string;
  data?: AccountTypeUsecaseModel[];
  error?: string;
}
