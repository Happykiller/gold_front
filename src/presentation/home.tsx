// src\presentation\home.tsx
import * as React from 'react';
import { CircularProgress, Alert, Box } from '@mui/material';

import { useAccounts } from '@presentation/hooks/useAccounts';
import { AccountTree } from '@presentation/molecule/accountTree';

export const Home: React.FC = () => {
  const { data: accounts, loading, error } = useAccounts();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!accounts || accounts.length === 0) {
    return <Alert severity="info">No accounts found.</Alert>;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 540 }}>
        {' '}
        {/* Ajuste maxWidth à ton besoin */}
        <AccountTree accounts={accounts} />
      </Box>
    </Box>
  );

  return;
};
