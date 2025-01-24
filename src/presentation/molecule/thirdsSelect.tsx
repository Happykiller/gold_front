import * as React from 'react';
import { Trans } from 'react-i18next';
import { FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";

import { CODES } from '@src/common/codes';
import inversify from '@src/common/inversify';
import { GetThirdsUsecaseModel } from '@usecase/getThirds/getThirds.usecase.model';
import { OperationThridUsecaseModel } from '@usecase/model/operationThrid.usecase.model';

export const ThirdsSelect = (props: any) => {
  const [thirds, setThirds] = React.useState<OperationThridUsecaseModel[] | null>(null);
  const [qry, setQry] = React.useState({
    loading: false,
    error: null as string | null,
  });

  // Effect to load thirds on mount
  React.useEffect(() => {
    let isMounted = true; // To prevent state updates on unmounted component

    const fetchThirds = async () => {
      try {
        setQry({ loading: true, error: null });
        const response: GetThirdsUsecaseModel = await inversify.getThirdsUsecase.execute();

        if (isMounted) {
          if (response.message === CODES.SUCCESS && response.data) {
            setThirds(response.data);
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
          setQry((qry) => ({ ...qry, loading: false }));
        }
      }
    };

    fetchThirds();

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

  if (!thirds) {
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
        {thirds.map((third) => (
          <MenuItem
            key={third.id}
            value={third.id}
            sx={{ width: '300px' }}
          >
            <Typography noWrap><Trans>{third.label}</Trans></Typography>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
