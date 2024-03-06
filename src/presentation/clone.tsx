import * as React from 'react';
import * as dayjs from 'dayjs';
import { Send } from '@mui/icons-material';
import { Trans, useTranslation } from 'react-i18next';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { createSearchParams, useNavigate } from 'react-router-dom';
import { Button, FormControl, Grid, InputLabel, MenuItem, Select, TextField } from '@mui/material';

import Bar from '@presentation/bar';
import { CODES } from '@src/common/codes';
import inversify from '@src/common/inversify';
import { Footer } from '@presentation/footer';
import { FlashStore, flashStore} from '@presentation/flash';
import { CloneOperationsUsecaseModel } from '@usecase/cloneOperations/cloneOperations.usecase.model';

export const Clone = () => {
  const navigate = useNavigate();
  const [qry, setQry] = React.useState({
    loading: true,
    data: null,
    error: null
  });
  const { t } = useTranslation();
  const flash:FlashStore = flashStore();
  const [currentAccount, setCurrentAccount] = React.useState('2');
  const [currentTemplate, setCurrentTemplate] = React.useState('2');
  const [currentDate, setCurrentDate] = React.useState(dayjs());

  const handleClick = async (event: React.SyntheticEvent) => {
    event.preventDefault();

    setQry(qry => ({
      ...qry,
      loading: true
    }));

    inversify.cloneOperationsUsecase.execute({
      date: currentDate.format('YYYY-MM-DD'),
      account_id: parseInt(currentAccount),
      template_account_id: parseInt(currentTemplate)
    })
      .then((response:CloneOperationsUsecaseModel) => {
        if(response.message === CODES.SUCCESS) {
          flash.open(t('clone.succeed'));
          navigate({
            pathname: '/operations',
            search: createSearchParams({
              account_id: currentAccount
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

        {/* Field account */}
        <Grid 
          xs={6}
          item
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
            <InputLabel><Trans>operation.account</Trans></InputLabel>
            <Select
              value={currentAccount}
              variant="standard"
              size="small"
              onChange={(e) => { 
                e.preventDefault();
                setCurrentAccount(e.target.value);
              }}
            >
              <MenuItem value='2'>Courant</MenuItem>
              <MenuItem value='4'>Alimentation</MenuItem>
              <MenuItem value='5'>Assurances</MenuItem>
              <MenuItem value='15'>Cadeaux</MenuItem>
              <MenuItem value='17'>Capital</MenuItem>
              <MenuItem value='33'>Chap42</MenuItem>
              <MenuItem value='6'>Charges</MenuItem>
              <MenuItem value='38'>Cluses</MenuItem>
              <MenuItem value='7'>Distribution</MenuItem>
              <MenuItem value='8'>Fabrice</MenuItem>
              <MenuItem value='9'>Geek</MenuItem>
              <MenuItem value='11'>Illidan</MenuItem>
              <MenuItem value='34'>Impôts</MenuItem>
              <MenuItem value='14'>Jeux</MenuItem>
              <MenuItem value='18'>Mobilité</MenuItem>
              <MenuItem value='10'>Régie Eau</MenuItem>
              <MenuItem value='20'>Santé</MenuItem>
              <MenuItem value='19'>Sorties</MenuItem>
              <MenuItem value='21'>Taxe foncière</MenuItem>
              <MenuItem value='22'>Taxe habitation</MenuItem>
              <MenuItem value='23'>Vacances</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Field template */}
        <Grid 
          xs={6}
          item
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
            <InputLabel><Trans>clone.template</Trans></InputLabel>
            <Select
              value={currentTemplate}
              variant="standard"
              size="small"
              onChange={(e) => { 
                e.preventDefault();
                setCurrentTemplate(e.target.value);
              }}
            >
              <MenuItem value=''>Aucun</MenuItem>
              <MenuItem value='26'>Prélèvement automatique</MenuItem>
              <MenuItem value='27'>Ventilation</MenuItem>
              <MenuItem value='29'>Echéances</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Field date */}
        <Grid 
          xs={12}
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
          ><Trans>clone.send</Trans></Button>
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
            <Trans>clone.title</Trans>
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