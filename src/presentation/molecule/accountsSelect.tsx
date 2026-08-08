// src\presentation\molecule\accountsSelect.tsx
import * as React from 'react';

import inversify from '@src/common/inversify';
import { RefSelect, type RefItem } from '@presentation/molecule/refSelect';

type AccountsSelectProps = {
  value: string | number;
  label: React.ReactNode;
  onChange: (value: string) => void;
  /** 0 = tous, 1 = compte, 2 = modèle. */
  type?: number;
};

/**
 * Sélecteur de compte.
 *
 * Sa sentinelle de vide vaut `0` et non la chaîne vide : les formulaires qui
 * l'emploient envoient un identifiant numérique.
 */
export const AccountsSelect: React.FC<AccountsSelectProps> = ({
  value,
  label,
  onChange,
  type = 0,
}) => (
  <RefSelect
    value={value}
    label={label}
    onChange={onChange}
    load={() => inversify.getAccountsUsecase.execute()}
    emptyValue={0}
    filter={
      type === 0
        ? undefined
        : (item: RefItem) => (item as { type_id?: number }).type_id === type
    }
    sx={{ m: 1 }}
  />
);
