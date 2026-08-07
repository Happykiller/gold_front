// src\presentation\hooks\useAccountOperations.ts
import { useEffect, useState, useCallback } from 'react';
import inversify from '@src/common/inversify';
import { CODES } from '@src/common/codes';
import { GetOperationsUsecaseModel } from '@usecase/getOperations/getOperations.usecase.model';
import { GetAccountUsecaseModel } from '@usecase/getAccount/getAccount.usecase.model';

// Ces deux types décrivaient à la main ce que le hook reçoit, et avaient
// divergé : `vat_rate` y était optionnel alors que le serveur le renvoie
// toujours, et les soldes y étaient non nuls alors que le schéma les autorise
// à l'être. Les dériver du retour des usecases rend la divergence impossible.
export type Account = NonNullable<GetAccountUsecaseModel['data']>;
export type Operation = NonNullable<GetOperationsUsecaseModel['data']>[number];

export function useAccountOperations(accountId: number, page: number) {
  const [account, setAccount] = useState<Account | null>(null);
  const [operations, setOperations] = useState<Operation[] | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [loadingOps, setLoadingOps] = useState(false);
  const [errorAccount, setErrorAccount] = useState<string | null>(null);
  const [errorOps, setErrorOps] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    setLoadingAccount(true);
    setErrorAccount(null);
    inversify.getAccountUsecase
      .execute({ account_id: accountId })
      .then((resp: GetAccountUsecaseModel) => {
        if (resp.message === CODES.SUCCESS && resp.data) setAccount(resp.data);
        else setErrorAccount(resp.message);
      })
      .catch((e) => setErrorAccount(e.message))
      .finally(() => setLoadingAccount(false));
  }, [accountId, refreshToken]);

  useEffect(() => {
    setLoadingOps(true);
    setErrorOps(null);
    inversify.getOperationsUsecase
      .execute({ account_id: accountId, page })
      .then((resp: GetOperationsUsecaseModel) => {
        if (resp.message === CODES.SUCCESS && resp.data)
          setOperations(resp.data);
        else setErrorOps(resp.message);
      })
      .catch((e) => setErrorOps(e.message))
      .finally(() => setLoadingOps(false));
  }, [accountId, page, refreshToken]);

  const reload = useCallback(() => {
    setRefreshToken((prev) => prev + 1);
  }, []);

  const removeOperation = useCallback((operationId: number) => {
    setOperations((ops) => ops?.filter((op) => op.id !== operationId) ?? null);
  }, []);

  const recoOperation = useCallback((operationId: number) => {
    setOperations(
      (ops) =>
        ops?.map((op) =>
          op.id === operationId ? { ...op, status_id: 2 } : op,
        ) ?? null,
    );
  }, []);

  const adjustBalance = useCallback(
    (
      delta: number,
      action: 'reconcile' | 'delete',
      from: 'reconciled' | 'not_reconciled',
    ) => {
      setAccount((acc) => {
        if (!acc) return acc;
        const next = { ...acc };

        if (action === 'reconcile') {
          // Move amount from "from" to the other balance
          if (from === 'reconciled') {
            next.balance_reconcilied = (next.balance_reconcilied ?? 0) - delta;
            next.balance_not_reconcilied =
              (next.balance_not_reconcilied ?? 0) + delta;
          } else {
            next.balance_reconcilied = (next.balance_reconcilied ?? 0) + delta;
            next.balance_not_reconcilied =
              (next.balance_not_reconcilied ?? 0) - delta;
          }
        }

        if (action === 'delete') {
          // Remove from current balance only
          if (from === 'reconciled') {
            next.balance_reconcilied = (next.balance_reconcilied ?? 0) - delta;
          } else {
            next.balance_not_reconcilied =
              (next.balance_not_reconcilied ?? 0) - delta;
          }
        }

        return next;
      });
    },
    [],
  );

  return {
    account,
    operations,
    loadingAccount,
    loadingOps,
    errorAccount,
    errorOps,
    reload,
    removeOperation,
    recoOperation,
    adjustBalance,
  };
}
