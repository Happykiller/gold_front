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
import {
  useAccountOperations,
  STATUS_RECONCILED,
  type Operation,
} from '@presentation/hooks/useAccountOperations';
import { getSignedAmount } from '@presentation/molecule/operationDisplay';
import { OperationsSearch } from '@presentation/molecule/operationsSearch';
import { useSearchReferentials } from '@presentation/hooks/useSearchReferentials';
import {
  deserializeTokens,
  serializeTokens,
  tokensToFilters,
  type Token,
} from '@presentation/hooks/searchTokens';

export const Operations = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const accountId = parseInt(searchParams.get('account_id') ?? '0');
  const navigate = useNavigate();

  const { refs, translate } = useSearchReferentials();
  const [tokens, setTokens] = React.useState<Token[]>([]);
  const hydratedRef = React.useRef(false);

  // Les critères vivent dans l'URL : on quitte la liste pour éditer une
  // opération et on y revient par `navigate`. Sans cela, les filtres seraient
  // perdus à chaque aller-retour.
  //
  // L'hydratation attend les référentiels : `cat:Alimentation` ne peut être
  // résolu en identifiant qu'une fois les catégories chargées. Elle n'a lieu
  // qu'une fois, sinon elle écraserait les jetons saisis depuis.
  const serialized = searchParams.get('q') ?? '';
  React.useEffect(() => {
    if (hydratedRef.current) return;
    if (!serialized) {
      hydratedRef.current = true;
      return;
    }
    if (refs.categories.length === 0 && refs.accounts.length === 0) return;
    setTokens(deserializeTokens(serialized, refs, translate));
    hydratedRef.current = true;
  }, [serialized, refs, translate]);

  const handleTokensChange = React.useCallback(
    (next: Token[]) => {
      setTokens(next);
      const params = new URLSearchParams(window.location.search);
      const value = serializeTokens(next);
      if (value) params.set('q', value);
      else params.delete('q');
      // `replace` : filtrer n'est pas une navigation, le bouton Retour doit
      // ramener à l'écran précédent, pas dérouler l'historique des filtres.
      setSearchParams(params, { replace: true });
    },
    [setSearchParams],
  );

  const filters = React.useMemo(() => tokensToFilters(tokens), [tokens]);

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
    reconcileBalances,
    removeBalances,
  } = useAccountOperations(accountId, filters);

  // Ces trois callbacks sont passés à chaque ligne du tableau, qui est
  // mémoïsée : les laisser se recréer à chaque rendu suffirait à annuler la
  // mémoïsation et à re-rendre toute la liste accumulée à chaque nouveau lot.
  const handleEditOperation = React.useCallback(
    (operation: Operation) => {
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
    (operation: Operation) => {
      inversify.deleteOperationUsecase
        .execute({ operation_id: operation.id })
        .then(() => {
          removeOperation(operation.id);
          removeBalances(
            getSignedAmount(operation, accountId),
            operation.status_id === STATUS_RECONCILED,
          );
        });
    },
    [removeOperation, removeBalances, accountId],
  );

  const handleRecoOperation = React.useCallback(
    (operation: Operation) => {
      inversify.setRecoUsecase
        .execute({ operation_id: operation.id })
        .then((resp) => {
          if (resp.message === CODES.SUCCESS && resp.data) {
            recoOperation(operation.id);
            // Le montant signé, jamais `operation.amount` : celui-ci est
            // toujours positif, et pointer un débit augmentait le solde.
            reconcileBalances(getSignedAmount(operation, accountId));
          }
        });
    },
    [recoOperation, reconcileBalances, accountId],
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
        search={
          <OperationsSearch
            tokens={tokens}
            onChange={handleTokensChange}
            refs={refs}
            translate={translate}
          />
        }
      />
      <OperationsTable
        current_account_id={accountId}
        operations={operations}
        filtered={tokens.length > 0}
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
