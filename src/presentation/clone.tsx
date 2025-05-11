import dayjs from 'dayjs';
import * as React from 'react';
import { Send } from '@mui/icons-material';
import { Button, Grid2 } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { createSearchParams, useNavigate } from 'react-router-dom';

import { CODES } from '@src/common/codes';
import inversify from '@src/common/inversify';
import { AccountsSelect } from '@presentation/molecule/accountsSelect';
import { CloneOperationsUsecaseModel } from '@usecase/cloneOperations/cloneOperations.usecase.model';
import { useFlashStore } from '@happykiller/sunny-ui';

export const Clone = () => {
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
  const [currentAccount, setCurrentAccount] = React.useState('0');
  const [currentTemplate, setCurrentTemplate] = React.useState('0');
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
      .then((response: CloneOperationsUsecaseModel) => {
        if (response.message === CODES.SUCCESS) {
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

  let content = <div></div>;
  if (qry.loading) {
    content = <div><Trans>common.loading</Trans></div>;
  } if (qry.error) {
    content = <div><Trans>createVir.{qry.error}</Trans></div>
  } else {
    content = <form
      onSubmit={handleClick}
    >
      <Grid2
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 2, md: 3 }}
      >

        {/* Field account */}
        <Grid2
          size={6}
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <AccountsSelect
            value={currentAccount}
            label={<Trans>operation.account</Trans>}
            onChange={(e: any) => {
              setCurrentAccount(e.target.value);
            }}
          />
        </Grid2>

        {/* Field template */}
        <Grid2
          size={6}
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <AccountsSelect
            value={currentTemplate}
            type={2}
            label={<Trans>clone.template</Trans>}
            onChange={(e: any) => {
              setCurrentTemplate(e.target.value);
            }}
          />
        </Grid2>

        {/* Field date */}
        <Grid2
          size={12}
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              format="DD/MM/YYYY"
              label={<Trans>operation.date</Trans>}
              value={currentDate}
              onChange={(newValue:any) => setCurrentDate(newValue)}
            />
          </LocalizationProvider>
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
            disabled={(currentAccount === '0' || currentTemplate === '0')}
            startIcon={<Send />}
          ><Trans>clone.send</Trans></Button>
        </Grid2>

      </Grid2>
    </form>
      ;
  }

  return (
    <div className="app">
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
    </div>
  )
}