// src/presentation/molecule/linkableOperations.tsx
import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Box, Checkbox, FormControlLabel } from '@mui/material';

import { CODES } from '@src/common/codes';
import inversify from '@src/common/inversify';
import { TEXT } from '@src/theme/tokens';
import { OperationPicker } from '@presentation/molecule/operationPicker';
import {
  STATUS_RECONCILED,
  TYPE_DEBIT,
} from '@presentation/hooks/referentialIds';
import {
  Operation,
  OPERATIONS_PAGE_SIZE,
} from '@presentation/hooks/useAccountOperations';
import { GetOperationsUsecaseModel } from '@usecase/getOperations/getOperations.usecase.model';

type Props = {
  label: React.ReactNode;
  /** Le compte de destination du virement : c'est lui qui porte les dépenses. */
  accountId: number | null;
  /** Déjà liées, ou déjà choisies dans le formulaire en cours. */
  excludeIds: number[];
  onPick: (operation: Operation) => void;
};

/**
 * Les opérations qu'un virement peut prendre en charge, et leur sélecteur.
 *
 * Partagé par la création et l'édition d'un virement : les deux écrans posent
 * exactement la même question au serveur, et divergeaient déjà — le
 * rechargement au changement de compte n'était correct que d'un côté.
 *
 * **Le filtre par défaut n'est pas neutre.** On ne propose que des débits
 * **pointés**, c'est-à-dire des dépenses déjà validées par la banque : c'est le
 * cas courant, et le seul dans lequel le montant ne bougera plus. Mais il
 * empêchait de rattacher une dépense encore en attente, ce qui est légitime —
 * d'où la case qui lève la contrainte de pointage, sans toucher au type.
 */
export const LinkableOperations: React.FC<Props> = ({
  label,
  accountId,
  excludeIds,
  onPick,
}) => {
  const { t } = useTranslation();
  const [includeUnreconciled, setIncludeUnreconciled] = React.useState(false);
  const [operations, setOperations] = React.useState<Operation[] | null>(null);

  React.useEffect(() => {
    if (accountId === null) return;

    // Remis à null d'abord : sans cela le sélecteur continue de proposer le lot
    // du compte précédent — ou l'ancien filtre — le temps de la requête.
    setOperations(null);

    let cancelled = false;
    inversify.getOperationsUsecase
      .execute({
        account_id: accountId,
        limit: OPERATIONS_PAGE_SIZE,
        offset: 0,
        // Les critères partent au **serveur**, et non après coup : la requête
        // ramène un lot de 50, donc filtrer la liste reçue ne verrait que ce
        // lot-là et pourrait n'en garder aucun.
        type_ids: [TYPE_DEBIT],
        // La clé est OMISE, pas vidée. Le serveur ignore bien une liste vide
        // (`inList` s'en garde, `IN ()` étant une erreur MySQL), mais s'en
        // remettre à cette garde fait dépendre le sens de la requête d'un
        // détail d'implémentation d'en face. Ne rien envoyer ne dépend de rien.
        ...(includeUnreconciled ? {} : { status_ids: [STATUS_RECONCILED] }),
      })
      .then((response: GetOperationsUsecaseModel) => {
        // Deux requêtes peuvent se croiser — cocher la case pendant que la
        // précédente vole. Sans ce garde, la plus lente écrase la plus récente.
        if (cancelled) return;
        if (response.message === CODES.SUCCESS && response.data)
          setOperations(response.data);
        else inversify.loggerService.debug(response.error);
      })
      .catch((err: Error) => inversify.loggerService.debug(err.message));

    return () => {
      cancelled = true;
    };
  }, [accountId, includeUnreconciled]);

  const pickable = (operations ?? []).filter(
    (operation) => !excludeIds.includes(operation.id),
  );

  return (
    <Box>
      <OperationPicker
        label={label}
        operations={pickable}
        currentAccountId={accountId ?? 0}
        onPick={onPick}
      />
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={includeUnreconciled}
            onChange={(event) => setIncludeUnreconciled(event.target.checked)}
          />
        }
        label={
          <Box sx={{ fontSize: 12.5, color: TEXT.label }}>
            <Trans>operationLink.include-unreconciled</Trans>
          </Box>
        }
        title={t('operationLink.include-unreconciled-hint')}
        sx={{ ml: 0, mt: '4px' }}
      />
    </Box>
  );
};
