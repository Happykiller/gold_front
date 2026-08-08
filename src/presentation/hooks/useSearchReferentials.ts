// src\presentation\hooks\useSearchReferentials.ts
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import inversify from '@src/common/inversify';
import { CODES } from '@src/common/codes';
import {
  EMPTY_REFERENTIALS,
  type Referentials,
} from '@presentation/hooks/searchTokens';

/**
 * Charge les référentiels dont la barre de recherche a besoin pour résoudre
 * `cat:ali` en identifiant.
 *
 * Les quatre usecases mettent déjà leur résultat en cache sur le singleton
 * d'injection : au-delà du premier appel de la session, ces exécutions ne
 * touchent plus le réseau. Inutile d'ajouter un cache par-dessus.
 *
 * `getAccountsUsecase` fait exception — il n'a pas de cache interne, et c'est
 * le seul des cinq à provoquer une requête à chaque montage.
 */
export function useSearchReferentials() {
  const [refs, setRefs] = useState<Referentials>(EMPTY_REFERENTIALS);
  const { t } = useTranslation();

  useEffect(() => {
    let cancelled = false;

    const pick = <T extends { id: number; label: string }>(resp: {
      message: string;
      data?: T[] | null;
    }) =>
      resp.message === CODES.SUCCESS && resp.data
        ? resp.data.map(({ id, label }) => ({ id, label }))
        : [];

    Promise.all([
      inversify.getOpeCategoriesUsecase.execute(),
      inversify.getThirdsUsecase.execute(),
      inversify.getAccountsUsecase.execute(),
      inversify.getOpeTypesUsecase.execute(),
      inversify.getOpeStatusUsecase.execute(),
    ])
      .then(([categories, thirds, accounts, types, status]) => {
        if (cancelled) return;
        setRefs({
          categories: pick(categories),
          thirds: pick(thirds),
          accounts: pick(accounts),
          types: pick(types),
          status: pick(status),
        });
      })
      // Un référentiel indisponible dégrade la résolution des jetons, il ne
      // doit pas empêcher la liste de s'afficher : on garde des référentiels
      // vides et la recherche textuelle continue de fonctionner.
      .catch(() => {
        if (!cancelled) setRefs(EMPTY_REFERENTIALS);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Résout un libellé qui serait une clé i18n. Les tiers, types et statuts
   * arrivent du seed serveur sous cette forme ; les catégories et les comptes
   * sont des libellés littéraux, que `t` rend inchangés.
   */
  const translate = (label: string) => t(label);

  return { refs, translate };
}
