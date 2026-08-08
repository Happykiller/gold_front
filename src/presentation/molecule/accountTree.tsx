// src\presentation\molecule\accountTree.tsx
import * as React from 'react';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate, createSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';

import { FormattedAccount } from '@presentation/hooks/accounts';
import { formatEuroAmount } from '@presentation/molecule/operationDisplay';
import { AMOUNT, LINE, MONO_FONT, SURFACE, TEXT } from '@src/theme/tokens';

/**
 * Un solde, en chasse fixe.
 *
 * Les deux flèches ↗ ↘ qui accompagnaient chaque montant ont disparu : le
 * signe et la couleur disent déjà le sens, et deux icônes par ligne sur un
 * arbre de comptes faisaient du bruit sans rien ajouter.
 */
const Balance: React.FC<{
  amount: number;
  title: string;
  dim?: boolean;
}> = ({ amount, title, dim = false }) => (
  <Tooltip title={title} placement="top">
    <Typography
      component="span"
      sx={{
        fontFamily: MONO_FONT,
        fontWeight: 500,
        fontSize: dim ? 11.5 : 12.5,
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
        cursor: 'help',
        color: dim ? TEXT.meta : amount < 0 ? AMOUNT.debit : AMOUNT.credit,
      }}
    >
      {formatEuroAmount(amount)}
    </Typography>
  </Tooltip>
);

const ROW_ACTIONS = 'account-row-actions';

export const AccountTree: React.FC<{ accounts: FormattedAccount[] }> = ({
  accounts,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const renderAccount = (account: FormattedAccount, depth = 0) => {
    const hasChildren = account.children.length > 0;
    // Un compte sans opération a un solde nul côté serveur : on l'affiche
    // comme un zéro plutôt que de laisser passer un NaN dans les montants.
    const reconciled = hasChildren
      ? account.balance_reconcilied_aggregate
      : (account.balance_reconcilied ?? 0);
    // Rappel : `balance_not_reconcilied` agrège les statuts 1 **et** 2 — c'est
    // le solde projeté, pas le reste à pointer.
    const total = hasChildren
      ? account.balance_not_reconcilied_aggregate
      : (account.balance_not_reconcilied ?? 0);

    return (
      <Box key={account.id}>
        <Box
          data-depth={depth}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            height: 30,
            pr: '12px',
            borderBottom: LINE.row,
            '&:hover': { background: SURFACE.rowHover },
            [`&:hover .${ROW_ACTIONS}, &:focus-within .${ROW_ACTIONS}`]: {
              opacity: 1,
            },
          }}
        >
          <Box
            component="button"
            type="button"
            onClick={() =>
              navigate({
                pathname: '/operations',
                search: createSearchParams({
                  account_id: account.id.toString(),
                }).toString(),
              })
            }
            title={account.label}
            sx={{
              p: 0,
              border: 'none',
              background: 'none',
              font: 'inherit',
              fontSize: 13.5,
              color: TEXT.description,
              cursor: 'pointer',
              textAlign: 'left',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              '&:hover': { color: TEXT.hover },
            }}
          >
            {account.label}
          </Box>

          {account.type_id === 2 && (
            <Typography
              component="span"
              sx={(theme) => ({
                fontSize: 9.5,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: TEXT.meta,
                background: SURFACE.chip,
                borderRadius: `${theme.radius.sm}px`,
                px: '5px',
                py: '2px',
                whiteSpace: 'nowrap',
              })}
            >
              {t('account.type-template')}
            </Typography>
          )}

          <Box
            sx={{
              ml: 'auto',
              display: 'flex',
              alignItems: 'baseline',
              gap: '12px',
            }}
          >
            {/*
             * Le solde **pointé** d'abord, et en avant : c'est l'argent que la
             * banque a validé, celui sur lequel on décide. Le projeté vient
             * après, en retrait — il informe, il ne tranche pas.
             *
             * L'ordre inverse avait été introduit par erreur au passage sur
             * cette molecule, alors que la hiérarchie d'origine était juste.
             */}
            <Balance
              amount={reconciled}
              title={t('account.balance.reconciled')}
            />
            <Balance amount={total} title={t('account.balance.total')} dim />
          </Box>

          <Tooltip title={t('editAccount.edit')} placement="top">
            <IconButton
              className={ROW_ACTIONS}
              size="small"
              aria-label={`${t('editAccount.edit')} : ${account.label}`}
              onClick={() =>
                navigate({
                  pathname: '/account_edit',
                  search: createSearchParams({
                    account_id: account.id.toString(),
                  }).toString(),
                })
              }
              sx={{
                p: '3px',
                // Révélés au survol, comme dans la liste des opérations : une
                // icône par ligne sur tout l'arbre, c'est le bruit le plus
                // dense de l'écran.
                opacity: { xs: 1, sm: 0 },
                transition: 'opacity 120ms ease-in-out',
                '& .MuiSvgIcon-root': { fontSize: 14 },
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {hasChildren && (
          // Le retrait est porté par le conteneur de la branche, et non par la
          // ligne : il s'accumule alors de lui-même à chaque niveau. La version
          // précédente écrivait `depth ? '10px' : 0` — un test booléen, donc le
          // même retrait pour le niveau 2 que pour le niveau 1, et une
          // hiérarchie à plat au-delà du premier étage.
          //
          // Le filet vertical court sur toute la hauteur de la branche, ce qui
          // rattache visiblement les enfants à leur parent.
          <Box
            data-branch=""
            sx={{ ml: '10px', pl: '14px', borderLeft: LINE.block }}
          >
            {account.children.map((child) => renderAccount(child, depth + 1))}
          </Box>
        )}
      </Box>
    );
  };

  return <Box>{accounts.map((account) => renderAccount(account))}</Box>;
};
