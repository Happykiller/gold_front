import dayjs from 'dayjs';
import { Dayjs } from 'dayjs';
import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { createSearchParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, FormControl, Grid2, InputLabel, MenuItem, Select, TextField } from '@mui/material';

import { CODES } from '@src/common/codes';
import inversify from '@src/common/inversify';
import { ThirdsSelect } from '@presentation/molecule/thirdsSelect';
import { AccountsSelect } from '@presentation/molecule/accountsSelect';
import { OperationUsecaseModel } from '@usecase/model/operation.usecase.model';
import { OpeCategoriesSelect } from '@presentation/molecule/opeCategoriesSelect';
import { contextStore, ContextStoreModel } from '@presentation/store/contextStore';
import { CreateOperationUsecaseModel } from '@usecase/createOperation/createOperation.usecase.model';
import { useFlashStore } from '@happykiller/sunny-ui';

export const OperationNew = () => {
  const navigate = useNavigate();
  const [qry, setQry] = React.useState<{
    loading: boolean | null,
    data: any,
    error: string | null
  }>({
    loading: null,
    data: null,
    error: null
  });
  const { t } = useTranslation();
  const flash = useFlashStore();
  const [searchParams] = useSearchParams();
  const context: ContextStoreModel = contextStore();
  const [operation, setOperation] = React.useState<OperationUsecaseModel | any>({
    id: null,
    account_id: parseInt(searchParams.get('account_id') ?? '0'),
    account: null,
    account_id_dest: null,
    account_dest: null,
    amount: 0,
    date: dayjs().format('YYYY-MM-DD'),
    status_id: 1,
    type_id: 2,
    third_id: 2,
    third: null,
    category_id: 1,
    category: null,
    description: 'description',
    active: true,
    creator_id: parseInt(context.id),
    creation_date: dayjs().format('YYYY-MM-DD'),
    modificator_id: parseInt(context.id),
    modification_date: dayjs().format('YYYY-MM-DD')
  });
  const [opDate, setOpDate] = React.useState<Dayjs>(dayjs());

  const handleClick = async (event: React.SyntheticEvent) => {
    event.preventDefault();

    setQry(qry => ({
      ...qry,
      loading: true
    }));

    const dto: any = {
      ...operation,
      date: opDate.format('YYYY-MM-DD')
    };

    inversify.createOperationUsecase.execute(dto)
      .then((response: CreateOperationUsecaseModel) => {
        if (response.message === CODES.SUCCESS) {
          flash.open(t('operation_new.succeed'));
          navigate({
            pathname: '/operations',
            search: createSearchParams({
              account_id: searchParams.get('account_id') ?? '0'
            }).toString()
          });
        } else {
          inversify.loggerService.debug(response.error);
          setQry(qry => ({
            ...qry,
            error: response.message
          }));
        }
      })
      .catch((error: any) => {
        setQry(qry => ({
          ...qry,
          error: error.message
        }));
      })
      .finally(() => {
        setQry(qry => ({
          ...qry,
          loading: false
        }));
      });
  }

  let content = <form
    onSubmit={handleClick}
  >
    <Grid2
      container
      rowSpacing={1}
      columnSpacing={{ xs: 1, sm: 2, md: 3 }}
    >

      {/* Field amount */}
      <Grid2
        size={6}
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <TextField
          sx={{ marginRight: 1 }}
          label={<Trans>operation.amount</Trans>}
          variant="standard"
          size="small"
          type='number'
          value={operation.amount}
          onChange={(e) => {
            e.preventDefault();
            setOperation({
              ...operation,
              amount: parseFloat(e.target.value)
            });
          }}
        />
      </Grid2>

      {/* Field date */}
      <Grid2
        size={6}
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            format="DD/MM/YYYY"
            label={<Trans>operation.date</Trans>}
            value={opDate}
            onChange={(newValue: any) =>
              setOpDate(newValue)
            }
          />
        </LocalizationProvider>
      </Grid2>

      {/* Field description */}
      <Grid2
        size={12}
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <TextField
          sx={{ marginRight: 1 }}
          fullWidth
          label={<Trans>operation.description</Trans>}
          variant="standard"
          size="small"
          value={operation.description}
          onChange={(e) => {
            e.preventDefault();
            setOperation({
              ...operation,
              description: e.target.value
            })
          }}
        />
      </Grid2>

      {/* Field type */}
      <Grid2
        size={6}
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={operation.type_id}
            variant="standard"
            size="small"
            onChange={(e) => {
              e.preventDefault();
              setOperation({
                ...operation,
                type_id: e.target.value as number
              });
            }}
          >
            <MenuItem value={1}>Crédit</MenuItem>
            <MenuItem value={2}>Débit</MenuItem>
            <MenuItem value={3}>Virement</MenuItem>
          </Select>
        </FormControl>
      </Grid2>

      {/* Field account */}
      <Grid2
        size={6}
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <AccountsSelect
          value={operation.account_id}
          type={0}
          label={<Trans>operation.account</Trans>}
          onChange={(e: any) => {
            e.preventDefault();
            setOperation({
              ...operation,
              account_id: e.target.value as number
            });
          }}
        />
      </Grid2>

      {/* Field account_dest */}
      <Grid2
        size={6}
        display={operation.type_id !== 3 ? "none" : "flex"}
        justifyContent="center"
        alignItems="center"
      >
        <AccountsSelect
          value={operation.account_id_dest ?? ''}
          label={<Trans>operation.account_dest</Trans>}
          onChange={(e: any) => {
            e.preventDefault();
            setOperation({
              ...operation,
              account_id_dest: parseInt(e.target.value)
            });
          }}
        />
      </Grid2>

      {/* Field status */}
      <Grid2
        size={6}
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
          <InputLabel><Trans>operation.status</Trans></InputLabel>
          <Select
            value={operation.status_id}
            variant="standard"
            size="small"
            onChange={(e) => {
              e.preventDefault();
              setOperation({
                ...operation,
                status_id: e.target.value as number
              });
            }}
          >
            <MenuItem value={1}>A suivre</MenuItem>
            <MenuItem value={2}>Réconcilier</MenuItem>
          </Select>
        </FormControl>
      </Grid2>

      {/* Field third */}
      <Grid2
        size={6}
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <ThirdsSelect
          value={operation.third_id}
          label={<Trans>operation.third</Trans>}
          onChange={(e: any) => {
            e.preventDefault();
            setOperation({
              ...operation,
              third_id: e.target.value as number
            });
          }}
        />
      </Grid2>

      {/* Field category */}
      <Grid2
        size={6}
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <OpeCategoriesSelect
          value={operation.category_id}
          label={<Trans>operation.category</Trans>}
          onChange={(e: any) => {
            e.preventDefault();
            setOperation({
              ...operation,
              category_id: e.target.value as number
            });
          }}
        />
      </Grid2>

      {/* Button submit */}
      <Grid2
        size={12}
        textAlign='center'
      >
        <Button
          type="submit"
          variant="contained"
          size="small"
          startIcon={<SaveAltIcon />}
          disabled={(operation.amount <= 0 || !operation.description || operation.account_id === operation.account_id_dest)}
        ><Trans>operation_create.send</Trans></Button>
      </Grid2>

    </Grid2>
  </form>
    ;

  return (
    <div className="app">
      <div className="parent_container">
        <div className="container">
          <div className='title'>
            <Trans>operation_create.title</Trans>
          </div>
          <div>
            {content}
          </div>
        </div>
      </div>
    </div>
  )
}