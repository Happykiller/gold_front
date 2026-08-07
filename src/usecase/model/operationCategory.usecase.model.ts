import { OperationCategoriesQuery } from '@src/gql/graphql';

/**
 * Une catégorie d'opération. Contrairement aux types et statuts, les
 * catégories sont des données saisies par l'utilisateur, pas un référentiel.
 *
 * Dérivé du type généré par le codegen : la version manuscrite déclarait des
 * champs que la requête ne demande pas, et rendait obligatoires des champs
 * que le schéma autorise à être nuls.
 */
export type OperationCategoryUsecaseModel =
  OperationCategoriesQuery['operationCategories'][number];
