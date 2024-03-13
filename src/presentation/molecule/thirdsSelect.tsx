import * as React from 'react';
import { Trans } from 'react-i18next';
import { FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";

import { CODES } from '@src/common/codes';
import inversify from '@src/common/inversify';
import { GetThirdsUsecaseModel } from '@usecase/getThirds/getThirds.usecase.model';
import { OperationThridUsecaseModel } from '@usecase/model/operationThrid.usecase.model';

export const ThirdsSelect = (props:any) => {
  const [thirds, setThirds] = React.useState<OperationThridUsecaseModel[]>(null);
  const [qry, setQry] = React.useState({
    loading: null,
    data: null,
    error: null
  });

  let content = <div></div>;

  if(qry.loading) {
    content = <div><Trans>common.loading</Trans></div>;
  } else if(qry.error) {
    content = <div><Trans>common.{qry.error}</Trans></div>
  } else if (thirds === null) {
    setQry(qry => ({
      ...qry,
      loading: true
    }));
    inversify.getThirdsUsecase.execute()
      .then((response:GetThirdsUsecaseModel) => {
        if(response.message === CODES.SUCCESS) {
          setThirds(response.data);
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
          <MenuItem value=''><Trans>common.clear</Trans></MenuItem>
          {
            thirds.map((third) => {
              return <MenuItem 
                  key={third.id} 
                  value={third.id}
                  sx={{
                    width: '300px'
                  }}
                ><Typography noWrap><Trans>{third.label}</Trans></Typography></MenuItem>;
            })
          }
        </Select>
      </FormControl>
    )
  }

  return content;
}