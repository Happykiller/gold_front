// src\presentation\home.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { useAccounts } from '@presentation/hooks/useAccounts';
import { AccountTree } from '@presentation/molecule/accountTree';
import { AsyncState } from '@presentation/molecule/asyncState';
import { PageShell } from '@presentation/molecule/pageShell';

export const Home: React.FC = () => {
  const { data: accounts, loading, error } = useAccounts();
  const { t } = useTranslation();

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
