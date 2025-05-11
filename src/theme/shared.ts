// src/theme/shared/index.ts
import { createTheme, Components } from '@mui/material/styles';

const baseTheme = createTheme();
const { breakpoints, typography } = baseTheme;
const { pxToRem } = typography;

export const sharedShape = {
  borderRadius: 10,
};

export const sharedTypography = {
  fontFamily: ['Montserrat', 'Roboto', 'sans-serif'].join(','),
  h1: {
    fontFamily: 'Montserrat',
    fontWeight: 600,
    fontSize: pxToRem(28),
    lineHeight: 1.4,
    letterSpacing: '0.25px',
    [breakpoints.up('sm')]: {
      fontSize: pxToRem(32),
    },
    [breakpoints.up('md')]: {
      fontSize: pxToRem(36),
    },
  },
  body1: {
    fontFamily: 'Roboto',
    fontWeight: 400,
    fontSize: pxToRem(15),
    lineHeight: 1.6,
  },
  button: {
    fontFamily: 'Montserrat',
    fontWeight: 600,
    fontSize: pxToRem(14),
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as 'uppercase',
  },
};

export const createSharedComponents = (
  buttonPalette: { main: string; light: string }
): Components => ({
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 10,
        fontWeight: 600,
        letterSpacing: '0.05em',
        textTransform: 'none',
        paddingTop: 12,
        paddingBottom: 12,
      },
      contained: {
        backgroundColor: buttonPalette.main,
        color: '#fff',
        '&:hover': {
          backgroundColor: buttonPalette.light,
        },
      },
      outlined: {
        borderColor: buttonPalette.main,
        color: buttonPalette.main,
        '&:hover': {
          borderColor: buttonPalette.light,
          color: buttonPalette.light,
          backgroundColor: 'rgba(89,138,227,0.05)',
        },
      },
    },
  },
  MuiLink: {
    styleOverrides: {
      root: (props: any) => {
        return {
          color: buttonPalette.main,
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
            color: buttonPalette.light,
          },
        };
      },
    },
  },
});
