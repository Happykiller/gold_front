// src\presentation\clone.tsx
import dayjs from 'dayjs';
import * as React from 'react';
import { Send } from '@mui/icons-material';
import { Trans, useTranslation } from 'react-i18next';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { createSearchParams, useNavigate } from 'react-router-dom';

import { CODES } from '@src/common/codes';
import inversify from '@src/common/inversify';
import { useFlashStore } from '@happykiller/sunny-ui';
import { AccountsSelect } from '@presentation/molecule/accountsSelect';
import { PageShell } from '@presentation/molecule/pageShell';
import {
  FormSection,
  FormRow,
  SubmitBar,
} from '@presentation/molecule/formLayout';
import { CloneOperationsUsecaseModel } from '@usecase/cloneOperations/cloneOperations.usecase.model';

export const Clone = () => {
  const navigate = useNavigate();
  const flash = useFlashStore();
  const { t } = useTranslation();

  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [currentAccount, setCurrentAccount] = React.useState('0');
  const [currentTemplate, setCurrentTemplate] = React.useState('0');
  const [currentDate, setCurrentDate] = React.useState(dayjs());

  const handleSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault();
    setSending(true);
    setError(null);

    inversify.cloneOperationsUsecase
      .execute({
        date: currentDate.format('YYYY-MM-DD'),
        account_id: parseInt(currentAccount),
        template_account_id: parseInt(currentTemplate),
      })
      .then((response: CloneOperationsUsecaseModel) => {
        if (response.message === CODES.SUCCESS) {
          flash.open(t('clone.succeed'));
          navigate({
            pathname: '/operations',
            search: createSearchParams({
              account_id: currentAccount,
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

  return (
    <PageShell title={t('clone.title')}>
      {/* Le formulaire reste affiché en cas d'échec. Il disparaissait au
          profit du message d'erreur, si bien qu'on ne pouvait pas corriger
          sa saisie — il fallait revenir sur l'écran. */}
      <form onSubmit={handleSubmit}>
        <FormSection>
          <AccountsSelect
            value={currentTemplate}
            type={2}
            showBalance
            label={<Trans>clone.template</Trans>}
            onChange={setCurrentTemplate}
          />
          <AccountsSelect
            value={currentAccount}
            label={<Trans>operation.account</Trans>}
            onChange={setCurrentAccount}
          />
          <FormRow>
            <DatePicker
              format="DD/MM/YYYY"
              label={<Trans>operation.date</Trans>}
              value={currentDate}
              onChange={(newValue) => newValue && setCurrentDate(newValue)}
              slotProps={{
                textField: { variant: 'standard', fullWidth: true },
              }}
            />
          </FormRow>
        </FormSection>

        <SubmitBar
          label={<Trans>clone.send</Trans>}
          icon={<Send />}
          // L'espace de nommage est celui de cet écran. Il pointait sur
          // `createVir`, copié tel quel, et l'absence de clé rend la clé brute
          // — donc rien ne le signalait.
          errorNamespace="clone"
          error={error}
          disabled={
            sending || currentAccount === '0' || currentTemplate === '0'
          }
        />
      </form>
    </PageShell>
  );
};
