// src\presentation\store\contextStore.tsx
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import config from '@src/config';
import { ThemeMode } from '@src/theme';
import inversify from '@src/common/inversify';

export interface ContextStoreModel {
  id: string;
  code: string;
  access_token: string,
  name_first: string,
  name_last: string,
  volume: number;
  themeMode: ThemeMode;
  setThemeMode?: (mode: ThemeMode) => void;
  toggleTheme?: () => void;
  reset: () => void
}

const initialState:any = {
  id: null,
  code: null,
  access_token: null,
  name_first: null,
  name_last: null,
  volume: 0.1,
  themeMode: 'dark'
}

const contextPersist = persist<ContextStoreModel>(
  (set, get) => ({
    ...initialState,
    themeMode: 'dark',
    setThemeMode: (mode) => set({ themeMode: mode }),
    toggleTheme: () =>  set({ themeMode: get().themeMode === 'dark' ? 'light' : 'dark' }),
    reset: () => set(initialState)
  }),
  {
    name: config.local_storage_name,
    storage: createJSONStorage(() => inversify.storageService),
  }
);

export const contextStore = create<ContextStoreModel>()(contextPersist);