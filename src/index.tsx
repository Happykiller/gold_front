import * as React from 'react';
import { createRoot } from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import '@src/i18n';
import '@src/index.scss';
import Flash from '@presentation/flash';
import { CGU } from '@presentation/cgu';
import { Home } from '@presentation/home';
import { Login } from '@presentation/login';
import { Guard } from '@presentation/guard';
import { Operations } from '@presentation/operations';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Guard><Home /></Guard>,
  },  {
    path: "/operations",
    element: <Guard><Operations /></Guard>,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/CGU",
    element: <CGU />,
  },
]);

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#03DAC6',
      light: '#FFB2FF',
      // dark: will be calculated from palette.secondary.main,
      contrastText: '#000000',
    },
    secondary: {
      main: '#018786',
      light: '#F5EBFF',
      // dark: will be calculated from palette.secondary.main,
      contrastText: '#000000',
    }
  },
});

createRoot(document.getElementById("root")).render(
  <ThemeProvider theme={darkTheme}>
    <CssBaseline />
    <RouterProvider router={router} />
    <Flash/>
  </ThemeProvider>
);