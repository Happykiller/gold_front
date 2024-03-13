import * as React from 'react';
import * as dayjs from 'dayjs';
import { Trans, useTranslation } from 'react-i18next';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { createSearchParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, FormControl, Grid, InputLabel, MenuItem, Select, TextField } from '@mui/material';

import { CODES } from '@src/common/codes';
import Bar from '@presentation/molecule/bar';
import inversify from '@src/common/inversify';
import { Footer } from '@presentation/molecule/footer';
import { ThirdsSelect } from '@presentation/molecule/thirdsSelect';
import { FlashStore, flashStore} from '@presentation/molecule/flash';
import { AccountsSelect } from '@presentation/molecule/accountsSelect';
import { OperationUsecaseModel } from '@usecase/model/operation.usecase.model';
import { OpeCategoriesSelect } from '@presentation/molecule/opeCategoriesSelect';
import { GetOperationUsecaseModel } from '@usecase/getOperation/getOperation.usecase.model';
import { CreateOperationUsecaseModel } from '@usecase/createOperation/createOperation.usecase.model';

export const EditOperation = () => {
  const navigate = useNavigate();
  const [qry, setQry] = React.useState({
    loading: false,
    data: null,
    error: null
  });
  const { t } = useTranslation();
  const flash:FlashStore = flashStore();
  const [searchParams] = useSearchParams();
  const [operation, setOperation] = React.useState<OperationUsecaseModel>(null);

  const handleClick = async (event: React.SyntheticEvent) => {
    event.preventDefault();

    setQry(qry => ({
      ...qry,
      loading: true
    }));

    inversify.updateOperationUsecase.execute(operation)
      .then((response:CreateOperationUsecaseModel) => {
        if(response.message === CODES.SUCCESS) {
          flash.open(t('editOperation.succeed'));
          navigate({
            pathname: '/operations',
            search: createSearchParams({
              account_id: searchParams.get('account_id')
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

  if(qry.loading) {
    content = <div><Trans>common.loading</Trans></div>;
  } else if(qry.error) {
    content = <div><Trans>editOperation.{qry.error}</Trans></div>
  } else if (!operation && !qry.error) {
    setQry(qry => ({
      ...qry,
      loading: true
    }));
    inversify.getOperationUsecase.execute({
      operation_id: parseInt(searchParams.get('operation_id'))
    })
      .then((response:GetOperationUsecaseModel) => {
        if(response.message === CODES.SUCCESS) {
          setOperation(response.data);
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
  } else if (operation) {
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
            value={operation.amount}
            onChange={(e) => { 
              e.preventDefault();
              setOperation({
                ... operation,
                amount: parseFloat(e.target.value)
              });
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
              value={dayjs(parseInt(operation.date))}
              onChange={(newValue) => 
                setOperation({
                  ... operation,
                  date: newValue.format('YYYY-MM-DD')
                })
              }
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
            value={operation.description}
            onChange={(e) => { 
              e.preventDefault();
              setOperation({
                ... operation,
                description: e.target.value
              })
            }}
          />
        </Grid>

        {/* Field type */}
        <Grid 
          xs={6}
          item
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
                  ... operation,
                  type_id: e.target.value as number
                });
              }}
            >
              <MenuItem value={1}>Crédit</MenuItem>
              <MenuItem value={2}>Débit</MenuItem>
              <MenuItem value={3}>Virement</MenuItem>
            </Select>
          </FormControl>
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
            value={operation.account_id}
            label={<Trans>operation.account</Trans>}
            onChange={(e:any) => { 
              e.preventDefault();
              setOperation({
                ... operation,
                account_id: e.target.value as number
              });
            }}
          />
        </Grid>

        {/* Field account_dest */}
        <Grid 
          xs={6}
          item
          display={operation.type_id !== 3 ? "none" : "flex"}
          justifyContent="center"
          alignItems="center"
        >
          <AccountsSelect
            value={operation.account_id_dest??''}
            label={<Trans>operation.account_dest</Trans>}
            onChange={(e:any) => { 
              e.preventDefault();
              setOperation({
                ... operation,
                account_id_dest: e.target.value as number
              });
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
              value={operation.status_id}
              variant="standard"
              size="small"
              onChange={(e) => { 
                e.preventDefault();
                setOperation({
                  ... operation,
                  status_id: e.target.value as number
                });
              }}
            >
              <MenuItem value={1}>A suivre</MenuItem>
              <MenuItem value={2}>Réconcilier</MenuItem>
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
            value={operation.third_id}
            label={<Trans>operation.third</Trans>}
            onChange={(e:any) => { 
              e.preventDefault();
              setOperation({
                ... operation,
                third_id: e.target.value as number
              });
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
            value={operation.category_id}
            label={<Trans>operation.category</Trans>}
            onChange={(e:any) => { 
              e.preventDefault();
              setOperation({
                ... operation,
                category_id: e.target.value as number
              });
            }}
          />
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
            startIcon={<SaveAltIcon />}
            disabled={(operation.amount <= 0 || !operation.description || operation.account_id === operation.account_id_dest)}
          ><Trans>editOperation.send</Trans></Button>
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
            <Trans>editOperation.title</Trans>
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