// src\presentation\hooks\useAccountOperations.ts
import { useEffect, useState, useCallback } from 'react';
import inversify from '@src/common/inversify';
import { CODES } from '@src/common/codes';
import { GetOperationsUsecaseModel } from '@usecase/getOperations/getOperations.usecase.model';
import { GetAccountUsecaseModel } from '@usecase/getAccount/getAccount.usecase.model';

export interface Operation {
  id: number;
  type_id: number;
  status_id: number;
  amount: number;
  date: string;
  account_id_dest?: number;
  account_dest?: { label: string, id:number };
  account?: { label: string, id:number };
  third?: { label: string, id:number };
  category?: { label: string, id:number };
  description?: string;
}

export interface Account {
  id: number;
  label: string;
  balance_reconcilied: number;
  balance_not_reconcilied: number;
}

export function useAccountOperations(accountId: number, page: number) {
  const [account, setAccount] = useState<Account | null>(null);
  const [operations, setOperations] = useState<Operation[] | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [loadingOps, setLoadingOps] = useState(false);
  const [errorAccount, setErrorAccount] = useState<string | null>(null);
  const [errorOps, setErrorOps] = useState<string | null>(null);

  useEffect(() => {
    setLoadingAccount(true);
    setErrorAccount(null);
    inversify.getAccountUsecase.execute({ account_id: accountId })
      .then((resp: GetAccountUsecaseModel) => {
        if (resp.message === CODES.SUCCESS && resp.data) setAccount(resp.data);
        else setErrorAccount(resp.message);
      })
      .catch(e => setErrorAccount(e.message))
      .finally(() => setLoadingAccount(false));
  }, [accountId]);

  useEffect(() => {
    setLoadingOps(true);
    setErrorOps(null);
    inversify.getOperationsUsecase.execute({ account_id: accountId, page })
      .then((resp: GetOperationsUsecaseModel) => {
        if (resp.message === CODES.SUCCESS && resp.data) setOperations(resp.data);
        else setErrorOps(resp.message);
      })
      .catch(e => setErrorOps(e.message))
      .finally(() => setLoadingOps(false));
  }, [accountId, page]);

  const reload = useCallback(() => {
    setAccount(null);
    setOperations(null);
  }, []);

  return {
    account,
    operations,
    loadingAccount,
    loadingOps,
    errorAccount,
    errorOps,
    reload
  };
}
