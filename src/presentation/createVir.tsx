import * as React from 'react';
import * as dayjs from 'dayjs';
import { Delete, Send } from '@mui/icons-material';
import { Trans, useTranslation } from 'react-i18next';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { createSearchParams, useNavigate } from 'react-router-dom';
import { Button, FormControl, Grid, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';

import { CODES } from '@src/common/codes';
import Bar from '@presentation/molecule/bar';
import inversify from '@src/common/inversify';
import { Footer } from '@presentation/molecule/footer';
import { ThirdsSelect } from '@presentation/molecule/thirdsSelect';
import { FlashStore, flashStore} from '@presentation/molecule/flash';
import { AccountsSelect } from '@presentation/molecule/accountsSelect';
import { OpeCategoriesSelect } from '@presentation/molecule/opeCategoriesSelect';
import { GetOperationsUsecaseModel } from '@usecase/getOperations/getOperations.usecase.model';
import { CreateOperationUsecaseModel } from '@usecase/createOperation/createOperation.usecase.model';

export const CreateVir = () => {
  const navigate = useNavigate();
  const [qry, setQry] = React.useState({
    loading: true,
    data: null,
    error: null
  });
  const [qryOps, setQryLOps] = React.useState({
    loading: false,
    data: null,
    error: null
  });
  const { t } = useTranslation();
  const flash:FlashStore = flashStore();
  const [operations, setOperations] = React.useState<any[]>(null);
  const [selectedOperations, setSelectedOperations] = React.useState<any[]>([]);
  const [currentDsc, setCurrentDsc] = React.useState('');
  const [opeSelected, setOpeSelected] = React.useState('');
  const [currentThird, setCurrentThird] = React.useState('2');
  const [currentCategory, setCurrentCategory] = React.useState('1');
  const [currentAccount, setCurrentAccount] = React.useState('2');
  const [currentAccountDest, setCurrentAccountDest] = React.useState('2');
  const [currentStatus, setCurrentStatus] = React.useState('2');
  const [currentAmount, setCurrentAmount] = React.useState("0.00");
  const [currentDate, setCurrentDate] = React.useState(dayjs());

  const handleClick = async (event: React.SyntheticEvent) => {
    event.preventDefault();

    setQry(qry => ({
      ...qry,
      loading: true
    }));

    inversify.createOperationUsecase.execute({
      amount: parseFloat(currentAmount),
      date: currentDate.format('YYYY-MM-DD'),
      description: currentDsc,
      account_id: parseInt(currentAccount),
      status_id: parseInt(currentStatus),
      type_id: 3,
      third_id: parseInt(currentThird),
      category_id: parseInt(currentCategory),
      account_dest_id: parseInt(currentAccountDest),
      linkedOps: selectedOperations.map((ope) => ope.id)
    })
      .then((response:CreateOperationUsecaseModel) => {
        if(response.message === CODES.SUCCESS) {
          flash.open(t('createVir.succeed')+response.data.id);
          navigate({
            pathname: '/operations',
            search: createSearchParams({
              account_id: currentAccountDest
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
      .catch((error:any) => {
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

  let content = <div></div>;
  let sumOps = <div></div>;
  let listOperations = <div></div>;

  const sum = Math.round(selectedOperations.reduce((n, {amount}) => n + amount, 0) * 100) / 100;
  if (sum > 0) {
    sumOps = (<div>
      {sum} €
    </div>)
  }

  if(qryOps.loading) {
    listOperations = <div><Trans>common.loading</Trans></div>;
  } else if(qryOps.error) {
    listOperations = <div><Trans>createVir.{qry.error}</Trans></div>
  } else if (operations === null) {
    setQryLOps(qry => ({
      ...qry,
      loading: true
    }));
    inversify.getOperationsUsecase.execute({
      account_id: parseInt(currentAccountDest),
      page: 0
    })
      .then((response:GetOperationsUsecaseModel) => {
        if(response.message === CODES.SUCCESS) {
          setOperations(response.data);
        } else {
          inversify.loggerService.debug(response.error);
          setQryLOps(qry => ({
            ...qry,
            error: response.message
          }));
        }
      })
      .catch((error:any) => {
        setQryLOps(qry => ({
          ...qry,
          error: error.message
        }));
      })
      .finally(() => {
        setQryLOps(qry => ({
          ...qry,
          loading: false
        }));
      });
  } else {
    listOperations = (<FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
      <InputLabel><Trans>createVir.operations</Trans></InputLabel>
      <Select
        variant="standard"
        size="small"
        value={opeSelected}
        onChange={(e) => { 
          e.preventDefault();
          setOpeSelected(e.target.value);
          selectedOperations.push(e.target.value)
          setSelectedOperations(selectedOperations);
        }}
      >
        <MenuItem value="">Aucune</MenuItem>
        {
          operations.map((operation) => {
            if (operation.type_id === 2) {
              return <MenuItem 
                key={operation.id} 
                value={operation}
                sx={{
                  width: '300px'
                }}
              ><Typography noWrap>{operation.amount}€ {operation.description}</Typography></MenuItem>;
            }
          })
        }
      </Select>
    </FormControl>)
  }

  if(qry.loading) {
    content = <div><Trans>common.loading</Trans></div>;
  } if(qry.error) {
    content = <div><Trans>createVir.{qry.error}</Trans></div>
  } else {
    content = <form
      onSubmit={handleClick}
    >
      <Grid 
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 2, md: 3 }}
        >

        {/* Field amount */}
        <Grid 
          xs={6}
          item
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <TextField
            sx={{ marginRight:1 }}
            label={<Trans>operation.amount</Trans>}
            variant="standard"
            size="small"
            type='number'
            value={currentAmount}
            onChange={(e) => { 
              e.preventDefault();
              setCurrentAmount(e.target.value);
            }}
          />
        </Grid>

        {/* Field date */}
        <Grid 
          xs={6}
          item
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              format="DD/MM/YYYY"
              label={<Trans>operation.date</Trans>}
              value={currentDate}
              onChange={(newValue) => setCurrentDate(newValue)}
            />
          </LocalizationProvider>
        </Grid>

        {/* Field description */}
        <Grid 
          xs={12}
          item
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <TextField
            sx={{ marginRight:1 }}
            fullWidth
            label={<Trans>operation.description</Trans>}
            variant="standard"
            size="small"
            value={currentDsc}
            onChange={(e) => { 
              e.preventDefault();
              setCurrentDsc(e.target.value);
            }}
          />
        </Grid>

        {/* Field account */}
        <Grid 
          xs={6}
          item
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <AccountsSelect
            value={currentAccount}
            label={<Trans>operation.account</Trans>}
            onChange={(e:any) => { 
              setCurrentAccount(e.target.value);
            }}
          />
        </Grid>

        {/* Field account_dest */}
        <Grid 
          xs={6}
          item
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <AccountsSelect
            value={currentAccountDest}
            label={<Trans>operation.account_dest</Trans>}
            onChange={(e:any) => { 
              e.preventDefault();
              setCurrentAccountDest(e.target.value);
              setOperations(null);
              setSelectedOperations([]);
            }}
          />
        </Grid>

        {/* Field status */}
        <Grid 
          xs={6}
          item
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
            <InputLabel><Trans>operation.status</Trans></InputLabel>
            <Select
              value={currentStatus}
              variant="standard"
              size="small"
              onChange={(e) => { 
                e.preventDefault();
                setCurrentStatus(e.target.value);
              }}
            >
              <MenuItem value='1'>A suivre</MenuItem>
              <MenuItem value='2'>Réconcilier</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Field third */}
        <Grid 
          xs={6}
          item
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <ThirdsSelect
            value={currentThird}
            label={<Trans>operation.third</Trans>}
            onChange={(e:any) => { 
              e.preventDefault();
              setCurrentThird(e.target.value);
            }}
          />
        </Grid>

        {/* Field category */}
        <Grid 
          xs={6}
          item
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <OpeCategoriesSelect
            value={currentCategory}
            label={<Trans>operation.category</Trans>}
            onChange={(e:any) => { 
              e.preventDefault();
              setCurrentCategory(e.target.value);
            }}
          />
        </Grid>

        {/* Operations */}
        <Grid 
          xs={6}
          item
          textAlign='center'
        >
          {listOperations}
        </Grid>

        {/* Linked operation */}
        <Grid 
          item
          xs={12}
          container
          spacing={1}
          display='flex'
          justifyContent='center'
        >
          {
            selectedOperations.map((operation) => {
              return (
                <Grid
                  item
                  key={operation.id}
                >
                  <Button 
                    variant="contained"
                    size="small"
                    startIcon={<Delete />}
                  >
                    <Typography noWrap>{operation.amount}€ {operation.description}</Typography>
                  </Button>
                </Grid>
              )
            })
          }
        </Grid>
        <Grid 
          item
          xs={12}
          container
          spacing={1}
          display='flex'
          justifyContent='center'
        >
          {sumOps}
        </Grid>

        {/* Button submit */}
        <Grid 
          xs={12}
          item
          textAlign='center'
        >
          <Button 
            type="submit"
            variant="contained"
            size="small"
            startIcon={<Send />}
            disabled={(parseFloat(currentAmount) <= 0 || !currentDsc || currentAccount === currentAccountDest)}
          ><Trans>createVir.send</Trans></Button>
        </Grid>

      </Grid>
    </form>
    ;
  }

  return (
    <div className="app">
      <Bar/>
      <div className="parent_container">
        <div className="container">
          <div className='title'>
            <Trans>createVir.title</Trans>
          </div>
          <div>
            {content}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}