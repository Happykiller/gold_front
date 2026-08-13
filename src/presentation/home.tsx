// src\presentation\home.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { CLIENT_ID } from '@src/common/clientId';
import { useAccounts } from '@presentation/hooks/useAccounts';
import { AccountTree } from '@presentation/molecule/accountTree';
import { AsyncState } from '@presentation/molecule/asyncState';
import { PageShell } from '@presentation/molecule/pageShell';
import { useOperationsChanged } from '@presentation/hooks/useOperationsChanged';

export const Home: React.FC = () => {
  const { data: accounts, loading, error, reload } = useAccounts();
  const { t } = useTranslation();

  /*
   * L'arbre porte les soldes de tous les comptes : tout événement le concerne,
   * il n'y a donc pas de filtre par compte. Et pas de pastille non plus — rien
   * ne défile ici, l'arbre peut se remettre à jour sans déplacer ce qu'on lit.
   */
  useOperationsChanged(
    React.useCallback(
      (events) => {
        // On ignore quand même son propre écho : un compte créé depuis cet
        // onglet n'a pas besoin d'un second aller-retour.
        if (events.every((event) => event.origin === CLIENT_ID)) return;
        reload();
      },
      [reload],
    ),
    reload,
  );

  return (
    <PageShell title={t('header.accounts')} width="full">
      <AsyncState
        loading={loading}
        error={error}
        isEmpty={!accounts || accounts.length === 0}
        empty={t('account.empty')}
      >
        <AccountTree accounts={accounts ?? []} />
      </AsyncState>
    </PageShell>
  );
};
