// src\index.tsx
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';

import App from '@src/app';
import initI18n from '@src/i18n';
import getTheme from '@src/theme';

const Index: React.FC = () => {
  // State to determine whether dark mode is enabled
  const [darkMode] = useState(true);

  // Create the theme based on the current mode (dark or light)
  const theme = getTheme(darkMode ? 'dark' : 'light');

  return (
    <Router>
      {/* Provide the theme to the entire application */}
      <ThemeProvider theme={theme}>
        {/* Apply CSS baseline to ensure consistent styling across browsers */}
        <CssBaseline />
        <App />
      </ThemeProvider>
    </Router>
  );
};

// Initialize i18n and then render the app
initI18n().then(() => {
  // Create a root for rendering with ReactDOM.createRoot
  const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
  // Render the Index component into the root element
  root.render(<Index />);
});
