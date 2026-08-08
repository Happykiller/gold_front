// src\presentation\molecule\operationPicker.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Autocomplete, Box, TextField, Typography } from '@mui/material';

import { Operation } from '@presentation/hooks/useAccountOperations';
import {
  formatOperationDate,
  getCategoryIcon,
  getVisualAmountMeta,
} from '@presentation/molecule/operationDisplay';
import { MONO_FONT, TEXT } from '@src/theme/tokens';

type Props = {
  label: React.ReactNode;
  operations: Operation[];
  /** Le compte de référence, qui donne son sens au signe du montant. */
  currentAccountId: number;
  onPick: (operation: Operation) => void;
};

/**
 * Choisir une opération dans une liste.
 *
 * Elle se présentait comme une simple liste déroulante de chaînes
 * `montant — description`, sans date, sans filtre et sans hiérarchie : sur
 * cinquante lignes dont certaines portent un libellé de relevé bancaire de
 * quatre-vingts caractères, il fallait lire chaque entrée en entier pour
 * trouver la bonne.
 *
 * Elle emprunte maintenant le langage de la liste des opérations — date en
 * chasse fixe, pictogramme de catégorie, description tronquée, montant à
 * droite et coloré par son sens — et se filtre à la frappe, sur la description
 * comme sur le montant.
 */
export const OperationPicker: React.FC<Props> = ({
  label,
  operations,
  currentAccountId,
  onPick,
}) => {
  const { t } = useTranslation();

  const describe = React.useCallback(
    (operation: Operation) =>
      operation.description || t('operation.no-description'),
    [t],
  );

  return (
    <Autocomplete
      options={operations}
      value={null}
      // Le champ ne retient pas son choix : chaque sélection empile une
      // opération de plus dans la liaison, et le champ redevient disponible.
      blurOnSelect
      clearOnBlur
      autoHighlight
      handleHomeEndKeys
      disabled={operations.length === 0}
      noOptionsText={t('common.no_result')}
      getOptionLabel={describe}
      isOptionEqualToValue={(option, current) => option.id === current.id}
      // Le montant se cherche autant que le libellé : on retrouve plus vite une
      // ligne par « 71,75 » que par son intitulé de relevé.
      filterOptions={(options, { inputValue }) => {
        const needle = inputValue.trim().toLowerCase();
        if (!needle) return options;
        return options.filter(
          (operation) =>
            describe(operation).toLowerCase().includes(needle) ||
            String(operation.amount).includes(needle.replace(',', '.')),
        );
      }}
      onChange={(_event, operation) => operation && onPick(operation)}
      renderOption={(props, operation) => {
        // MUI dérive sa clé de `getOptionLabel` : toutes les opérations sans
        // description partageraient donc la même, et React en omettrait
        // silencieusement. On la remplace par l'identifiant, seul unique.
        const { key, ...rest } =
          props as React.HTMLAttributes<HTMLLIElement> & { key: string };
        const { value, color } = getVisualAmountMeta(
          operation,
          currentAccountId,
        );

        return (
          <Box
            component="li"
            key={operation.id}
            {...rest}
            sx={{ display: 'block !important', py: '4px !important' }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '42px 18px 1fr 104px',
                alignItems: 'center',
                columnGap: '10px',
                width: '100%',
              }}
            >
              <Typography
                component="span"
                sx={{
                  fontFamily: MONO_FONT,
                  fontSize: 10.5,
                  color: TEXT.meta,
                }}
              >
                {formatOperationDate(operation.date)}
              </Typography>
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  justifyContent: 'center',
                  lineHeight: 0,
                  '& .MuiSvgIcon-root': { fontSize: 13 },
                }}
              >
                {getCategoryIcon(operation.category?.label ?? '')}
              </Box>
              <Typography
                component="span"
                noWrap
                sx={{ fontSize: 13, color: TEXT.description }}
              >
                {describe(operation)}
              </Typography>
              <Typography
                component="span"
                sx={{
                  fontFamily: MONO_FONT,
                  fontWeight: 500,
                  fontSize: 12,
                  fontVariantNumeric: 'tabular-nums',
                  textAlign: 'right',
                  color,
                }}
              >
                {value}
              </Typography>
            </Box>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField {...params} variant="standard" label={label} />
      )}
      sx={{ m: 1 }}
    />
  );
};
