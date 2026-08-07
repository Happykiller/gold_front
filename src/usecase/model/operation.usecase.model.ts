import { OperationsQuery } from '@src/gql/graphql';

/**
 * Une opération, telle que la requête `operations` la renvoie.
 *
 * Dérivé du type généré par le codegen : la version manuscrite déclarait des
 * champs que la requête ne demande pas, et rendait obligatoires des champs
 * que le schéma autorise à être nuls.
 */
export type OperationUsecaseModel = OperationsQuery['operations'][number];
