// src\presentation\operation_new.tsx
import * as React from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { Trans, useTranslation } from 'react-i18next';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import InfoIcon from '@mui/icons-material/Info';
import EuroIcon from '@mui/icons-material/Euro';
import DescriptionIcon from '@mui/icons-material/Description';
import { DatePicker } from '@mui/x-date-pickers';
import {
  createSearchParams,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import { CODES } from '@src/common/codes';
import inversify from '@src/common/inversify';
import { ThirdsSelect } from '@presentation/molecule/thirdsSelect';
import { AccountsSelect } from '@presentation/molecule/accountsSelect';
import { OpeCategoriesSelect } from '@presentation/molecule/opeCategoriesSelect';
import {
  OpeStatusSelect,
  OpeTypesSelect,
} from '@presentation/molecule/opeRefSelects';
import { VatField } from '@presentation/molecule/vatField';
import { PageShell } from '@presentation/molecule/pageShell';
import {
  FormSection,
  FormRow,
  SubmitBar,
} from '@presentation/molecule/formLayout';
import { CreateOperationUsecaseModel } from '@usecase/createOperation/createOperation.usecase.model';
import { Input, useFlashStore } from '@happykiller/sunny-ui';
import { CreateOperationUsecaseDto } from '@src/usecase/createOperation/createOperation.usecase.dto';

export const OperationNew = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const flash = useFlashStore();
  const [searchParams] = useSearchParams();

  const [qry, setQry] = React.useState<{
    loading: boolean | null;
    data: any;
    error: string | null;
  }>({ loading: null, data: null, error: null });

  const [opDate, setOpDate] = React.useState<Dayjs>(dayjs());
  const [desc, setDesc] = React.useState({ value: '', valid: false });
  const [amount, setAmount] = React.useState({ value: '', valid: false });
  const [vatRate, setVatRate] = React.useState({ value: '20', valid: true });

  const [operation, setOperation] = React.useState<CreateOperationUsecaseDto>({
    account_id: parseInt(searchParams.get('account_id') ?? '0'),
    amount: 0,
    vat_rate: 20,
    date: dayjs().format('YYYY-MM-DD'),
    status_id: 1,
    type_id: 2,
    third_id: 2,
    category_id: 1,
    description: '',
  });

  const handleClick = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    setQry({ ...qry, loading: true });

    const dto = {
      ...operation,
      amount: parseFloat(amount.value),
      vat_rate: parseFloat(vatRate.value.replace(',', '.')),
      description: desc.value,
      date: opDate.format('YYYY-MM-DD'),
    };

    inversify.createOperationUsecase
      .execute(dto)
      .then((response: CreateOperationUsecaseModel) => {
        if (response.message === CODES.SUCCESS) {
          flash.open(t('operation_new.succeed'));
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

  return (
    <PageShell title={t('operation_create.title')}>
      <form onSubmit={handleClick}>
        <FormSection columns={3}>
          <Input
            label={<Trans>operation.amount</Trans>}
            tooltip={t('operation.amount-hint')}
            regex="^[0-9]+([.,][0-9]{1,2})?$"
            require
            virgin
            entity={amount}
            onChange={setAmount}
            startIcon={<EuroIcon fontSize="small" />}
            icons={{ help: <InfoIcon fontSize="small" /> }}
          />
          <VatField
            value={vatRate}
            onChange={(next, parsed) => {
              setVatRate(next);
              setOperation({ ...operation, vat_rate: parsed });
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
            <Input
              label={<Trans>operation.description</Trans>}
              tooltip={t('operation.description-hint')}
              regex="^.{3,}$"
              require
              virgin
              entity={desc}
              onChange={setDesc}
              startIcon={<DescriptionIcon fontSize="small" />}
              icons={{ help: <InfoIcon fontSize="small" /> }}
            />
          </FormRow>

          <OpeTypesSelect
            value={operation.type_id}
            label={<Trans>operation.type</Trans>}
            onChange={(value) =>
              setOperation({ ...operation, type_id: Number(value) })
            }
          />
          <AccountsSelect
            value={operation.account_id}
            type={0}
            label={<Trans>operation.account</Trans>}
            onChange={(value) =>
              setOperation({ ...operation, account_id: Number(value) })
            }
          />
          {operation.type_id === 3 && (
            <AccountsSelect
              value={operation.account_id_dest ?? ''}
              label={<Trans>operation.account_dest</Trans>}
              onChange={(value) =>
                setOperation({
                  ...operation,
                  account_id_dest: Number(value),
                })
              }
            />
          )}
          <OpeStatusSelect
            value={operation.status_id}
            label={<Trans>operation.status</Trans>}
            onChange={(value) =>
              setOperation({ ...operation, status_id: Number(value) })
            }
          />
          <ThirdsSelect
            value={operation.third_id}
            label={<Trans>operation.third</Trans>}
            onChange={(value) =>
              setOperation({ ...operation, third_id: Number(value) })
            }
          />
          <OpeCategoriesSelect
            value={operation.category_id}
            label={<Trans>operation.category</Trans>}
            onChange={(value) =>
              setOperation({
                ...operation,
                category_id: Number(value),
              })
            }
          />
        </FormSection>

        <SubmitBar
          label={<Trans>operation_create.send</Trans>}
          icon={<SaveAltIcon fontSize="small" />}
          errorNamespace="operation_create"
          error={qry.error}
          disabled={
            !!qry.loading ||
            !amount.valid ||
            !desc.valid ||
            !vatRate.valid ||
            vatRate.value === '' ||
            operation.account_id === operation.account_id_dest
          }
        />
      </form>
    </PageShell>
  );
};
