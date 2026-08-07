// src\presentation\operation_new.tsx
import * as React from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { Trans, useTranslation } from 'react-i18next';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import EuroIcon from '@mui/icons-material/Euro';
import DescriptionIcon from '@mui/icons-material/Description';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import {
  createSearchParams,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import { CODES } from '@src/common/codes';
import inversify from '@src/common/inversify';
import { ThirdsSelect } from '@presentation/molecule/thirdsSelect';
import { AccountsSelect } from '@presentation/molecule/accountsSelect';
import { OpeCategoriesSelect } from '@presentation/molecule/opeCategoriesSelect';
import { CreateOperationUsecaseModel } from '@usecase/createOperation/createOperation.usecase.model';
import { Input, useFlashStore } from '@happykiller/sunny-ui';
import { CreateOperationUsecaseDto } from '@src/usecase/createOperation/createOperation.usecase.dto';

export const OperationNew = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const flash = useFlashStore();
  const [searchParams] = useSearchParams();

  const [qry, setQry] = React.useState<{
    loading: boolean | null;
    data: any;
    error: string | null;
  }>({ loading: null, data: null, error: null });

  const [opDate, setOpDate] = React.useState<Dayjs>(dayjs());
  const [desc, setDesc] = React.useState({ value: '', valid: false });
  const [amount, setAmount] = React.useState({ value: '', valid: false });
  const [vatRate, setVatRate] = React.useState({ value: '20', valid: true });

  const [operation, setOperation] = React.useState<CreateOperationUsecaseDto>({
    account_id: parseInt(searchParams.get('account_id') ?? '0'),
    amount: 0,
    vat_rate: 20,
    date: dayjs().format('YYYY-MM-DD'),
    status_id: 1,
    type_id: 2,
    third_id: 2,
    category_id: 1,
    description: '',
  });

  const handleClick = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    setQry({ ...qry, loading: true });

    const dto = {
      ...operation,
      amount: parseFloat(amount.value),
      vat_rate: parseFloat(vatRate.value.replace(',', '.')),
      description: desc.value,
      date: opDate.format('YYYY-MM-DD'),
    };

    inversify.createOperationUsecase
      .execute(dto)
      .then((response: CreateOperationUsecaseModel) => {
        if (response.message === CODES.SUCCESS) {
          flash.open(t('operation_new.succeed'));
          navigate({
            pathname: '/operations',
            search: createSearchParams({
              account_id: searchParams.get('account_id') ?? '0',
            }).toString(),
          });
        } else {
          setQry({ ...qry, error: response.message });
        }
      })
      .catch((error) => {
        setQry({ ...qry, error: error.message });
      })
      .finally(() => {
        setQry({ ...qry, loading: false });
      });
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      sx={{ px: 2 }}
    >
      <Box
        sx={{
          borderRadius: { xs: 0, sm: '16px' },
          boxShadow: {
            xs: 'none',
            sm: `0 0 32px 0 ${theme.palette.primary.main}55`,
          },
          border: { xs: 'none', sm: `2px solid ${theme.palette.primary.main}` },
          maxWidth: 600,
          width: '100%',
          background: {
            xs: 0,
            sm: theme.palette.background.default,
          },
          p: 3,
        }}
      >
        <Typography variant="h6" fontWeight={700} textAlign="center" mb={2}>
          <Trans>operation_create.title</Trans>
        </Typography>

        {qry.loading ? (
          <Typography textAlign="center">
            <Trans>common.loading</Trans>
          </Typography>
        ) : qry.error ? (
          <Typography textAlign="center" color="error.main">
            <Trans>operation_create.{qry.error}</Trans>
          </Typography>
        ) : (
          <form onSubmit={handleClick}>
            <Grid container spacing={2}>
              <Grid size={4}>
                <Input
                  label={<Trans>operation.amount</Trans>}
                  tooltip="Montant de l’opération (nombre positif)"
                  type="number"
                  regex="^[0-9]+(\.[0-9]{1,2})?$"
                  require
                  virgin
                  entity={amount}
                  onChange={setAmount}
                  startIcon={<EuroIcon fontSize="small" />}
                  icons={{
                    help: <InfoIcon fontSize="small" />,
                  }}
                />
              </Grid>
              <Grid size={4}>
                <TextField
                  label={<Trans>operation.vat_rate</Trans>}
                  variant="standard"
                  fullWidth
                  type="number"
                  value={vatRate.value}
                  onChange={(e) => {
                    const nextValue = e.target.value.replace(',', '.');
                    const valid =
                      /^(100(\.0+)?|[0-9]{1,2}(\.[0-9]{1,2})?)$/.test(
                        nextValue,
                      );
                    setVatRate({ value: nextValue, valid });
                    setOperation({
                      ...operation,
                      vat_rate:
                        nextValue === '' ? undefined : parseFloat(nextValue),
                    });
                  }}
                  error={!vatRate.valid}
                  helperText={!vatRate.valid ? 'Valeur entre 0 et 100' : ' '}
                  slotProps={{
                    htmlInput: {
                      min: 0,
                      max: 100,
                      step: 0.1,
                      inputMode: 'decimal',
                    },
                  }}
                />
              </Grid>
              <Grid size={4}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    format="DD/MM/YYYY"
                    label={<Trans>operation.date</Trans>}
                    value={opDate}
                    onChange={(newValue) => setOpDate(newValue!)}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid size={12}>
                <Input
                  label={<Trans>operation.description</Trans>}
                  tooltip="Champ requis. Min. 3 caractères"
                  regex="^.{3,}$"
                  require
                  virgin
                  entity={desc}
                  onChange={setDesc}
                  startIcon={<DescriptionIcon fontSize="small" />}
                  icons={{
                    help: <InfoIcon fontSize="small" />,
                  }}
                />
              </Grid>
              <Grid size={6}>
                <FormControl variant="standard" fullWidth>
                  <InputLabel>
                    <Trans>operation.type</Trans>
                  </InputLabel>
                  <Select
                    value={operation.type_id}
                    onChange={(e) =>
                      setOperation({
                        ...operation,
                        type_id: e.target.value as number,
                      })
                    }
                  >
                    <MenuItem value={1}>Crédit</MenuItem>
                    <MenuItem value={2}>Débit</MenuItem>
                    <MenuItem value={3}>Virement</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={6}>
                <AccountsSelect
                  value={operation.account_id}
                  type={0}
                  label={<Trans>operation.account</Trans>}
                  onChange={(e: any) =>
                    setOperation({ ...operation, account_id: e.target.value })
                  }
                />
              </Grid>
              {operation.type_id === 3 && (
                <Grid size={6}>
                  <AccountsSelect
                    value={operation.account_id_dest ?? ''}
                    label={<Trans>operation.account_dest</Trans>}
                    onChange={(e: any) =>
                      setOperation({
                        ...operation,
                        account_id_dest: e.target.value,
                      })
                    }
                  />
                </Grid>
              )}
              <Grid size={6}>
                <FormControl variant="standard" fullWidth>
                  <InputLabel>
                    <Trans>operation.status</Trans>
                  </InputLabel>
                  <Select
                    value={operation.status_id}
                    onChange={(e) =>
                      setOperation({
                        ...operation,
                        status_id: e.target.value as number,
                      })
                    }
                  >
                    <MenuItem value={1}>A suivre</MenuItem>
                    <MenuItem value={2}>Réconcilier</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={6}>
                <ThirdsSelect
                  value={operation.third_id}
                  label={<Trans>operation.third</Trans>}
                  onChange={(e: any) =>
                    setOperation({ ...operation, third_id: e.target.value })
                  }
                />
              </Grid>
              <Grid size={6}>
                <OpeCategoriesSelect
                  value={operation.category_id}
                  label={<Trans>operation.category</Trans>}
                  onChange={(e: any) =>
                    setOperation({ ...operation, category_id: e.target.value })
                  }
                />
              </Grid>
              <Grid size={12} textAlign="center">
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveAltIcon fontSize="small" />}
                  disabled={
                    !amount.valid ||
                    !desc.valid ||
                    !vatRate.valid ||
                    vatRate.value === '' ||
                    operation.account_id === operation.account_id_dest
                  }
                >
                  <Trans>operation_create.send</Trans>
                </Button>
              </Grid>
            </Grid>
          </form>
        )}
      </Box>
    </Box>
  );
};
