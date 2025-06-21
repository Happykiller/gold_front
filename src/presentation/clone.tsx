// src\presentation\clone.tsx
import dayjs from 'dayjs';
import * as React from 'react';
import { Send } from '@mui/icons-material';
import { Trans, useTranslation } from 'react-i18next';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { createSearchParams, useNavigate } from 'react-router-dom';
import { Box, Button, Grid, Typography, useTheme } from '@mui/material';

import { CODES } from '@src/common/codes';
import inversify from '@src/common/inversify';
import { useFlashStore } from '@happykiller/sunny-ui';
import { AccountsSelect } from '@presentation/molecule/accountsSelect';
import { CloneOperationsUsecaseModel } from '@usecase/cloneOperations/cloneOperations.usecase.model';

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
  const theme = useTheme();
  const flash = useFlashStore();
  const { t } = useTranslation();
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
          border: {
            xs: 'none',
            sm: `2px solid ${theme.palette.primary.main}`,
          },
          maxWidth: 400,
          width: '100%',
          p: 3,
        }}
      >
        <Typography
          variant="h6"
          fontWeight={700}
          textAlign="center"
          mb={2}
          color="text.primary"
        >
          <Trans>clone.title</Trans>
        </Typography>

        {qry.loading ? (
          <Typography textAlign="center" color="text.secondary">
            <Trans>common.loading</Trans>
          </Typography>
        ) : qry.error ? (
          <Typography textAlign="center" color="error.main">
            <Trans>createVir.{qry.error}</Trans>
          </Typography>
        ) : (
          <form onSubmit={handleClick}>
            <Grid container spacing={2}>
              <Grid size={6}>
                <AccountsSelect
                  value={currentTemplate}
                  type={2}
                  label={<Trans>clone.template</Trans>}
                  onChange={(e: any) => setCurrentTemplate(e.target.value)}
                />
              </Grid>
              <Grid size={6}>
                <AccountsSelect
                  value={currentAccount}
                  label={<Trans>operation.account</Trans>}
                  onChange={(e: any) => setCurrentAccount(e.target.value)}
                />
              </Grid>
              <Grid size={12} textAlign="center">
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    format="DD/MM/YYYY"
                    label={<Trans>operation.date</Trans>}
                    value={currentDate}
                    onChange={(newValue: any) => setCurrentDate(newValue)}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid size={12} textAlign="center">
                <Button
                  type="submit"
                  variant="contained"
                  disabled={currentAccount === '0' || currentTemplate === '0'}
                  startIcon={<Send />}
                >
                  <Trans>clone.send</Trans>
                </Button>
              </Grid>
            </Grid>
          </form>
        )}
      </Box>
    </Box>
  );

}