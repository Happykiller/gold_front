// src\presentation\molecule\thirdsSelect.tsx
import * as React from 'react';
import { Trans } from 'react-i18next';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  SelectChangeEvent,
} from '@mui/material';

import { CODES } from '@src/common/codes';
import inversify from '@src/common/inversify';
import { GetThirdsUsecaseModel } from '@usecase/getThirds/getThirds.usecase.model';
import { OperationThridUsecaseModel } from '@usecase/model/operationThrid.usecase.model';

type ThirdsSelectProps = {
  value: string | number;
  label: React.ReactNode;
  onChange: (event: SelectChangeEvent) => void;
};

export const ThirdsSelect: React.FC<ThirdsSelectProps> = ({
  value,
  label,
  onChange,
}) => {
  const [thirds, setThirds] = React.useState<OperationThridUsecaseModel[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    const fetchThirds = async () => {
      setLoading(true);
      setError(null);

      try {
        const response: GetThirdsUsecaseModel = await inversify.getThirdsUsecase.execute();
        if (isMounted) {
          if (response.message === CODES.SUCCESS && response.data) {
            setThirds(response.data);
          } else {
            inversify.loggerService.debug(response.error);
            setError(response.message);
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchThirds();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <Typography><Trans>common.loading</Trans></Typography>;
  }

  if (error) {
    return <Typography color="error"><Trans>common.{error}</Trans></Typography>;
  }

  if (!thirds) return null;

  return (
    <FormControl variant="standard" fullWidth sx={{ m: 1 }}>
      <InputLabel>{label}</InputLabel>
      <Select
        variant="standard"
        size="small"
        value={value.toString()}
        onChange={onChange}
      >
        <MenuItem value=""><Trans>common.clear</Trans></MenuItem>
        {thirds.map((third) => (
          <MenuItem key={third.id} value={third.id}>
            <Typography noWrap><Trans>{third.label}</Trans></Typography>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
