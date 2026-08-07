import { AccountsQuery } from '@src/gql/graphql';

/**
 * Un compte, tel que la requête `accounts` le renvoie réellement.
 *
 * Dérivé du type généré plutôt que réécrit à la main : la version manuscrite
 * déclarait `active`, jamais demandé par la requête, et donnait pour non
 * nullables des champs que le schéma autorise à l'être. Le code croyait donc
 * disposer de données absentes à l'exécution.
 */
export type AccountUsecaseModel = AccountsQuery['accounts'][number];
