// src\presentation\molecule\opeCategoriesSelect.tsx
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
import { OperationCategoryUsecaseModel } from '@usecase/model/operationCategory.usecase.model';
import { GetOpeCategoriesUsecaseModel } from '@usecase/getOpeCategories/getOpeCategories.usecase.model';

type OpeCategoriesSelectProps = {
  value: string | number;
  label: React.ReactNode;
  onChange: (event: SelectChangeEvent) => void;
};

export const OpeCategoriesSelect: React.FC<OpeCategoriesSelectProps> = ({
  value,
  label,
  onChange,
}) => {
  const [categories, setCategories] = React.useState<
    OperationCategoryUsecaseModel[] | null
  >(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      setLoading(true);
      setError(null);

      try {
        const response: GetOpeCategoriesUsecaseModel =
          await inversify.getOpeCategoriesUsecase.execute();

        if (isMounted) {
          if (response.message === CODES.SUCCESS && response.data) {
            setCategories(response.data);
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

    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <Typography>
        <Trans>common.loading</Trans>
      </Typography>
    );
  }

  if (error) {
    return (
      <Typography color="error">
        <Trans>common.{error}</Trans>
      </Typography>
    );
  }

  if (!categories) return null;

  return (
    <FormControl variant="standard" fullWidth sx={{ m: 1 }}>
      <InputLabel>{label}</InputLabel>
      <Select
        variant="standard"
        size="small"
        value={value.toString()}
        onChange={onChange}
      >
        <MenuItem value="">
          <Trans>common.clear</Trans>
        </MenuItem>
        {categories.map((category) => (
          <MenuItem key={category.id} value={category.id}>
            <Typography noWrap>
              <Trans>{category.label}</Trans>
            </Typography>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
