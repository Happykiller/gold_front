// src/theme/index.ts
import { darkTheme } from './dark';
import { lightTheme } from './light';

export type ThemeMode = 'light' | 'dark';

export const getTheme = (mode: ThemeMode) =>
  mode === 'dark' ? darkTheme : lightTheme;