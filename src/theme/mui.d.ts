// src/theme/mui.d.ts
import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    gradient?: string;
  }

  interface PaletteOptions {
    gradient?: string;
  }

  /** Échelle de rayons, voir `sharedRadius` dans `theme/shared.ts`. */
  interface Radius {
    sm: number;
    md: number;
    lg: number;
  }

  interface Theme {
    radius: Radius;
  }

  interface ThemeOptions {
    radius?: Radius;
  }
}
