import dayjs from 'dayjs';
import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Add, Delete, Send, Info } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import {
  Box,
  Button,
  Typography,
  Switch,
  FormControlLabel,
  IconButton,
} from '@mui/material';
import EuroIcon from '@mui/icons-material/Euro';

import { CODES } from '@src/common/codes';
import inversify from '@src/common/inversify';
import { useFlashStore, Input } from '@happykiller/sunny-ui';
import { AccountsSelect } from '@presentation/molecule/accountsSelect';
import { OpeCategoriesSelect } from '@presentation/molecule/opeCategoriesSelect';
import { OpeStatusSelect } from '@presentation/molecule/opeRefSelects';
import { PageShell } from '@presentation/molecule/pageShell';
import { AsyncState } from '@presentation/molecule/asyncState';
import {
  FormSection,
  FormRow,
  SubmitBar,
} from '@presentation/molecule/formLayout';
import { formatEuroAmount } from '@presentation/molecule/operationDisplay';
import { AMOUNT, LINE, TEXT } from '@src/theme/tokens';
import { CreateOperationUsecaseModel } from '@usecase/createOperation/createOperation.usecase.model';
import {
  destinationAmount,
  isExceeded,
  isFullyAllocated,
  parseAmount,
  totalAllocated,
} from '@presentation/ventilation.calc';

export const Ventilation = () => {
  const { t } = useTranslation();
  const flash = useFlashStore();

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [currentDate, setCurrentDate] = React.useState<dayjs.Dayjs | null>(
    null,
  );
  const [currentStatus, setCurrentStatus] = React.useState('2');
  const [description, setDescription] = React.useState({
    value: 'Ventilation',
    valid: true,
  });
  const [categoryId, setCategoryId] = React.useState('');
  const [originAccount, setOriginAccount] = React.useState('');
  const [amount, setAmount] = React.useState({ value: '0.00', valid: false });

  const [destinations, setDestinations] = React.useState<
    {
      id: number;
      accountId: string;
      isPercentage: boolean;
      amountStr: { value: string; valid: boolean };
    }[]
  >([
    {
      id: 1,
      accountId: '',
      isPercentage: true,
      amountStr: { value: '100', valid: true },
    },
  ]);
  const [nextId, setNextId] = React.useState(2);

  const parsedTotalAmount = parseAmount(amount.value);

  // Montant réel de chaque ligne, pour l'affichage comme pour la création.
  const calculatedDestinations = destinations.map((dest) => ({
    ...dest,
    actualAmount: destinationAmount(dest, parsedTotalAmount),
  }));

  const allocated = totalAllocated(destinations, parsedTotalAmount);
  const exceeded = isExceeded(destinations, parsedTotalAmount);
  const isValid =
    currentDate !== null &&
    description.valid &&
    categoryId !== '' &&
    amount.valid &&
    originAccount !== '' &&
    destinations.length > 0 &&
    destinations.every((d) => d.accountId !== '' && d.amountStr.valid) &&
    isFullyAllocated(destinations, parsedTotalAmount);

  const handleCreateOperation = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!isValid || loading) return;

    setLoading(true);
    setError(null);
    try {
      // Loop over destinations to create each operation
      for (const dest of calculatedDestinations) {
        if (dest.actualAmount <= 0) continue;

        const response: CreateOperationUsecaseModel =
          await inversify.createOperationUsecase.execute({
            amount: dest.actualAmount,
            vat_rate: 20,
            description: description.value,
            date: currentDate!.format('YYYY-MM-DD'),
            account_id: parseInt(originAccount),
            status_id: parseInt(currentStatus),
            type_id: 3, // Transfer
            third_id: 1, // Default to a standard third id, assuming 1 is valid/self
            category_id: parseInt(categoryId),
            account_id_dest: parseInt(dest.accountId),
          });

        if (response.message !== CODES.SUCCESS) {
          throw new Error(response.message);
        }
      }
      flash.open(t('ventilation.succeed'));
      // Reset only the date to force user to re-enter it for the next iteration
      setCurrentDate(null);
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const addDestination = () => {
    setDestinations([
      ...destinations,
      {
        id: nextId,
        accountId: '',
        isPercentage: true,
        amountStr: { value: '0', valid: true },
      },
    ]);
    setNextId(nextId + 1);
  };

  const removeDestination = (id: number) => {
    setDestinations(destinations.filter((d) => d.id !== id));
  };

  const updateDestination = (id: number, key: string, value: any) => {
    setDestinations(
      destinations.map((d) => (d.id === id ? { ...d, [key]: value } : d)),
    );
  };

  return (
    <PageShell title={t('ventilation.title')} width="full">
      <AsyncState loading={loading}>
        <form onSubmit={handleCreateOperation}>
          <FormSection columns={3}>
            <DatePicker
              format="DD/MM/YYYY"
              label={<Trans>operation.date</Trans>}
              value={currentDate}
              onChange={(newValue) => setCurrentDate(newValue)}
              slotProps={{
                textField: { variant: 'standard', fullWidth: true },
              }}
            />
            <OpeStatusSelect
              value={currentStatus}
              label={<Trans>operation.status</Trans>}
              onChange={setCurrentStatus}
            />
            <OpeCategoriesSelect
              value={categoryId}
              label={<Trans>operation.category</Trans>}
              onChange={setCategoryId}
            />
          </FormSection>

          <FormSection>
            <AccountsSelect
              value={originAccount}
              label={<Trans>operation.account</Trans>}
              onChange={setOriginAccount}
            />
            <Input
              label={<Trans>ventilation.total_amount</Trans>}
              tooltip={t('operation.amount-hint')}
              regex="^[0-9]+([.,][0-9]{1,2})?$"
              require
              virgin={amount.value === '0.00'}
              entity={amount}
              onChange={setAmount}
              startIcon={<EuroIcon fontSize="small" />}
              icons={{ help: <Info fontSize="small" /> }}
            />
            <FormRow>
              <Input
                label={<Trans>operation.description</Trans>}
                require
                virgin={description.value === ''}
                entity={description}
                onChange={setDescription}
                regex="^.+$"
              />
            </FormRow>
          </FormSection>

          <FormSection title={t('ventilation.destinations')} columns={1}>
            {calculatedDestinations.map((dest) => (
              <Box
                key={dest.id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'minmax(0, 2fr) auto minmax(0, 1fr) 34px',
                  },
                  columnGap: '14px',
                  alignItems: 'center',
                  borderBottom: LINE.row,
                  py: '4px',
                }}
              >
                <AccountsSelect
                  value={dest.accountId}
                  label={<Trans>ventilation.dest_account</Trans>}
                  onChange={(value) =>
                    updateDestination(dest.id, 'accountId', value)
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={dest.isPercentage}
                      onChange={(event) =>
                        updateDestination(
                          dest.id,
                          'isPercentage',
                          event.target.checked,
                        )
                      }
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: 11.5, color: TEXT.label }}>
                      <Trans>ventilation.is_percentage</Trans>
                    </Typography>
                  }
                />
                <Box>
                  <Input
                    label={<Trans>ventilation.amount</Trans>}
                    regex="^[0-9]+([.,][0-9]{1,2})?$"
                    require
                    entity={dest.amountStr}
                    onChange={(val: { value: string; valid: boolean }) =>
                      updateDestination(dest.id, 'amountStr', val)
                    }
                  />
                  {/* Le montant réel d'une part exprimée en pourcentage. La
                      version précédente écrivait un ternaire dont les deux
                      branches étaient identiques. */}
                  {dest.isPercentage && (
                    <Typography sx={{ fontSize: 11, color: TEXT.meta }}>
                      → {formatEuroAmount(dest.actualAmount)}
                    </Typography>
                  )}
                </Box>
                <IconButton
                  aria-label={t('operation.action-delete')}
                  onClick={() => removeDestination(dest.id)}
                  disabled={destinations.length === 1}
                  size="small"
                  sx={{ '& .MuiSvgIcon-root': { fontSize: 16 } }}
                >
                  <Delete />
                </IconButton>
              </Box>
            ))}

            <Button
              variant="outlined"
              size="small"
              startIcon={<Add />}
              onClick={addDestination}
              sx={{ mt: '10px', justifySelf: 'start' }}
            >
              <Trans>ventilation.add_dest</Trans>
            </Button>
          </FormSection>

          {/* Le total réparti : rouge s'il dépasse, vert s'il tombe juste,
              orange tant qu'il reste un reliquat. */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '8px',
              mt: '16px',
              fontSize: 13,
              color: exceeded
                ? AMOUNT.debit
                : isFullyAllocated(destinations, parsedTotalAmount)
                  ? AMOUNT.credit
                  : 'warning.main',
            }}
          >
            <Trans>ventilation.total_allocated</Trans>
            <Box component="span" sx={{ fontWeight: 500 }}>
              {formatEuroAmount(allocated)} /{' '}
              {formatEuroAmount(parsedTotalAmount)}
            </Box>
            {exceeded && (
              <Typography sx={{ fontSize: 12.5, color: AMOUNT.debit }}>
                <Trans>ventilation.error_amount_exceeded</Trans>
              </Typography>
            )}
          </Box>

          <SubmitBar
            label={<Trans>ventilation.send</Trans>}
            icon={<Send fontSize="small" />}
            errorNamespace="ventilation"
            error={error}
            disabled={!isValid}
          />
        </form>
      </AsyncState>
    </PageShell>
  );
};
