// src\presentation\operation_edit.tsx
import * as React from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { Trans, useTranslation } from 'react-i18next';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {
  createSearchParams,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
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

import { CODES } from '@src/common/codes';
import inversify from '@src/common/inversify';
import { useFlashStore } from '@happykiller/sunny-ui';
import { ThirdsSelect } from '@presentation/molecule/thirdsSelect';
import { AccountsSelect } from '@presentation/molecule/accountsSelect';
import { OperationUsecaseModel } from '@usecase/model/operation.usecase.model';
import { OpeCategoriesSelect } from '@presentation/molecule/opeCategoriesSelect';
import { GetOperationUsecaseModel } from '@usecase/getOperation/getOperation.usecase.model';
import { CreateOperationUsecaseModel } from '@usecase/createOperation/createOperation.usecase.model';

export const EditOperation = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useTranslation();
  const flash = useFlashStore();
  const [searchParams] = useSearchParams();

  const [qry, setQry] = React.useState<{
    loading: boolean | null;
    data: any;
    error: string | null;
  }>({ loading: null, data: null, error: null });
  const [operation, setOperation] =
    React.useState<OperationUsecaseModel | null>(null);
  const [opDate, setOpDate] = React.useState<Dayjs>(dayjs());
  const [vatRateValue, setVatRateValue] = React.useState('20');

  const vatRateIsValid = /^(100(\.0+)?|[0-9]{1,2}(\.[0-9]{1,2})?)$/.test(
    vatRateValue,
  );

  const handleClick = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    setQry({ ...qry, loading: true });

    const dto = {
      ...operation,
      vat_rate: parseFloat(vatRateValue.replace(',', '.')),
      date: opDate.format('YYYY-MM-DD'),
    };

    inversify.updateOperationUsecase
      .execute(dto as OperationUsecaseModel)
      .then((response: CreateOperationUsecaseModel) => {
        if (response.message === CODES.SUCCESS) {
          flash.open(t('editOperation.succeed'));
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

  React.useEffect(() => {
    if (!operation && !qry.error) {
      setQry({ ...qry, loading: true });
      inversify.getOperationUsecase
        .execute({
          operation_id: parseInt(searchParams.get('operation_id') ?? '0'),
        })
        .then((response: GetOperationUsecaseModel) => {
          if (response.message === CODES.SUCCESS && response.data) {
            setOpDate(dayjs(parseInt(response.data.date)));
            setOperation(response.data);
            setVatRateValue(String(response.data.vat_rate ?? 20));
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
    }
  }, []);

  if (qry.loading) {
    return (
      <Typography textAlign="center">
        <Trans>common.loading</Trans>
      </Typography>
    );
  }

  if (qry.error) {
    return (
      <Typography textAlign="center" color="error.main">
        <Trans>editOperation.{qry.error}</Trans>
      </Typography>
    );
  }

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
          <Trans>editOperation.title</Trans>
        </Typography>

        {operation && (
          <form onSubmit={handleClick}>
            <Grid container spacing={2}>
              <Grid size={4}>
                <TextField
                  label={<Trans>operation.amount</Trans>}
                  variant="standard"
                  fullWidth
                  type="number"
                  value={operation.amount}
                  onChange={(e) =>
                    setOperation({
                      ...operation,
                      amount: parseFloat(e.target.value),
                    })
                  }
                />
              </Grid>
              <Grid size={4}>
                <TextField
                  label={<Trans>operation.vat_rate</Trans>}
                  variant="standard"
                  fullWidth
                  type="number"
                  value={vatRateValue}
                  onChange={(e) => {
                    const nextValue = e.target.value.replace(',', '.');
                    setVatRateValue(nextValue);
                    setOperation({
                      ...operation,
                      vat_rate:
                        nextValue === '' ? undefined : parseFloat(nextValue),
                    });
                  }}
                  error={!vatRateIsValid}
                  helperText={!vatRateIsValid ? 'Valeur entre 0 et 100' : ' '}
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
                <TextField
                  label={<Trans>operation.description</Trans>}
                  variant="standard"
                  fullWidth
                  value={operation.description}
                  onChange={(e) =>
                    setOperation({ ...operation, description: e.target.value })
                  }
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
                  startIcon={<SaveAltIcon />}
                  disabled={
                    operation.amount <= 0 ||
                    !operation.description ||
                    !vatRateIsValid ||
                    vatRateValue === '' ||
                    operation.account_id === operation.account_id_dest
                  }
                >
                  <Trans>editOperation.send</Trans>
                </Button>
              </Grid>
            </Grid>
          </form>
        )}
      </Box>
    </Box>
  );
};
