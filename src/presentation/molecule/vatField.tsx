// src\presentation\molecule\vatField.tsx
import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { TextField } from '@mui/material';

/** Un taux entier ou à deux décimales, de 0 à 100. */
const VAT_RATE = /^(100(\.0+)?|[0-9]{1,2}(\.[0-9]{1,2})?)$/;

export type VatValue = { value: string; valid: boolean };

/**
 * Le taux de TVA d'une opération.
 *
 * Recopié mot pour mot entre les deux écrans d'opération — expression
 * régulière, bornes et message d'erreur compris — et le message y était en
 * français dans le code.
 *
 * La virgule est acceptée à la saisie et normalisée en point : le clavier
 * numérique français produit une virgule, que `parseFloat` tronquerait
 * silencieusement à l'entier.
 */
export const VatField: React.FC<{
  value: VatValue;
  onChange: (next: VatValue, parsed: number | undefined) => void;
}> = ({ value, onChange }) => {
  const { t } = useTranslation();

  return (
    <TextField
      label={<Trans>operation.vat_rate</Trans>}
      variant="standard"
      fullWidth
      type="number"
      value={value.value}
      onChange={(event) => {
        const next = event.target.value.replace(',', '.');
        onChange(
          { value: next, valid: VAT_RATE.test(next) },
          next === '' ? undefined : parseFloat(next),
        );
      }}
      error={!value.valid}
      // Une chaîne d'espace insécable plutôt que rien : sans elle, le champ
      // change de hauteur dès que le message apparaît, et toute la ligne du
      // formulaire sursaute.
      helperText={value.valid ? ' ' : t('operation.vat_rate-hint')}
      slotProps={{
        htmlInput: { min: 0, max: 100, step: 0.1, inputMode: 'decimal' },
      }}
    />
  );
};
