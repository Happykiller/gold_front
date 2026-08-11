// src\presentation\operation_edit.tsx
import * as React from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { Trans, useTranslation } from 'react-i18next';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  createSearchParams,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { Box, TextField } from '@mui/material';

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
import {
  GetOperationUsecaseModel,
  LinkedOperationUsecaseModel,
} from '@usecase/getOperation/getOperation.usecase.model';
import { CreateOperationUsecaseModel } from '@usecase/createOperation/createOperation.usecase.model';
import { RowAction } from '@presentation/molecule/rowAction';
import { LinkableOperations } from '@presentation/molecule/linkableOperations';
import {
  Operation,
  TYPE_TRANSFER,
} from '@presentation/hooks/useAccountOperations';
import {
  formatEuroAmount,
  formatOperationDate,
} from '@presentation/molecule/operationDisplay';

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

  // Les liens sont tenus à part de `operation` : ils ne se saisissent pas, et
  // le retrait doit pouvoir retirer une puce sans repasser par le formulaire.
  const [links, setLinks] = React.useState<{
    down: LinkedOperationUsecaseModel[];
    up: LinkedOperationUsecaseModel[];
  }>({ down: [], up: [] });

  const linkedLabel = (linked: LinkedOperationUsecaseModel) =>
    `${formatOperationDate(linked.date)} · ${formatEuroAmount(linked.amount)}${
      linked.description ? ` · ${linked.description}` : ''
    }`;

  // Le compte de destination porte les dépenses que ce virement couvre.
  const destAccountId = operation?.account_id_dest ?? null;

  // Ce qui est déjà lié ne se propose plus : le serveur accepterait le doublon
  // — il en existe un en base depuis 2019, qui fait afficher « prend en charge
  // 2 opérations » là où il n'y en a qu'une.
  const linkedIds = links.down.map((linked) => linked.id);

  const handleLink = (picked: Operation) => {
    if (!operation) return;

    inversify.createOperationLinkUsecase
      .execute({
        // Le sens compte : le virement édité PORTE la dépense choisie.
        // L'inverser ferait apparaître le lien du mauvais côté.
        operation_id: operation.id,
        operation_ref_id: picked.id,
      })
      .then((response) => {
        // La puce n'apparaît qu'APRÈS confirmation du serveur, comme au
        // retrait : c'est le seul endroit où un refus serait visible.
        if (response.message === CODES.SUCCESS && response.data) {
          // Reconstruit la puce sans relire le serveur. Pas de `as` : c'est
          // tsc qui vérifie que l'opération choisie porte bien tout ce qu'une
          // opération liée déclare — le jour où la requête `operation`
          // demandera un champ de plus, la compilation le dira ici.
          const linked: LinkedOperationUsecaseModel = {
            ...picked,
            link_id: response.data.id,
          };
          setLinks((current) => ({
            ...current,
            down: [...current.down, linked],
          }));
          flash.open(t('editOperation.link-added'));
        } else {
          flash.open(t('editOperation.link-add-failed'));
        }
      })
      .catch(() => flash.open(t('editOperation.link-add-failed')));
  };

  const handleUnlink = (operationLinkId: number) => {
    inversify.deleteOperationLinkUsecase
      .execute({ operation_link_id: operationLinkId })
      .then((response) => {
        // La puce ne disparaît qu'APRÈS confirmation du serveur : il peut
        // refuser, et c'est le seul endroit où ce refus serait visible.
        if (response.message === CODES.SUCCESS && response.data) {
          setLinks((current) => ({
            ...current,
            down: current.down.filter((elt) => elt.link_id !== operationLinkId),
          }));
          flash.open(t('editOperation.link-removed'));
        } else {
          flash.open(t('editOperation.link-remove-failed'));
        }
      })
      .catch(() => flash.open(t('editOperation.link-remove-failed')));
  };

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
            setOperation(response.data as unknown as OperationUsecaseModel);
            setVatRateValue(String(response.data.vat_rate ?? 20));
            setLinks({
              down: response.data.linked_operations ?? [],
              up: response.data.linked_by_operations ?? [],
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
                onChange={(event) =>
                  setOperation({
                    ...operation,
                    amount: parseFloat(event.target.value),
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
                  onChange={(event) =>
                    setOperation({
                      ...operation,
                      description: event.target.value,
                    })
                  }
                />
              </FormRow>

              <OpeTypesSelect
                value={operation.type_id}
                label={<Trans>operation.type</Trans>}
                onChange={(value) =>
                  setOperation({
                    ...operation,
                    type_id: Number(value),
                  })
                }
              />
              <AccountsSelect
                value={operation.account_id}
                label={<Trans>operation.account</Trans>}
                onChange={(value) =>
                  setOperation({
                    ...operation,
                    account_id: Number(value),
                  })
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
                  setOperation({
                    ...operation,
                    status_id: Number(value),
                  })
                }
              />
              <ThirdsSelect
                value={operation.third_id ?? ''}
                label={<Trans>operation.third</Trans>}
                onChange={(value) =>
                  setOperation({
                    ...operation,
                    third_id: Number(value),
                  })
                }
              />
              <OpeCategoriesSelect
                value={operation.category_id ?? ''}
                label={<Trans>operation.category</Trans>}
                onChange={(value) =>
                  setOperation({
                    ...operation,
                    category_id: Number(value),
                  })
                }
              />
            </FormSection>

            {/* Les opérations que ce virement prend en charge. La section vit
                hors du flux des champs, entre le formulaire et son bouton
                d'envoi.

                Elle s'affiche désormais même sans aucun lien : la masquer
                quand la liste était vide ne laissait aucun endroit d'où en
                ajouter un, et c'est précisément le cas d'un virement qu'on
                vient de créer sans rattachement.

                Rattacher et retirer prennent effet IMMÉDIATEMENT, sans passer
                par « Mettre à jour » — comme le retrait le faisait déjà. Ces
                gestes visent le lien, pas l'opération : les différer
                obligerait à réconcilier deux états à l'envoi. */}
            {operation.type_id === TYPE_TRANSFER && (
              <FormSection title={t('editOperation.linked-title')} columns={1}>
                <FormRow>
                  <LinkableOperations
                    label={<Trans>editOperation.link-add</Trans>}
                    accountId={destAccountId}
                    excludeIds={linkedIds}
                    onPick={handleLink}
                  />
                </FormRow>

                {links.down.length > 0 && (
                  <FormRow>
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                        mt: '8px',
                      }}
                    >
                      {links.down.map((linked) => (
                        <RowAction
                          key={linked.link_id}
                          label={t('editOperation.link-remove')}
                          icon={<LinkOffIcon />}
                          text={linkedLabel(linked)}
                          onClick={() => handleUnlink(linked.link_id)}
                        />
                      ))}
                    </Box>
                  </FormRow>
                )}
              </FormSection>
            )}

            {/* Les virements qui prennent cette opération en charge. Plusieurs
                sont possibles : en base, plus de cent dépenses sont couvertes
                par deux virements ou plus. Lecture seule — le retrait se fait
                depuis le virement porteur, où le geste a un sens. */}
            {links.up.length > 0 && (
              <FormSection
                title={t('editOperation.linked-by-title')}
                columns={1}
              >
                <FormRow>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {links.up.map((carrier) => (
                      <RowAction
                        key={carrier.link_id}
                        label={t('editOperation.open-carrier')}
                        icon={<OpenInNewIcon />}
                        text={linkedLabel(carrier)}
                        onClick={() =>
                          navigate({
                            pathname: '/operation_edit',
                            search: createSearchParams({
                              account_id: String(carrier.account_id),
                              operation_id: String(carrier.id),
                            }).toString(),
                          })
                        }
                      />
                    ))}
                  </Box>
                </FormRow>
              </FormSection>
            )}

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
