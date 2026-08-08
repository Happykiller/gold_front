// src\presentation\molecule\accountsSelect.tsx
import * as React from 'react';
import { Typography } from '@mui/material';

import inversify from '@src/common/inversify';
import { RefSelect, type RefItem } from '@presentation/molecule/refSelect';
import {
  formatEuroAmount,
  getBalanceColor,
} from '@presentation/molecule/operationDisplay';
import { MONO_FONT } from '@src/theme/tokens';

/** Ce que la requête `accounts` renvoie en plus du libellé. */
type AccountItem = RefItem & {
  type_id?: number;
  parent_account_id?: number | null;
  balance_not_reconcilied?: number | null;
};

/** Référentiel fermé des types de compte (seed SQL `002-seed`). */
export const ACCOUNT_REGULAR = 1;
export const ACCOUNT_TEMPLATE = 2;

/**
 * Un compte sur lequel on saisit.
 *
 * Deux exclusions, et elles ne se devinent pas depuis une entrée seule :
 *
 * - les **modèles**, qui ne sont pas des comptes bancaires mais des patrons
 *   d'échéances, alimentés depuis l'écran de clonage ;
 * - les comptes qui **portent des enfants**, qui regroupent une branche et en
 *   agrègent les soldes sans jamais recevoir d'opération — « Mes comptes »,
 *   « Mes templates », « Livret Cap Region ».
 *
 * D'où le besoin de voir tout le référentiel : la filiation ne se lit qu'en
 * regardant les autres comptes.
 */
const isPostable = (item: RefItem, all: RefItem[]) => {
  const account = item as AccountItem;
  if (account.type_id === ACCOUNT_TEMPLATE) return false;
  return !all.some(
    (other) => (other as AccountItem).parent_account_id === account.id,
  );
};

type AccountsSelectProps = {
  value: string | number;
  label: React.ReactNode;
  onChange: (value: string) => void;
  /**
   * Force un type précis, et lève alors la règle par défaut.
   *
   * C'est ce dont l'écran de clonage a besoin pour sa liste de modèles : elle
   * doit montrer exactement ce que la règle exclut ailleurs.
   */
  type?: number;
};

/**
 * Sélecteur de compte.
 *
 * Chaque entrée porte son **solde tous statuts** — `balance_not_reconcilied`,
 * qui agrège les opérations en attente et pointées, le solde projeté malgré
 * son nom. C'est l'information qui manque au moment de choisir : sur un
 * modèle, elle dit ce que le clonage va déverser ; sur un compte réel, de quoi
 * on dispose.
 *
 * Elle ne coûte rien au formulaire : elle vit dans la liste déroulante, pas
 * dans le champ fermé, qui n'affiche que le libellé.
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
      type === 0 ? isPostable : (item) => (item as AccountItem).type_id === type
    }
    renderTrailing={(item) => {
      const amount = (item as AccountItem).balance_not_reconcilied ?? 0;
      return (
        <Typography
          component="span"
          sx={{
            fontFamily: MONO_FONT,
            fontWeight: 500,
            fontSize: 12,
            fontVariantNumeric: 'tabular-nums',
            color: getBalanceColor(amount),
          }}
        >
          {formatEuroAmount(amount)}
        </Typography>
      );
    }}
    sx={{ m: 1 }}
  />
);
