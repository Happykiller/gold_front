// src\theme\dark.ts
import { createTheme, responsiveFontSizes } from '@mui/material/styles';

import {
  createSharedComponents,
  sharedShape,
  sharedTypography,
} from './shared';

export const darkPalette = {
  mode: 'dark' as const,
  primary: { main: '#4169E1', light: '#598AE3' },
  secondary: { main: '#8ECAE6', light: '#B2E4F3' },
  background: {
    default: '#0F0F2B',
    paper: '#1A2E55',
  },
  text: {
    primary: '#F1F1F1',
  },
  gradient: `
    radial-gradient(ellipse at 50% 0%, rgba(44, 91, 255, 0.25) 0%, transparent 70%),
    linear-gradient(135deg, #0F0F2B 0%, #1B1F3B 100%)`,
};

export const darkTheme = responsiveFontSizes(
  createTheme({
    palette: {
      ...darkPalette,
    },
    shape: sharedShape,
    typography: {
      ...sharedTypography,
      h1: { ...sharedTypography.h1, color: darkPalette.text.primary },
      body1: { ...sharedTypography.body1, color: darkPalette.text.primary },
    },
    components: {
      ...createSharedComponents(darkPalette.primary),
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: darkPalette.background.default,
            backgroundImage: darkPalette.gradient,
          },
        },
      },
    },
  })
);