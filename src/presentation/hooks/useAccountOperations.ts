// src\presentation\hooks\useAccountOperations.ts
import { useEffect, useState, useCallback, useRef } from 'react';
import inversify from '@src/common/inversify';
import { CODES } from '@src/common/codes';
import { GetOperationsUsecaseModel } from '@usecase/getOperations/getOperations.usecase.model';
import { GetAccountUsecaseModel } from '@usecase/getAccount/getAccount.usecase.model';
import type { OperationFilters } from '@presentation/hooks/searchTokens';

// Ces deux types décrivaient à la main ce que le hook reçoit, et avaient
// divergé : `vat_rate` y était optionnel alors que le serveur le renvoie
// toujours, et les soldes y étaient non nuls alors que le schéma les autorise
// à l'être. Les dériver du retour des usecases rend la divergence impossible.
export type Account = NonNullable<GetAccountUsecaseModel['data']>;
export type Operation = NonNullable<GetOperationsUsecaseModel['data']>[number];

/**
 * Taille d'un lot d'opérations, seul endroit où elle est écrite.
 *
 * 50 plutôt que les 25 de l'ancienne pagination : mesuré à ~170 ms contre
 * ~130 ms, et un premier lot assez fourni pour créer du scroll même sur un
 * grand écran — sans quoi la sentinelle resterait visible et rappellerait en
 * boucle jusqu'à remplir la page.
 */
export const OPERATIONS_PAGE_SIZE = 50;

const NO_FILTERS: OperationFilters = {};

/**
 * Identité stable d'un jeu de critères.
 *
 * `filters` est un objet reconstruit à chaque rendu : le prendre tel quel en
 * dépendance d'effet relancerait une série de chargement à chaque rendu, donc
 * en boucle. Les listes sont triées avant sérialisation pour que deux jeux
 * équivalents produisent la même clé.
 */
function filtersKey(filters: OperationFilters): string {
  const normalized: Record<string, unknown> = {};
  for (const key of Object.keys(filters).sort()) {
    const value = filters[key as keyof OperationFilters];
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      normalized[key] = [...value].sort((a, b) => a - b);
    } else {
      normalized[key] = value;
    }
  }
  return JSON.stringify(normalized);
}

export function useAccountOperations(
  accountId: number,
  filters: OperationFilters = NO_FILTERS,
) {
  const [account, setAccount] = useState<Account | null>(null);
  const [operations, setOperations] = useState<Operation[] | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [loadingOps, setLoadingOps] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorAccount, setErrorAccount] = useState<string | null>(null);
  const [errorOps, setErrorOps] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [refreshToken, setRefreshToken] = useState(0);

  // Nombre de lignes effectivement reçues du serveur. Volontairement distinct
  // de `operations.length` : `removeOperation` retire une ligne de l'affichage
  // sans que le serveur en sache rien, et déduire l'offset de la longueur
  // ferait sauter une opération au lot suivant.
  const loadedRef = useRef(0);
  // Un lot est en vol : empêche la sentinelle d'en déclencher un second.
  const fetchingRef = useRef(false);
  // Numéro de série, incrémenté à chaque remise à zéro (changement de compte
  // ou rafraîchissement). Une réponse d'une série périmée est ignorée au lieu
  // d'écraser un état plus récent.
  const runRef = useRef(0);

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

  // Les critères sont lus au moment de l'appel, via une ref : c'est leur
  // **clé** qui pilote les dépendances, pas l'objet lui-même.
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const filterKey = filtersKey(filters);

  const fetchBatch = useCallback(
    (offset: number, run: number) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;

      const isFirstBatch = offset === 0;
      if (isFirstBatch) setLoadingOps(true);
      else setLoadingMore(true);
      setErrorOps(null);

      inversify.getOperationsUsecase
        .execute({
          account_id: accountId,
          limit: OPERATIONS_PAGE_SIZE,
          offset,
          ...filtersRef.current,
        })
        .then((resp: GetOperationsUsecaseModel) => {
          if (run !== runRef.current) return;
          if (resp.message === CODES.SUCCESS && resp.data) {
            const batch = resp.data;
            loadedRef.current = offset + batch.length;
            setOperations((prev) =>
              isFirstBatch ? batch : [...(prev ?? []), ...batch],
            );
            // Faute de total côté serveur, un lot incomplet est le seul signal
            // de fin de liste. Un lot plein qui tombe pile sur la fin coûtera
            // un dernier appel à vide, sans conséquence.
            setHasMore(batch.length === OPERATIONS_PAGE_SIZE);
          } else {
            setErrorOps(resp.message);
            // Sans cela, la sentinelle relancerait indéfiniment un lot qui
            // échoue. Le bouton rafraîchir permet de reprendre.
            setHasMore(false);
          }
        })
        .catch((e) => {
          if (run !== runRef.current) return;
          setErrorOps(e.message);
          setHasMore(false);
        })
        .finally(() => {
          if (run !== runRef.current) return;
          fetchingRef.current = false;
          if (isFirstBatch) setLoadingOps(false);
          else setLoadingMore(false);
        });
    },
    // `filterKey` et non `filters` : l'objet change d'identité à chaque rendu,
    // sa clé ne change qu'au changement réel de critères.
    [accountId, filterKey],
  );

  useEffect(() => {
    // Changement de compte ou rafraîchissement : on repart du premier lot,
    // sinon les opérations du compte précédent resteraient empilées.
    runRef.current += 1;
    fetchingRef.current = false;
    loadedRef.current = 0;
    setOperations(null);
    setHasMore(true);
    fetchBatch(0, runRef.current);
  }, [fetchBatch, refreshToken]);

  const loadMore = useCallback(() => {
    if (fetchingRef.current || !hasMore) return;
    fetchBatch(loadedRef.current, runRef.current);
  }, [fetchBatch, hasMore]);

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
    loadingMore,
    hasMore,
    loadMore,
    errorAccount,
    errorOps,
    reload,
    removeOperation,
    recoOperation,
    adjustBalance,
  };
}
