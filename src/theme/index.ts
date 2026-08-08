// src/theme/index.ts
import { darkTheme } from './dark';

/**
 * Gold n'a plus qu'un thème.
 *
 * Décision du 2026-08-08 : le langage visuel de l'application est **sombre par
 * construction** — les jetons de `tokens.ts` ne décrivent qu'une gamme, et les
 * écrans les écrivent directement dans leur `sx`. Maintenir une seconde gamme
 * claire aurait doublé chaque passage visuel pour un mode que l'outil, utilisé
 * en continu, ne réclamait pas.
 *
 * `ThemeMode` et la signature de `getTheme` sont conservés : le `Footer` de
 * `sunny-ui` porte une bascule de thème que l'on ne peut pas retirer sans
 * toucher la bibliothèque. Elle reste donc affichée, et **sans effet**. C'est
 * délibéré, pas un oubli de câblage.
 */
export type ThemeMode = 'light' | 'dark';

export const getTheme = (_mode: ThemeMode) => darkTheme;
