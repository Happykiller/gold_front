import { describe, expect, it } from 'vitest';

import { CODES } from '@src/common/codes';
import { Inversify } from '@src/common/inversify';
import { graphqlError, mockInversify } from '@usecase/testing/inversify.mock';

import { CloneOperationsUsecase } from '@usecase/cloneOperations/cloneOperations.usecase';
import { CreateOperationUsecase } from '@usecase/createOperation/createOperation.usecase';
import { DeleteOperationUsecase } from '@usecase/deleteOperation/deleteOperation.usecase';
import { GetAccountUsecase } from '@usecase/getAccount/getAccount.usecase';
import { GetAccountsUsecase } from '@usecase/getAccounts/getAccounts.usecase';
import { GetCashflowUsecase } from '@usecase/getCashflow/getCashflow.usecase';
import { GetOpeCategoriesUsecase } from '@usecase/getOpeCategories/getOpeCategories.usecase';
import { GetOpeTypesUsecase } from '@usecase/getOpeTypes/getOpeTypes.usecase';
import { GetOpeStatusUsecase } from '@usecase/getOpeStatus/getOpeStatus.usecase';
import { GetOperationUsecase } from '@usecase/getOperation/getOperation.usecaset';
import { GetOperationsUsecase } from '@usecase/getOperations/getOperations.usecase';
import { GetThirdsUsecase } from '@usecase/getThirds/getThirds.usecase';
import { UpdateOperationUsecase } from '@usecase/updateOperation/updateOperation.usecase';

/**
 * Contrat commun à tous les usecases du front.
 *
 * Ils suivent tous le même patron : envoyer une requête GraphQL écrite à la
 * main, puis renvoyer `{ message: SUCCESS, data }` ou `{ message: FAIL, error }`
 * — jamais lever. Les composants s'appuient sur ce contrat sans try/catch, si
 * bien qu'une exception qui s'échapperait casserait un écran entier.
 *
 * Ce test vérifie le patron sur chaque usecase ; les règles propres à l'un ou
 * l'autre sont couvertes dans leurs fichiers dédiés.
 */

/**
 * Chaque usecase a son propre DTO d'entrée et son propre modèle de sortie.
 * Ce test ne vérifie que ce qu'ils ont en commun — le contrat de retour —
 * d'où ce typage volontairement lâche ; le typage fin des entrées relève des
 * tests dédiés à chacun.
 */
interface UsecaseLike {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute(dto?: any): Promise<{ message: string; error?: string }>;
}

interface Case {
  name: string;
  build: (inversify: Inversify) => UsecaseLike;
  operationName: string;
  /** Clé lue dans response.data par le usecase. */
  dataKey?: string;
  dto?: unknown;
  /**
   * Code renvoyé en cas d'échec, quand il diffère de CODES.FAIL.
   *
   * Le contrat n'est pas uniforme : les trois usecases de mutation sur les
   * opérations renvoient un code qui leur est propre (CREATE_OPERATION_FAIL,
   * CLONE_OPERATION_FAIL, DELETE_OPERATION_FAIL) là où tous les autres
   * renvoient FAIL. Cette divergence est constatée, pas corrigée : les
   * composants s'appuient dessus pour afficher un message spécifique.
   */
  failCode?: string;
}

const cases: Case[] = [
  {
    name: 'GetAccountsUsecase',
    build: (i) => new GetAccountsUsecase(i),
    operationName: 'accounts',
    dataKey: 'accounts',
  },
  {
    name: 'GetAccountUsecase',
    build: (i) => new GetAccountUsecase(i),
    operationName: 'account',
    dataKey: 'account',
    dto: { id: 1 },
  },
  {
    name: 'GetOperationsUsecase',
    build: (i) => new GetOperationsUsecase(i),
    operationName: 'operations',
    dataKey: 'operations',
    dto: { account_id: 1, limit: 50, offset: 0 },
  },
  {
    name: 'GetOperationUsecase',
    build: (i) => new GetOperationUsecase(i),
    operationName: 'operation',
    dataKey: 'operation',
    dto: { id: 1 },
  },
  {
    name: 'GetCashflowUsecase',
    build: (i) => new GetCashflowUsecase(i),
    operationName: 'cashflow',
    dataKey: 'cashflow',
    dto: { account_ids: [1], start_date: '2026-01-01', end_date: '2026-12-31' },
  },
  {
    name: 'GetOpeCategoriesUsecase',
    build: (i) => new GetOpeCategoriesUsecase(i),
    operationName: 'operationCategories',
    dataKey: 'operationCategories',
  },
  {
    name: 'GetOpeTypesUsecase',
    build: (i) => new GetOpeTypesUsecase(i),
    operationName: 'operationTypes',
    dataKey: 'operationTypes',
  },
  {
    name: 'GetOpeStatusUsecase',
    build: (i) => new GetOpeStatusUsecase(i),
    operationName: 'operationStatus',
    dataKey: 'operationStatus',
  },
  {
    name: 'GetThirdsUsecase',
    build: (i) => new GetThirdsUsecase(i),
    operationName: 'operationThirds',
    dataKey: 'operationThirds',
  },
  {
    name: 'CreateOperationUsecase',
    build: (i) => new CreateOperationUsecase(i),
    operationName: 'createOperation',
    dataKey: 'createOperation',
    dto: {
      account_id: 1,
      amount: 10,
      date: '2026-01-01',
      status_id: 1,
      type_id: 1,
    },
    failCode: CODES.CREATE_OPERATION_FAIL,
  },
  {
    name: 'UpdateOperationUsecase',
    build: (i) => new UpdateOperationUsecase(i),
    operationName: 'updateOperation',
    dataKey: 'updateOperation',
    dto: { operation_id: 1 },
  },
  {
    name: 'CloneOperationsUsecase',
    build: (i) => new CloneOperationsUsecase(i),
    operationName: 'cloneOperations',
    dataKey: 'cloneOperations',
    dto: { account_id: 1, template_account_id: 2, date: '2026-01-01' },
    failCode: CODES.CLONE_OPERATION_FAIL,
  },
  {
    name: 'DeleteOperationUsecase',
    build: (i) => new DeleteOperationUsecase(i),
    operationName: 'deleteOperation',
    dto: { id: 1 },
    failCode: CODES.DELETE_OPERATION_FAIL,
  },
];

describe.each(cases)(
  '$name',
  ({ build, operationName, dataKey, dto, failCode }) => {
    it(`envoie l'opération '${operationName}'`, async () => {
      const { inversify, send } = mockInversify(() =>
        Promise.resolve({ data: dataKey ? { [dataKey]: [] } : {} }),
      );

      await build(inversify).execute(dto);

      expect(send).toHaveBeenCalledWith(
        expect.objectContaining({ operationName }),
      );
    });

    it('renvoie SUCCESS quand le serveur répond', async () => {
      const { inversify } = mockInversify(() =>
        Promise.resolve({ data: dataKey ? { [dataKey]: [] } : {} }),
      );

      const result = await build(inversify).execute(dto);

      expect(result.message).toBe(CODES.SUCCESS);
    });

    it("propage le message d'erreur du serveur sans lever", async () => {
      const { inversify } = mockInversify(() =>
        Promise.resolve(graphqlError('Access token is not set')),
      );

      const result = await build(inversify).execute(dto);

      expect(result.message).toBe(failCode ?? CODES.FAIL);
      expect(result.error).toBe('Access token is not set');
    });

    it('ne laisse pas échapper une erreur réseau', async () => {
      const { inversify } = mockInversify(() =>
        Promise.reject(new Error('réseau injoignable')),
      );

      const result = await build(inversify).execute(dto);

      expect(result.message).toBe(failCode ?? CODES.FAIL);
    });
  },
);
