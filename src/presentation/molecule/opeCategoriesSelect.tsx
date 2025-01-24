import * as React from 'react';
import { Trans } from 'react-i18next';
import { FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";

import { CODES } from '@src/common/codes';
import inversify from '@src/common/inversify';
import { OperationCategoryUsecaseModel } from '@usecase/model/operationCategory.usecase.model';
import { GetOpeCategoriesUsecaseModel } from '@usecase/getOpeCategories/getOpeCategories.usecase.model';

export const OpeCategoriesSelect = (props: any) => {
  const [categories, setCategories] = React.useState<OperationCategoryUsecaseModel[] | null>(null);
  const [qry, setQry] = React.useState({
    loading: false,
    error: null as string | null,
  });

  // Effect to load categories on mount
  React.useEffect(() => {
    let isMounted = true; // To prevent state updates if the component unmounts

    const fetchCategories = async () => {
      try {
        setQry({ loading: true, error: null });
        const response: GetOpeCategoriesUsecaseModel = await inversify.getOpeCategoriesUsecase.execute();

        if (isMounted) {
          if (response.message === CODES.SUCCESS && response.data) {
            setCategories(response.data);
          } else {
            inversify.loggerService.debug(response.error);
            setQry({ loading: false, error: response.message });
          }
        }
      } catch (error: any) {
        if (isMounted) {
          setQry({ loading: false, error: error.message });
        }
      } finally {
        if (isMounted) {
          setQry((prevQry) => ({ ...prevQry, loading: false }));
        }
      }
    };

    fetchCategories();

    return () => {
      isMounted = false; // Cleanup to avoid memory leaks
    };
  }, []); // Empty dependency array ensures this runs only once after mounting

  // Render logic
  if (qry.loading) {
    return <div><Trans>common.loading</Trans></div>;
  }

  if (qry.error) {
    return <div><Trans>common.{qry.error}</Trans></div>;
  }

  if (!categories) {
    return <div></div>; // Empty state while waiting for data
  }

  return (
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
        <MenuItem value=""><Trans>common.clear</Trans></MenuItem>
        {categories.map((category) => (
          <MenuItem
            key={category.id}
            value={category.id}
            sx={{ width: '300px' }}
          >
            <Typography noWrap><Trans>{category.label}</Trans></Typography>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
