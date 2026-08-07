// src\presentation\account_edit.tsx
import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';

import { CODES } from '@src/common/codes';
import inversify from '@src/common/inversify';
import { useFlashStore } from '@happykiller/sunny-ui';
import { AccountUsecaseModel } from '@usecase/model/account.usecase.model';
import { AccountTypeUsecaseModel } from '@usecase/getAccountTypes/getAccountTypes.usecase.model';

export const EditAccount = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const flash = useFlashStore();
  const [searchParams] = useSearchParams();

  const accountId = parseInt(searchParams.get('account_id') ?? '0');

  const [account, setAccount] = React.useState<AccountUsecaseModel | null>(
    null,
  );
  const [types, setTypes] = React.useState<AccountTypeUsecaseModel[]>([]);
  const [label, setLabel] = React.useState('');
  const [typeId, setTypeId] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      const [accountResponse, typesResponse] = await Promise.all([
        inversify.getAccountUsecase.execute({ account_id: accountId }),
        inversify.getAccountTypesUsecase.execute(),
      ]);

      if (cancelled) return;

      if (accountResponse.message !== CODES.SUCCESS || !accountResponse.data) {
        setError(accountResponse.error ?? accountResponse.message);
        setLoading(false);
        return;
      }

      setAccount(accountResponse.data);
      setLabel(accountResponse.data.label);
      setTypeId(String(accountResponse.data.type_id));

      if (typesResponse.message === CODES.SUCCESS && typesResponse.data) {
        setTypes(typesResponse.data);
      } else {
        // Le compte reste éditable même si le référentiel n'a pas répondu :
        // seul le sélecteur de type sera vide.
        setError(typesResponse.error ?? null);
      }

      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  const labelIsValid = label.trim().length > 0;
  const isDirty =
    account !== null &&
    (label.trim() !== account.label || typeId !== String(account.type_id));
  const canSubmit = labelIsValid && isDirty && !saving;

  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    setError(null);

    const response = await inversify.updateAccountUsecase.execute({
      account_id: accountId,
      label: label.trim(),
      type_id: parseInt(typeId),
    });

    setSaving(false);

    if (response.message !== CODES.SUCCESS) {
      setError(response.error ?? response.message);
      return;
    }

    flash.open(t('editAccount.succeed'));
    navigate('/accounts');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!account) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, px: 2 }}>
        <Alert severity="error">{error ?? t('error.unknown')}</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        px: 2,
        py: 4,
      }}
    >
      <Box
        sx={{
          borderRadius: { xs: 0, sm: '16px' },
          boxShadow: {
            xs: 'none',
            sm: `0 0 32px 0 ${theme.palette.primary.main}55`,
          },
          border: { xs: 'none', sm: `2px solid ${theme.palette.primary.main}` },
          maxWidth: 560,
          width: '100%',
          background: { xs: 0, sm: theme.palette.background.default },
          p: 3,
        }}
      >
        <Typography
          variant="h6"
          color="text.primary"
          sx={{ fontWeight: 700, textAlign: 'center', mb: 2 }}
        >
          <Trans>editAccount.title</Trans>
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid size={12}>
              <TextField
                fullWidth
                autoFocus
                variant="standard"
                label={<Trans>editAccount.label</Trans>}
                value={label}
                error={!labelIsValid}
                onChange={(e) => setLabel(e.target.value)}
              />
            </Grid>

            <Grid size={12}>
              <FormControl variant="standard" fullWidth>
                <InputLabel id="account-type-label">
                  <Trans>editAccount.type</Trans>
                </InputLabel>
                <Select
                  labelId="account-type-label"
                  value={typeId}
                  variant="standard"
                  onChange={(e) => setTypeId(String(e.target.value))}
                >
                  {types.map((type) => (
                    <MenuItem key={type.id} value={String(type.id)}>
                      {/* Le référentiel stocke une clé i18n, pas un libellé. */}
                      {t(type.label)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {error && (
              <Grid size={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}

            <Grid size={12} sx={{ textAlign: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={!canSubmit}
                startIcon={<SaveAltIcon />}
              >
                <Trans>editAccount.send</Trans>
              </Button>
              <Button
                sx={{ ml: 1 }}
                onClick={() => navigate('/accounts')}
                disabled={saving}
              >
                <Trans>common.cancel</Trans>
              </Button>
            </Grid>
          </Grid>
        </form>
      </Box>
    </Box>
  );
};
