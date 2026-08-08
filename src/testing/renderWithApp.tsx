// src/testing/renderWithApp.tsx
//
// Aide de test : ce module n'est jamais servi à l'application, le
// rechargement à chaud ne le concerne pas.
/* eslint-disable react-refresh/only-export-components */
import * as React from 'react';
import i18n from 'i18next';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { initReactI18next, I18nextProvider } from 'react-i18next';

import { darkTheme } from '@src/theme/dark';
import appFR from '@src/locales/fr/translation.json';

/**
 * Monte un composant dans le contexte réel de l'application : son thème et ses
 * traductions.
 *
 * Le thème n'est pas décoratif ici. `theme.radius` est une augmentation propre
 * au projet : hors `ThemeProvider`, `useTheme()` rend le thème par défaut de
 * MUI, `theme.radius` vaut `undefined`, et tout composant qui lit un rayon
 * lève à l'exécution. Un test qui monte sans thème ne teste donc pas le même
 * composant que celui qui est livré.
 *
 * Les traductions sont chargées pour de vrai, en français : sans elles, `t()`
 * rend la clé, et une assertion sur un libellé passerait aussi bien avec une
 * chaîne en dur qu'avec une clé i18n — c'est-à-dire ne prouverait rien.
 */
const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  resources: { fr: { translation: appFR } },
  lng: 'fr',
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
});

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <I18nextProvider i18n={testI18n}>
    <ThemeProvider theme={darkTheme}>{children}</ThemeProvider>
  </I18nextProvider>
);

export const renderWithApp = (ui: React.ReactElement) =>
  render(ui, { wrapper: AppProviders });

export { testI18n };
