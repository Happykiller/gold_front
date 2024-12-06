import * as React from 'react';
import { createRoot } from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import '@src/i18n';
import '@src/index.scss';
import { CGU } from '@presentation/cgu';
import { Home } from '@presentation/home';
import { Login } from '@presentation/login';
import { Guard } from '@src/presentation/molecule/guard';
import { Clone } from '@presentation/clone';
import { Profile } from '@presentation/profile';
import Flash from '@presentation/molecule/flash';
import { CreateVir } from '@presentation/createVir';
import { Operations } from '@presentation/operations';
import { OperationNew } from '@presentation/operation_new';
import { EditOperation } from '@src/presentation/operation_edit';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Guard><Home /></Guard>,
  }, 
  {
    path: "/accounts",
    element: <Guard><Home /></Guard>,
  }, 
  {
    path: "/operations",
    element: <Guard><Operations /></Guard>,
  }, 
  {
    path: "/createVir",
    element: <Guard><CreateVir /></Guard>,
  },
  {
    path: "/clone",
    element: <Guard><Clone /></Guard>,
  },
  {
    path: "/operation_edit",
    element: <Guard><EditOperation /></Guard>,
  },
  {
    path: "/operation_new",
    element: <Guard><OperationNew /></Guard>,
  },
  {
    path: "/profile",
    element: <Guard><Profile /></Guard>,
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