import { OperationTypesQuery } from '@src/gql/graphql';

/**
 * Un type d'opération : crédit, débit ou virement. Son libellé est une clé
 * i18n résolue côté front.
 *
 * Dérivé du type généré par le codegen : la version manuscrite déclarait des
 * champs que la requête ne demande pas, et rendait obligatoires des champs
 * que le schéma autorise à être nuls.
 */
export type OperationTypeUsecaseModel =
  OperationTypesQuery['operationTypes'][number];
