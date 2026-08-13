// src/hooks/useAccounts.ts
import * as React from 'react';
import { GetAccountsUsecaseModel } from '@usecase/getAccounts/getAccounts.usecase.model';
import inversify from '@src/common/inversify';
import { CODES } from '@src/common/codes';
import { formatAccounts, FormattedAccount } from '@presentation/hooks/accounts';

export function useAccounts() {
  const [data, setData] = React.useState<FormattedAccount[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  // Même patron que `useAccountOperations` : un compteur en dépendance de
  // l'effet, pour que le rechargement passe par le chemin déjà éprouvé.
  const [refreshToken, setRefreshToken] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    inversify.getAccountsUsecase
      .execute()
      .then((response: GetAccountsUsecaseModel) => {
        if (!cancelled) {
          if (response.message === CODES.SUCCESS && response.data) {
            setData(formatAccounts(response.data));
          } else {
            setError(response.error ?? response.message);
          }
        }
      })
      .catch((err: any) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  const reload = React.useCallback(() => {
    setRefreshToken((prev) => prev + 1);
  }, []);

  return { data, loading, error, reload };
}
