// src\presentation\operation_edit.tsx
import * as React from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { Trans, useTranslation } from 'react-i18next';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  createSearchParams,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { TextField } from '@mui/material';

import { CODES } from '@src/common/codes';
import inversify from '@src/common/inversify';
import { useFlashStore } from '@happykiller/sunny-ui';
import { ThirdsSelect } from '@presentation/molecule/thirdsSelect';
import { AccountsSelect } from '@presentation/molecule/accountsSelect';
import { OperationUsecaseModel } from '@usecase/model/operation.usecase.model';
import { OpeCategoriesSelect } from '@presentation/molecule/opeCategoriesSelect';
import {
  OpeStatusSelect,
  OpeTypesSelect,
} from '@presentation/molecule/opeRefSelects';
import { VatField } from '@presentation/molecule/vatField';
import { PageShell } from '@presentation/molecule/pageShell';
import { AsyncState } from '@presentation/molecule/asyncState';
import {
  FormSection,
  FormRow,
  SubmitBar,
} from '@presentation/molecule/formLayout';
import { GetOperationUsecaseModel } from '@usecase/getOperation/getOperation.usecase.model';
import { CreateOperationUsecaseModel } from '@usecase/createOperation/createOperation.usecase.model';

export const EditOperation = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const flash = useFlashStore();
  const [searchParams] = useSearchParams();

  const [qry, setQry] = React.useState<{
    loading: boolean | null;
    data: any;
    error: string | null;
  }>({ loading: null, data: null, error: null });
  const [operation, setOperation] =
    React.useState<OperationUsecaseModel | null>(null);
  const [opDate, setOpDate] = React.useState<Dayjs>(dayjs());
  const [vatRateValue, setVatRateValue] = React.useState('20');

  const vatRateIsValid = /^(100(\.0+)?|[0-9]{1,2}(\.[0-9]{1,2})?)$/.test(
    vatRateValue,
  );

  const handleClick = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    setQry({ ...qry, loading: true });

    const dto = {
      ...operation,
      vat_rate: parseFloat(vatRateValue.replace(',', '.')),
      date: opDate.format('YYYY-MM-DD'),
    };

    inversify.updateOperationUsecase
      .execute(dto as OperationUsecaseModel)
      .then((response: CreateOperationUsecaseModel) => {
        if (response.message === CODES.SUCCESS) {
          flash.open(t('editOperation.succeed'));
          navigate({
            pathname: '/operations',
            search: createSearchParams({
              account_id: searchParams.get('account_id') ?? '0',
            }).toString(),
          });
        } else {
          setQry({ ...qry, error: response.message });
        }
      })
      .catch((error) => {
        setQry({ ...qry, error: error.message });
      })
      .finally(() => {
        setQry({ ...qry, loading: false });
      });
  };

  React.useEffect(() => {
    if (!operation && !qry.error) {
      setQry({ ...qry, loading: true });
      inversify.getOperationUsecase
        .execute({
          operation_id: parseInt(searchParams.get('operation_id') ?? '0'),
        })
        .then((response: GetOperationUsecaseModel) => {
          if (response.message === CODES.SUCCESS && response.data) {
            setOpDate(dayjs(parseInt(response.data.date)));
            setOperation(response.data);
            setVatRateValue(String(response.data.vat_rate ?? 20));
          } else {
            setQry({ ...qry, error: response.message });
          }
        })
        .catch((error) => {
          setQry({ ...qry, error: error.message });
        })
        .finally(() => {
          setQry({ ...qry, loading: false });
        });
    }
  }, []);

  return (
    <PageShell title={t('editOperation.title')}>
      <AsyncState
        loading={!!qry.loading}
        error={qry.error}
        namespace="editOperation"
      >
        {operation && (
          <form onSubmit={handleClick}>
            <FormSection columns={3}>
              <TextField
                label={<Trans>operation.amount</Trans>}
                variant="standard"
                fullWidth
                type="number"
                value={operation.amount}
                onChange={(e) =>
                  setOperation({
                    ...operation,
                    amount: parseFloat(e.target.value),
                  })
                }
              />
              <VatField
                value={{ value: vatRateValue, valid: vatRateIsValid }}
                onChange={(next, parsed) => {
                  setVatRateValue(next.value);
                  setOperation({ ...operation, vat_rate: parsed ?? 0 });
                }}
              />
              <DatePicker
                format="DD/MM/YYYY"
                label={<Trans>operation.date</Trans>}
                value={opDate}
                onChange={(newValue) => newValue && setOpDate(newValue)}
                slotProps={{
                  textField: { variant: 'standard', fullWidth: true },
                }}
              />
            </FormSection>

            <FormSection>
              <FormRow>
                <TextField
                  label={<Trans>operation.description</Trans>}
                  variant="standard"
                  fullWidth
                  value={operation.description}
                  onChange={(e) =>
                    setOperation({ ...operation, description: e.target.value })
                  }
                />
              </FormRow>

              <OpeTypesSelect
                value={operation.type_id}
                label={<Trans>operation.type</Trans>}
                onChange={(e) =>
                  setOperation({
                    ...operation,
                    type_id: Number(e.target.value),
                  })
                }
              />
              <AccountsSelect
                value={operation.account_id}
                label={<Trans>operation.account</Trans>}
                onChange={(e) =>
                  setOperation({
                    ...operation,
                    account_id: Number(e.target.value),
                  })
                }
              />
              {operation.type_id === 3 && (
                <AccountsSelect
                  value={operation.account_id_dest ?? ''}
                  label={<Trans>operation.account_dest</Trans>}
                  onChange={(e) =>
                    setOperation({
                      ...operation,
                      account_id_dest: Number(e.target.value),
                    })
                  }
                />
              )}
              <OpeStatusSelect
                value={operation.status_id}
                label={<Trans>operation.status</Trans>}
                onChange={(e) =>
                  setOperation({
                    ...operation,
                    status_id: Number(e.target.value),
                  })
                }
              />
              <ThirdsSelect
                value={operation.third_id ?? ''}
                label={<Trans>operation.third</Trans>}
                onChange={(e) =>
                  setOperation({
                    ...operation,
                    third_id: Number(e.target.value),
                  })
                }
              />
              <OpeCategoriesSelect
                value={operation.category_id ?? ''}
                label={<Trans>operation.category</Trans>}
                onChange={(e) =>
                  setOperation({
                    ...operation,
                    category_id: Number(e.target.value),
                  })
                }
              />
            </FormSection>

            <SubmitBar
              label={<Trans>editOperation.send</Trans>}
              icon={<SaveAltIcon />}
              disabled={
                operation.amount <= 0 ||
                !operation.description ||
                !vatRateIsValid ||
                vatRateValue === '' ||
                operation.account_id === operation.account_id_dest
              }
            />
          </form>
        )}
      </AsyncState>
    </PageShell>
  );
};
