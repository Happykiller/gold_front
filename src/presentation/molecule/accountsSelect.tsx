import * as React from 'react';
import { Trans } from 'react-i18next';
import { FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";

import { CODES } from '@src/common/codes';
import inversify from '@src/common/inversify';
import { AccountUsecaseModel } from '@usecase/model/account.usecase.model';
import { GetAccountsUsecaseModel } from '@usecase/getAccounts/getAccounts.usecase.model';

export const AccountsSelect = (props:any) => {
  const [accounts, setAccounts] = React.useState<AccountUsecaseModel[]>(null);
  const [qry, setQry] = React.useState({
    loading: null,
    data: null,
    error: null
  });

  let content = <div></div>;

  if(qry.loading) {
    content = <div><Trans>common.loading</Trans></div>;
  } else if(qry.error) {
    content = <div><Trans>createVir.{qry.error}</Trans></div>
  } else if (accounts === null) {
    setQry(qry => ({
      ...qry,
      loading: true
    }));
    inversify.getAccountsUsecase.execute()
      .then((response:GetAccountsUsecaseModel) => {
        if(response.message === CODES.SUCCESS) {
          setAccounts(response.data);
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
  } else {
    content = (
      <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
        <InputLabel>{props.label}</InputLabel>
        <Select
          variant="standard"
          size="small"
          value={props.value}
          onChange={(e) => { 
            e.preventDefault();
            props.onChange(e);
          }}
        >
          <MenuItem value="">Aucun</MenuItem>
          {
            accounts.map((account) => {
              if (account.type_id === 1) {
                return <MenuItem 
                  key={account.id} 
                  value={account.id}
                  sx={{
                    width: '300px'
                  }}
                ><Typography noWrap>{account.label}</Typography></MenuItem>;
              }
            })
          }
        </Select>
      </FormControl>
    )
  }

  return content;
}