// src\presentation\operations.tsx
import * as React from 'react';
import { useSearchParams, useNavigate, createSearchParams } from 'react-router-dom';
import { useAccountOperations } from '@presentation/hooks/useAccountOperations';
import { AccountHeader } from '@presentation/molecule/accountHeader';
import { OperationsTable } from '@presentation/molecule/operationsTable';
import inversify from '../common/inversify';

export const Operations = () => {
  const [searchParams] = useSearchParams();
  const accountId = parseInt(searchParams.get('account_id') ?? '0');
  const [page, setPage] = React.useState(0);
  const navigate = useNavigate();

  const {
    account,
    operations,
    loadingAccount,
    loadingOps,
    errorAccount,
    errorOps,
    reload,
  } = useAccountOperations(accountId, page);

  // Example callbacks (adapt to your logic/services)
  const handleEditOperation = (operation: any) => {
    navigate({
      pathname: '/operation_edit',
      search: createSearchParams({
        account_id: accountId.toString(),
        operation_id: operation.id.toString(),
      }).toString()
    });
  };

  const handleDeleteOperation = (operation: any) => {
    inversify.deleteOperationUsecase.execute({ operation_id: operation.id }).then(() => reload());
  };

  const handleRecoOperation = (operation: any) => {
    inversify.setRecoUsecase.execute({ operation_id: operation.id }).then(() => reload());
  };

  return (
    <>
      <AccountHeader
        account={account}
        loading={loadingAccount}
        error={errorAccount}
        page={page}
        setPage={setPage}
        onRefresh={reload}
        onAddOperation={() =>
          navigate({ pathname: '/operation_new', search: createSearchParams({ account_id: accountId.toString() }).toString() })
        }
        onCloneAccount={() =>
          navigate({ pathname: '/clone', search: createSearchParams({ account_id: accountId.toString() }).toString() })
        }
      />
      <OperationsTable
        operations={operations}
        loading={loadingOps}
        error={errorOps}
        onEditOperation={handleEditOperation}
        onDeleteOperation={handleDeleteOperation}
        onRecoOperation={handleRecoOperation}
      />
    </>
  );
};
