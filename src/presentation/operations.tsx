// src\presentation\operations.tsx
import * as React from 'react';
import {
  useSearchParams,
  useNavigate,
  createSearchParams,
} from 'react-router-dom';

import inversify from '@src/common/inversify';
import { CLIENT_ID } from '@src/common/clientId';
import { CODES } from '@happykiller/sunny-ui';
import { useAtTop } from '@presentation/hooks/useAtTop';
import { useOperationsChanged } from '@presentation/hooks/useOperationsChanged';
import {
  decide,
  mergePending,
  NO_PENDING,
  pendingCount,
  type PendingChanges,
} from '@presentation/hooks/operationsChanged';
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
import { ImportOperationsDialog } from '@presentation/molecule/importOperationsDialog';
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
  const [importOpen, setImportOpen] = React.useState(false);
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

  /*
   * Le temps réel.
   *
   * Toute la mécanique passe par le `reload` existant — celui du bouton
   * « rafraîchir » — pour que `runRef`, `fetchingRef`, `loadedRef` et le
   * chargement continu gardent exactement la sémantique déjà éprouvée.
   */
  const { atTopRef, setTopSentinel } = useAtTop();
  const [pending, setPending] = React.useState<PendingChanges>(NO_PENDING);
  // Le cumul se lit dans une ref : la callback d'événement ne doit pas se
  // recréer à chaque changement d'attente, sinon elle change d'identité entre
  // deux événements d'un même import.
  const pendingRef = React.useRef(pending);
  pendingRef.current = pending;

  const refresh = React.useCallback(() => {
    setPending(NO_PENDING);
    reload();
  }, [reload]);

  useOperationsChanged(
    React.useCallback(
      (events) => {
        let attente: PendingChanges | null = null;
        for (const event of events) {
          const verdict = decide(event, {
            accountId,
            clientId: CLIENT_ID,
            atTop: atTopRef.current,
          });
          // En tête de liste, on recharge : rien ne bouge sous les yeux, et un
          // rechargement couvre tout le paquet. Inutile d'examiner la suite.
          if (verdict === 'reload') {
            refresh();
            return;
          }
          if (verdict === 'pending') {
            attente = mergePending(attente ?? pendingRef.current, event);
          }
        }
        if (attente) setPending(attente);
      },
      [accountId, refresh, atTopRef],
    ),
    // Les événements émis pendant une coupure sont perdus : le protocole ne les
    // rejoue pas. On se resynchronise une fois au retour plutôt que de rester
    // silencieusement en retard.
    refresh,
  );

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

  /**
   * L'autre bout d'un virement se visite d'un clic.
   *
   * Mémoïsée comme les autres : elle descend jusqu'à chaque ligne, qui est
   * mémoïsée — une callback recréée à chaque rendu suffirait à annuler
   * l'optimisation sur toute la liste accumulée.
   */
  const handleOpenAccount = React.useCallback(
    (targetAccountId: number) => {
      // Les critères suivent le changement de compte. Les laisser tomber de
      // l'URL sans vider l'état les rendrait actifs mais invisibles : la liste
      // resterait filtrée sans que rien ne l'explique.
      const params: Record<string, string> = {
        account_id: targetAccountId.toString(),
      };
      const serializedTokens = serializeTokens(tokens);
      if (serializedTokens) params.q = serializedTokens;

      navigate({
        pathname: '/operations',
        search: createSearchParams(params).toString(),
      });
    },
    [navigate, tokens],
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
        onRefresh={refresh}
        pendingCount={pendingCount(pending)}
        pendingKind={pending.kind}
        onAddOperation={() =>
          navigate({
            pathname: '/operation_new',
            search: createSearchParams({
              account_id: accountId.toString(),
            }).toString(),
          })
        }
        onImportOperations={() => setImportOpen(true)}
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
        topSentinel={setTopSentinel}
        current_account_id={accountId}
        operations={operations}
        filtered={tokens.length > 0}
        loading={loadingOps}
        loadingMore={loadingMore}
        hasMore={hasMore}
        onLoadMore={loadMore}
        error={errorOps}
        onOpenAccount={handleOpenAccount}
        onEditOperation={handleEditOperation}
        onDeleteOperation={handleDeleteOperation}
        onRecoOperation={handleRecoOperation}
      />
      <FloatingCalculator />
      {/*
       * Monté seulement quand il est ouvert : la modale charge l'historique du
       * compte dès qu'un fichier est déposé, et rien de tout cela n'a de raison
       * d'exister tant que l'utilisateur ne l'a pas demandé.
       *
       * `reload` en fin d'import plutôt qu'une insertion locale : les soldes de
       * l'en-tête sont calculés par le serveur, et une série de créations les
       * déplace tous les deux.
       */}
      {importOpen && (
        <ImportOperationsDialog
          open
          accountId={accountId}
          onClose={() => setImportOpen(false)}
          onImported={refresh}
        />
      )}
    </>
  );
};
