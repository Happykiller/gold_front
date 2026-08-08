// src\presentation\createVir.tsx
import dayjs from 'dayjs';
import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Delete, Info, Send } from '@mui/icons-material';
import { createSearchParams, useNavigate } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers';
import { Box, Typography } from '@mui/material';
import EuroIcon from '@mui/icons-material/Euro';
import DescriptionIcon from '@mui/icons-material/Description';

import { CODES } from '@src/common/codes';
import inversify from '@src/common/inversify';
import { useFlashStore, Input } from '@happykiller/sunny-ui';
import { ThirdsSelect } from '@presentation/molecule/thirdsSelect';
import { AccountsSelect } from '@presentation/molecule/accountsSelect';
import { OpeStatusSelect } from '@presentation/molecule/opeRefSelects';
import { OpeCategoriesSelect } from '@presentation/molecule/opeCategoriesSelect';
import { PageShell } from '@presentation/molecule/pageShell';
import {
  FormSection,
  FormRow,
  SubmitBar,
} from '@presentation/molecule/formLayout';
import { RowAction } from '@presentation/molecule/rowAction';
import { OperationPicker } from '@presentation/molecule/operationPicker';
import { formatEuroAmount } from '@presentation/molecule/operationDisplay';
import { TEXT } from '@src/theme/tokens';
import {
  Operation,
  OPERATIONS_PAGE_SIZE,
} from '@presentation/hooks/useAccountOperations';
import { GetOperationsUsecaseModel } from '@usecase/getOperations/getOperations.usecase.model';
import { CreateOperationUsecaseModel } from '@usecase/createOperation/createOperation.usecase.model';

export const CreateVir = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const flash = useFlashStore();

  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [operations, setOperations] = React.useState<Operation[] | null>(null);
  const [selectedOperations, setSelectedOperations] = React.useState<
    Operation[]
  >([]);
  const [currentThird, setCurrentThird] = React.useState('2');
  const [currentCategory, setCurrentCategory] = React.useState('1');
  const [currentAccount, setCurrentAccount] = React.useState('2');
  const [currentAccountDest, setCurrentAccountDest] = React.useState('2');
  const [currentStatus, setCurrentStatus] = React.useState('2');
  const [currentDate, setCurrentDate] = React.useState(dayjs());
  const [amount, setAmount] = React.useState({ value: '0.00', valid: false });
  const [desc, setDesc] = React.useState({ value: '', valid: false });

  const sum =
    Math.round(
      selectedOperations.reduce((n, { amount }) => n + amount, 0) * 100,
    ) / 100;

  const handleSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault();
    setSending(true);
    setError(null);

    inversify.createOperationUsecase
      .execute({
        amount: parseFloat(amount.value.replace(',', '.')),
        vat_rate: 20,
        description: desc.value,
        date: currentDate.format('YYYY-MM-DD'),
        account_id: parseInt(currentAccount),
        status_id: parseInt(currentStatus),
        type_id: 3,
        third_id: parseInt(currentThird),
        category_id: parseInt(currentCategory),
        account_id_dest: parseInt(currentAccountDest),
        linkedOps: selectedOperations.map((ope) => ope.id),
      })
      .then((response: CreateOperationUsecaseModel) => {
        if (response.message === CODES.SUCCESS && response.data) {
          flash.open(t('createVir.succeed') + response.data.id);
          navigate({
            pathname: '/operations',
            search: createSearchParams({
              account_id: currentAccountDest,
            }).toString(),
          });
        } else {
          inversify.loggerService.debug(response.error);
          setError(response.message);
        }
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setSending(false));
  };

  // Les opérations du compte de destination, proposées à la liaison. Rechargées
  // dès que ce compte change.
  React.useEffect(() => {
    if (operations !== null) return;

    inversify.getOperationsUsecase
      .execute({
        account_id: parseInt(currentAccountDest),
        limit: OPERATIONS_PAGE_SIZE,
        offset: 0,
      })
      .then((response: GetOperationsUsecaseModel) => {
        if (response.message === CODES.SUCCESS && response.data)
          setOperations(response.data);
        else inversify.loggerService.debug(response.error);
      })
      .catch((err: Error) => inversify.loggerService.debug(err.message));
  }, [currentAccountDest, operations]);

  const linkable = (operations ?? []).filter(
    (operation) =>
      operation.type_id === 2 &&
      !selectedOperations.some((selected) => selected.id === operation.id),
  );

  return (
    <PageShell title={t('createVir.title')}>
      <form onSubmit={handleSubmit}>
        <FormSection>
          <Input
            label={<Trans>operation.amount</Trans>}
            tooltip={t('operation.amount-hint')}
            regex="^[0-9]+([.,][0-9]{1,2})?$"
            require
            virgin
            entity={amount}
            onChange={setAmount}
            startIcon={<EuroIcon fontSize="small" />}
            icons={{ help: <Info fontSize="small" /> }}
          />
          <DatePicker
            format="DD/MM/YYYY"
            label={<Trans>operation.date</Trans>}
            value={currentDate}
            onChange={(newValue) => newValue && setCurrentDate(newValue)}
            slotProps={{
              textField: { variant: 'standard', fullWidth: true },
            }}
          />
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
              icons={{ help: <Info fontSize="small" /> }}
            />
          </FormRow>

          <AccountsSelect
            value={currentAccount}
            label={<Trans>operation.account</Trans>}
            onChange={setCurrentAccount}
          />
          <AccountsSelect
            value={currentAccountDest}
            label={<Trans>operation.account_dest</Trans>}
            onChange={(value) => {
              setCurrentAccountDest(value);
              setOperations(null);
              setSelectedOperations([]);
            }}
          />
          <OpeStatusSelect
            value={currentStatus}
            label={<Trans>operation.status</Trans>}
            onChange={setCurrentStatus}
          />
          <ThirdsSelect
            value={currentThird}
            label={<Trans>operation.third</Trans>}
            onChange={setCurrentThird}
          />
          <OpeCategoriesSelect
            value={currentCategory}
            label={<Trans>operation.category</Trans>}
            onChange={setCurrentCategory}
          />
        </FormSection>

        <FormSection title={t('createVir.operations')} columns={1}>
          <FormRow>
            <OperationPicker
              label={<Trans>createVir.operations</Trans>}
              operations={linkable}
              currentAccountId={parseInt(currentAccountDest)}
              onPick={(operation) =>
                setSelectedOperations((prev) => [...prev, operation])
              }
            />
          </FormRow>

          {selectedOperations.length > 0 && (
            <FormRow>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '6px',
                  mt: '8px',
                }}
              >
                {selectedOperations.map((operation) => (
                  <RowAction
                    key={operation.id}
                    // Le bouton portait une icône de suppression et **aucun
                    // gestionnaire** : il ne faisait rien. Il retire maintenant
                    // l'opération de la liaison.
                    label={`${t('operation.action-delete')} — ${operation.description}`}
                    icon={<Delete />}
                    text={`${formatEuroAmount(operation.amount)} ${operation.description}`}
                    onClick={() =>
                      setSelectedOperations((prev) =>
                        prev.filter((selected) => selected.id !== operation.id),
                      )
                    }
                  />
                ))}
                <Typography
                  sx={{ ml: 'auto', fontSize: 12.5, color: TEXT.label }}
                >
                  {formatEuroAmount(sum)}
                </Typography>
              </Box>
            </FormRow>
          )}
        </FormSection>

        <SubmitBar
          label={<Trans>createVir.send</Trans>}
          icon={<Send fontSize="small" />}
          errorNamespace="createVir"
          error={error}
          disabled={
            sending ||
            !amount.valid ||
            !desc.valid ||
            currentAccount === currentAccountDest
          }
        />
      </form>
    </PageShell>
  );
};
