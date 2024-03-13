import * as React from 'react';
import { Trans } from 'react-i18next';
import { FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";

import { CODES } from '@src/common/codes';
import inversify from '@src/common/inversify';
import { OperationCategoryUsecaseModel } from '@usecase/model/operationCategory.usecase.model';
import { GetOpeCategoriesUsecaseModel } from '@usecase/getOpeCategories/getOpeCategories.usecase.model';

export const OpeCategoriesSelect = (props:any) => {
  const [categories, setCategories] = React.useState<OperationCategoryUsecaseModel[]>(null);
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
  } else if (categories === null) {
    setQry(qry => ({
      ...qry,
      loading: true
    }));
    inversify.getThirdsUsecase.execute()
      .then((response:GetOpeCategoriesUsecaseModel) => {
        if(response.message === CODES.SUCCESS) {
          setCategories(response.data);
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
            categories.map((category) => {
              return <MenuItem 
                  key={category.id} 
                  value={category.id}
                  sx={{
                    width: '300px'
                  }}
                ><Typography noWrap><Trans>{category.label}</Trans></Typography></MenuItem>;
            })
          }
        </Select>
      </FormControl>
    )
  }

  return content;
}