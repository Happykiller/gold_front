// src/theme/light.ts
import { createTheme, responsiveFontSizes } from '@mui/material/styles';

import {
  createSharedComponents,
  sharedShape,
  sharedTypography,
} from './shared';

export const lightPalette = {
  mode: 'light' as const,
  primary: { main: '#4169E1', light: '#598AE3' },
  secondary: { main: '#8ECAE6', light: '#B2E4F3' },
  background: {
    default: '#FCFCFC',
    paper: '#FFFFFF',
  },
  text: {
    primary: '#1C1C1C',
  },
  gradient: `
    radial-gradient(ellipse at 50% 0%, rgba(44, 91, 255, 0.1) 0%, transparent 70%),
    linear-gradient(135deg, #FFFFFF 0%, #F4F6FB 100%)`,
};

export const lightTheme = responsiveFontSizes(
  createTheme({
    palette: {
      ...lightPalette,
    },
    shape: sharedShape,
    typography: {
      ...sharedTypography,
      h1: { ...sharedTypography.h1, color: lightPalette.text.primary },
      body1: { ...sharedTypography.body1, color: lightPalette.text.primary },
    },
    components: {
      ...createSharedComponents(lightPalette.primary),
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: lightPalette.background.default,
            backgroundImage: lightPalette.gradient,
          },
        },
      },
    },
  })
);
