// src\presentation\molecule\accountTree.tsx
import * as React from 'react';
import EditIcon from '@mui/icons-material/Edit';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { useNavigate, createSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  List,
  ListItem,
  Typography,
  Link as MuiLink,
  Chip,
  Stack,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';

import { FormattedAccount } from '@presentation/molecule/accounts';

const getChipColor = (amount: number) => (amount < 0 ? 'error' : 'success');
const formatAmount = (amount: number) =>
  `${amount < 0 ? '-' : '+'} ${Math.abs(Math.round(amount * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`;

export const AccountTree: React.FC<{ accounts: FormattedAccount[] }> = ({
  accounts,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const renderAccount = (account: FormattedAccount) => {
    const hasChildren = account.children.length > 0;
    // Un compte sans opération a un solde nul côté serveur : on l'affiche
    // comme un zéro plutôt que de laisser passer un NaN dans les puces.
    const reco = hasChildren
      ? account.balance_reconcilied_aggregate
      : (account.balance_reconcilied ?? 0);
    const notReco = hasChildren
      ? account.balance_not_reconcilied_aggregate
      : (account.balance_not_reconcilied ?? 0);

    const renderRecoChip = (amount: number) => (
      <Chip
        label={
          <>
            {amount < 0 ? (
              <TrendingDownIcon
                fontSize="inherit"
                sx={{ verticalAlign: 'middle', mr: 0.3, fontSize: 16 }}
              />
            ) : (
              <TrendingUpIcon
                fontSize="inherit"
                sx={{ verticalAlign: 'middle', mr: 0.3, fontSize: 16 }}
              />
            )}
            {formatAmount(amount)}
          </>
        }
        size="small"
        color={getChipColor(amount)}
        sx={{
          fontWeight: 600,
          fontSize: '0.94rem',
          borderRadius: 1.5,
          height: 22,
          minHeight: 0,
          minWidth: 0,
          '.MuiChip-label': { px: 1, py: 0.1 },
        }}
        variant="outlined"
      />
    );

    const renderNotRecoChip = (amount: number) => (
      <Chip
        label={
          <span style={{ opacity: 0.7 }}>
            {amount < 0 ? (
              <TrendingDownIcon
                fontSize="inherit"
                sx={{ verticalAlign: 'middle', mr: 0.3, fontSize: 15 }}
              />
            ) : (
              <TrendingUpIcon
                fontSize="inherit"
                sx={{ verticalAlign: 'middle', mr: 0.3, fontSize: 15 }}
              />
            )}
            {formatAmount(amount)}
          </span>
        }
        size="small"
        color="default"
        sx={{
          fontWeight: 500,
          fontSize: '0.90rem',
          borderRadius: 1.5,
          height: 20,
          minHeight: 0,
          minWidth: 0,
          ml: 1.5, // Décalage visuel à droite
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark'
              ? theme.palette.grey[900]
              : theme.palette.grey[100],
          '.MuiChip-label': { px: 1, py: 0.1, fontStyle: 'italic' },
          opacity: 0.7,
        }}
        variant="outlined"
      />
    );

    return (
      <ListItem
        key={account.id}
        disableGutters
        sx={{
          alignItems: 'flex-start',
          px: 0.8,
          py: 0.2,
          borderLeft: account.parent_account_id ? '2px solid #4B4B6B' : 'none',
          display: 'block',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            minHeight: 22,
            width: '100%',
            flexWrap: 'wrap',
          }}
        >
          <MuiLink
            component="button"
            underline="hover"
            onClick={() =>
              navigate({
                pathname: '/operations',
                search: createSearchParams({
                  account_id: account.id.toString(),
                }).toString(),
              })
            }
            sx={{
              fontWeight: 700,
              fontSize: '1.01rem',
              color: 'primary.main',
              cursor: 'pointer',
              p: 0,
              m: 0,
              minHeight: 0,
              lineHeight: 1.15,
              flexShrink: 0,
              maxWidth: 220,
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
            aria-label={`Ouvrir les opérations pour le compte ${account.label}`}
            title={account.label}
          >
            {account.label}
          </MuiLink>
          {account.type_id === 2 && (
            <Typography
              component="span"
              sx={{
                fontSize: '0.93rem',
                color: 'text.secondary',
                fontWeight: 500,
                mx: 0.4,
                lineHeight: 1.1,
                p: 0,
                m: 0,
                whiteSpace: 'nowrap',
              }}
            >
              {t('account.type-template')}
            </Typography>
          )}
          <Stack
            direction="row"
            spacing={0.5}
            sx={{ flexWrap: 'nowrap', minHeight: 0, p: 0, m: 0 }}
          >
            {renderRecoChip(reco)}
            {renderNotRecoChip(notReco)}
          </Stack>
          <Tooltip title={t('editAccount.edit')}>
            <IconButton
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
              sx={{ p: 0.3, opacity: 0.6, '&:hover': { opacity: 1 } }}
            >
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
        {hasChildren && (
          <List disablePadding dense sx={{ pl: 1.6, pt: 0.1, pb: 0 }}>
            {account.children.map((child) => renderAccount(child))}
          </List>
        )}
      </ListItem>
    );
  };

  return (
    <List disablePadding dense sx={{ p: 0, m: 0 }}>
      {accounts.map(renderAccount)}
    </List>
  );
};
