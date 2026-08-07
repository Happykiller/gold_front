import { OperationThirdsQuery } from '@src/gql/graphql';

/**
 * Un tiers d'opération. Le nom du fichier porte une coquille historique
 * (« Thrid ») conservée pour ne pas casser les imports.
 *
 * Dérivé du type généré par le codegen : la version manuscrite déclarait des
 * champs que la requête ne demande pas, et rendait obligatoires des champs
 * que le schéma autorise à être nuls.
 */
export type OperationThridUsecaseModel =
  OperationThirdsQuery['operationThirds'][number];
