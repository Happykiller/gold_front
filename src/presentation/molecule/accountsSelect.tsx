// src\presentation\molecule\accountsSelect.tsx
import * as React from 'react';
import { Typography } from '@mui/material';

import inversify from '@src/common/inversify';
import { RefSelect, type RefItem } from '@presentation/molecule/refSelect';
import { formatEuroAmount } from '@presentation/molecule/operationDisplay';
import { AMOUNT, MONO_FONT, TEXT } from '@src/theme/tokens';

/** Ce que la requête `accounts` renvoie en plus du libellé. */
type AccountItem = RefItem & {
  type_id?: number;
  balance_not_reconcilied?: number | null;
};

type AccountsSelectProps = {
  value: string | number;
  label: React.ReactNode;
  onChange: (value: string) => void;
  /** 0 = tous, 1 = compte, 2 = modèle. */
  type?: number;
  /**
   * Affiche le solde **tous statuts** de chaque compte.
   *
   * C'est `balance_not_reconcilied`, qui agrège les opérations en attente et
   * pointées — le solde projeté, malgré son nom. Sur un compte modèle, il dit
   * ce que le clonage va déverser ; c'est l'information qui manque au moment
   * de choisir.
   */
  showBalance?: boolean;
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
  showBalance = false,
}) => (
  <RefSelect
    value={value}
    label={label}
    onChange={onChange}
    load={() => inversify.getAccountsUsecase.execute()}
    emptyValue={0}
    filter={
      type === 0 ? undefined : (item) => (item as AccountItem).type_id === type
    }
    renderTrailing={
      showBalance
        ? (item) => {
            const amount = (item as AccountItem).balance_not_reconcilied ?? 0;
            return (
              <Typography
                component="span"
                sx={{
                  fontFamily: MONO_FONT,
                  fontWeight: 500,
                  fontSize: 12,
                  fontVariantNumeric: 'tabular-nums',
                  color: amount < 0 ? AMOUNT.debit : TEXT.meta,
                }}
              >
                {formatEuroAmount(amount)}
              </Typography>
            );
          }
        : undefined
    }
    sx={{ m: 1 }}
  />
);
