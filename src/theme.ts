import { createTheme } from '@mui/material/styles';

// Function to create a theme based on the mode ('light' or 'dark')
const getTheme = (mode: 'light' | 'dark') => createTheme({
  // Define the theme palette based on the provided mode
  palette: {
    // Set the color mode for the palette
    mode,
    
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

export default getTheme;
