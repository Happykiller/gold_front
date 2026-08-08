// src\index.tsx
import '@fontsource/roboto';
import '@fontsource/montserrat';
import '@fontsource/roboto/400.css';
import '@fontsource/montserrat/600.css';
// Tout ce qui est chiffré — identifiants, montants, soldes — est rendu en
// chasse fixe pour que les colonnes s'alignent verticalement. La pile système
// qui servait jusqu'ici variait d'une machine à l'autre.
import '@fontsource/roboto-mono/400.css';
import '@fontsource/roboto-mono/500.css';

import React, { useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import App from '@src/app';
import initI18n from '@src/i18n';
import { getTheme } from '@src/theme';
import { contextStore } from '@presentation/store/contextStore';

const Index: React.FC = () => {
  const themeMode = contextStore((s) => s.themeMode);
  const theme = useMemo(() => getTheme(themeMode), [themeMode]);

  return (
    <Router>
      {/* Provide the theme to the entire application */}
      <ThemeProvider theme={theme}>
        {/* Apply CSS baseline to ensure consistent styling across browsers */}
        <CssBaseline />
        {/* Un seul fournisseur de dates pour toute l'application : chaque
            champ de date en montait un, jusqu'à quatre écrans. */}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <App />
        </LocalizationProvider>
      </ThemeProvider>
    </Router>
  );
};

// Initialize i18n and then render the app
initI18n().then(() => {
  // Create a root for rendering with ReactDOM.createRoot
  const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement,
  );
  // Render the Index component into the root element
  root.render(<Index />);
});
