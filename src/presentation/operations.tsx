// src\presentation\operations.tsx
import * as React from 'react';
import {
  useSearchParams,
  useNavigate,
  createSearchParams,
} from 'react-router-dom';

import inversify from '@src/common/inversify';
import { CODES } from '@happykiller/sunny-ui';
import { AccountHeader } from '@presentation/molecule/accountHeader';
import { OperationsTable } from '@presentation/molecule/operationsTable';
import { FloatingCalculator } from '@presentation/molecule/FloatingCalculator';
import { useAccountOperations } from '@presentation/hooks/useAccountOperations';

export const Operations = () => {
  const [searchParams] = useSearchParams();
  const accountId = parseInt(searchParams.get('account_id') ?? '0');
  const navigate = useNavigate();

  const {
    account,
    operations,
    loadingAccount,
    loadingOps,
    loadingMore,
    hasMore,
    loadMore,
    errorAccount,
    errorOps,
    reload,
    removeOperation,
    recoOperation,
    adjustBalance,
  } = useAccountOperations(accountId);

  // Ces trois callbacks sont passés à chaque ligne du tableau, qui est
  // mémoïsée : les laisser se recréer à chaque rendu suffirait à annuler la
  // mémoïsation et à re-rendre toute la liste accumulée à chaque nouveau lot.
  const handleEditOperation = React.useCallback(
    (operation: any) => {
      navigate({
        pathname: '/operation_edit',
        search: createSearchParams({
          account_id: accountId.toString(),
          operation_id: operation.id.toString(),
        }).toString(),
      });
    },
    [navigate, accountId],
  );

  const handleDeleteOperation = React.useCallback(
    (operation: any) => {
      inversify.deleteOperationUsecase
        .execute({ operation_id: operation.id })
        .then(() => {
          removeOperation(operation.id);
          adjustBalance(
            operation.amount,
            'delete',
            operation.status_id === 2 ? 'not_reconciled' : 'reconciled',
          );
        });
    },
    [removeOperation, adjustBalance],
  );

  const handleRecoOperation = React.useCallback(
    (operation: any) => {
      inversify.setRecoUsecase
        .execute({ operation_id: operation.id })
        .then((resp) => {
          if (resp.message === CODES.SUCCESS && resp.data) {
            recoOperation(operation.id);
            adjustBalance(operation.amount, 'reconcile', 'not_reconciled');
          }
        });
    },
    [recoOperation, adjustBalance],
  );

  return (
    <>
      <AccountHeader
        account={account}
        loading={loadingAccount}
        error={errorAccount}
        onRefresh={reload}
        onAddOperation={() =>
          navigate({
            pathname: '/operation_new',
            search: createSearchParams({
              account_id: accountId.toString(),
            }).toString(),
          })
        }
        onCloneAccount={() =>
          navigate({
            pathname: '/clone',
            search: createSearchParams({
              account_id: accountId.toString(),
            }).toString(),
          })
        }
      />
      <OperationsTable
        current_account_id={accountId}
        operations={operations}
        loading={loadingOps}
        loadingMore={loadingMore}
        hasMore={hasMore}
        onLoadMore={loadMore}
        error={errorOps}
        onEditOperation={handleEditOperation}
        onDeleteOperation={handleDeleteOperation}
        onRecoOperation={handleRecoOperation}
      />
      <FloatingCalculator />
    </>
  );
};
