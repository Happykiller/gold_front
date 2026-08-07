// src\presentation\createVir.tsx
import dayjs from 'dayjs';
import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Delete, Info, Send } from '@mui/icons-material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { createSearchParams, useNavigate } from 'react-router-dom';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import {
  Box,
  Button,
  Typography,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  useTheme,
  Grid,
} from '@mui/material';
import EuroIcon from '@mui/icons-material/Euro';
import DescriptionIcon from '@mui/icons-material/Description';

import { CODES } from '@src/common/codes';
import inversify from '@src/common/inversify';
import { useFlashStore, Input } from '@happykiller/sunny-ui';
import { ThirdsSelect } from '@presentation/molecule/thirdsSelect';
import { AccountsSelect } from '@presentation/molecule/accountsSelect';
import { OpeCategoriesSelect } from '@presentation/molecule/opeCategoriesSelect';
import { GetOperationsUsecaseModel } from '@usecase/getOperations/getOperations.usecase.model';
import { CreateOperationUsecaseModel } from '@usecase/createOperation/createOperation.usecase.model';

export const CreateVir = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const flash = useFlashStore();

  const [qry, setQry] = React.useState<{
    loading: boolean | null;
    data: any;
    error: string | null;
  }>({ loading: null, data: null, error: null });
  const [qryOps, setQryLOps] = React.useState<{
    loading: boolean | null;
    data: any;
    error: string | null;
  }>({ loading: null, data: null, error: null });

  const [operations, setOperations] = React.useState<any[] | null>(null);
  const [selectedOperations, setSelectedOperations] = React.useState<any[]>([]);
  const [opeSelected, setOpeSelected] = React.useState('');
  const [currentThird, setCurrentThird] = React.useState('2');
  const [currentCategory, setCurrentCategory] = React.useState('1');
  const [currentAccount, setCurrentAccount] = React.useState('2');
  const [currentAccountDest, setCurrentAccountDest] = React.useState('2');
  const [currentStatus, setCurrentStatus] = React.useState('2');
  const [currentDate, setCurrentDate] = React.useState(dayjs());
  const [amount, setAmount] = React.useState({ value: '0.00', valid: false });
  const [desc, setDesc] = React.useState({ value: '', valid: false });

  const sum =
    Math.round(
      selectedOperations.reduce((n, { amount }) => n + amount, 0) * 100,
    ) / 100;

  const handleClick = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    setQry({ ...qry, loading: true });

    inversify.createOperationUsecase
      .execute({
        amount: parseFloat(amount.value.replace(',', '.')),
        vat_rate: 20,
        description: desc.value,
        date: currentDate.format('YYYY-MM-DD'),
        account_id: parseInt(currentAccount),
        status_id: parseInt(currentStatus),
        type_id: 3,
        third_id: parseInt(currentThird),
        category_id: parseInt(currentCategory),
        account_id_dest: parseInt(currentAccountDest),
        linkedOps: selectedOperations.map((ope) => ope.id),
      })
      .then((response: CreateOperationUsecaseModel) => {
        if (response.message === CODES.SUCCESS && response.data) {
          flash.open(t('createVir.succeed') + response.data.id);
          navigate({
            pathname: '/operations',
            search: createSearchParams({
              account_id: currentAccountDest,
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
    if (operations === null) {
      setQryLOps({ ...qryOps, loading: true });
      inversify.getOperationsUsecase
        .execute({
          account_id: parseInt(currentAccountDest),
          page: 0,
        })
        .then((response: GetOperationsUsecaseModel) => {
          if (response.message === CODES.SUCCESS && response.data) {
            setOperations(response.data);
          } else {
            setQryLOps({ ...qryOps, error: response.message });
          }
        })
        .catch((error) => {
          setQryLOps({ ...qryOps, error: error.message });
        })
        .finally(() => {
          setQryLOps({ ...qryOps, loading: false });
        });
    }
  }, [currentAccountDest]);

  const renderLinkedOperations = (
    <Grid size={12} container spacing={1} sx={{ justifyContent: 'center' }}>
      {selectedOperations.map((operation) => (
        <Grid key={operation.id}>
          <Button
            variant="contained"
            size="small"
            startIcon={<Delete />}
            sx={{ borderRadius: 2 }}
          >
            <Typography noWrap>
              {operation.amount}€ {operation.description}
            </Typography>
          </Button>
        </Grid>
      ))}
    </Grid>
  );

  const listOperations = qryOps.loading ? (
    <Trans>common.loading</Trans>
  ) : qryOps.error ? (
    <Trans>createVir.{qryOps.error}</Trans>
  ) : (
    <FormControl variant="standard" fullWidth>
      <InputLabel>
        <Trans>createVir.operations</Trans>
      </InputLabel>
      <Select
        variant="standard"
        size="small"
        value={opeSelected}
        onChange={(e) => {
          const val = e.target.value;
          setOpeSelected(val);
          setSelectedOperations((prev) => [...prev, val]);
        }}
      >
        <MenuItem value="">Aucune</MenuItem>
        {operations?.map(
          (operation) =>
            operation.type_id === 2 && (
              <MenuItem key={operation.id} value={operation}>
                <Typography noWrap>
                  {operation.amount}€ {operation.description}
                </Typography>
              </MenuItem>
            ),
        )}
      </Select>
    </FormControl>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        px: 2,
      }}
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
          background: {
            xs: 0,
            sm: theme.palette.background.default,
          },
          p: 3,
        }}
      >
        <Typography
          variant="h6"
          color="text.primary"
          sx={{ fontWeight: 700, textAlign: 'center', mb: 2 }}
        >
          <Trans>createVir.title</Trans>
        </Typography>

        {qry.loading ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
            <Trans>common.loading</Trans>
          </Typography>
        ) : qry.error ? (
          <Typography color="error.main" sx={{ textAlign: 'center' }}>
            <Trans>createVir.{qry.error}</Trans>
          </Typography>
        ) : (
          <form onSubmit={handleClick}>
            <Grid container spacing={2}>
              <Grid size={6}>
                <Input
                  label={<Trans>operation.amount</Trans>}
                  tooltip="Saisir un montant numérique (ex: 125.50)"
                  regex="^[0-9]+([.,][0-9]{1,2})?$"
                  require
                  virgin
                  entity={amount}
                  onChange={setAmount}
                  startIcon={<EuroIcon fontSize="small" />}
                  icons={{
                    help: <Info fontSize="small" />,
                  }}
                />
              </Grid>
              <Grid size={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    format="DD/MM/YYYY"
                    label={<Trans>operation.date</Trans>}
                    value={currentDate}
                    onChange={(newValue: any) => setCurrentDate(newValue)}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid size={12}>
                <Input
                  label={<Trans>operation.description</Trans>}
                  tooltip="Description obligatoire. Minimum 3 caractères"
                  regex="^.{3,}$"
                  require
                  virgin
                  entity={desc}
                  onChange={setDesc}
                  startIcon={<DescriptionIcon fontSize="small" />}
                  icons={{
                    help: <Info fontSize="small" />,
                  }}
                />
              </Grid>
              <Grid size={6}>
                <AccountsSelect
                  value={currentAccount}
                  label={<Trans>operation.account</Trans>}
                  onChange={(e: any) => setCurrentAccount(e.target.value)}
                />
              </Grid>
              <Grid size={6}>
                <AccountsSelect
                  value={currentAccountDest}
                  label={<Trans>operation.account_dest</Trans>}
                  onChange={(e: any) => {
                    setCurrentAccountDest(e.target.value);
                    setOperations(null);
                    setSelectedOperations([]);
                  }}
                />
              </Grid>
              <Grid size={6}>
                <FormControl variant="standard" fullWidth>
                  <InputLabel>
                    <Trans>operation.status</Trans>
                  </InputLabel>
                  <Select
                    value={currentStatus}
                    variant="standard"
                    onChange={(e) => setCurrentStatus(e.target.value)}
                  >
                    <MenuItem value="1">A suivre</MenuItem>
                    <MenuItem value="2">Réconcilier</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={6}>
                <ThirdsSelect
                  value={currentThird}
                  label={<Trans>operation.third</Trans>}
                  onChange={(e: any) => setCurrentThird(e.target.value)}
                />
              </Grid>
              <Grid size={6}>
                <OpeCategoriesSelect
                  value={currentCategory}
                  label={<Trans>operation.category</Trans>}
                  onChange={(e: any) => setCurrentCategory(e.target.value)}
                />
              </Grid>
              <Grid size={6}>{listOperations}</Grid>
              {renderLinkedOperations}
              {sum > 0 && (
                <Grid size={12} sx={{ textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="primary">
                    {sum} €
                  </Typography>
                </Grid>
              )}
              <Grid size={12} sx={{ textAlign: 'center' }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Send fontSize="small" />}
                  disabled={
                    !amount.valid ||
                    !desc.valid ||
                    currentAccount === currentAccountDest
                  }
                >
                  <Trans>createVir.send</Trans>
                </Button>
              </Grid>
            </Grid>
          </form>
        )}
      </Box>
    </Box>
  );
};
