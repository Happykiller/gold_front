// src\presentation\molecule\accountsSelect.tsx
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
import { AccountUsecaseModel } from '@usecase/model/account.usecase.model';
import { GetAccountsUsecaseModel } from '@usecase/getAccounts/getAccounts.usecase.model';

type AccountsSelectProps = {
  value: string | number;
  label: React.ReactNode;
  onChange: (event: SelectChangeEvent) => void;
  type?: number; // 0 (all), 1 (default), 2 (template), etc.
};

export const AccountsSelect: React.FC<AccountsSelectProps> = ({
  value,
  label,
  onChange,
  type = 0,
}) => {
  const [accounts, setAccounts] = React.useState<AccountUsecaseModel[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (accounts !== null) return;

    setLoading(true);
    inversify.getAccountsUsecase
      .execute()
      .then((response: GetAccountsUsecaseModel) => {
        if (response.message === CODES.SUCCESS && response.data) {
          setAccounts(response.data);
        } else {
          inversify.loggerService.debug(response.error);
          setError(response.message);
        }
      })
      .catch((err: any) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [accounts]);

  if (loading) {
    return <Typography><Trans>common.loading</Trans></Typography>;
  }

  if (error) {
    return <Typography color="error"><Trans>common.{error}</Trans></Typography>;
  }

  return (
    <FormControl variant="standard" fullWidth sx={{ m: 1 }}>
      <InputLabel>{label}</InputLabel>
      <Select
        variant="standard"
        size="small"
        displayEmpty
        value={value.toString()}
        onChange={onChange}
      >
        <MenuItem value={0}><Trans>common.clear</Trans></MenuItem>
        {accounts?.map((account) =>
          (type === 0 || account.type_id === type) && (
            <MenuItem key={account.id} value={account.id}>
              <Typography noWrap>{account.label}</Typography>
            </MenuItem>
          )
        )}
      </Select>
    </FormControl>
  );
};
