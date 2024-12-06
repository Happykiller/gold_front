// src\presentation\store\contextStore.tsx
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import inversify from '@src/common/inversify';

export interface ContextStoreModel {
  id: string;
  code: string;
  access_token: string,
  name_first: string,
  name_last: string,
  reset: () => void
}

const initialState:any = {
  id: null,
  code: null,
  access_token: null,
  name_first: null,
  name_last: null,
}

const contextPersist = persist<ContextStoreModel>(
  (set) => ({
    ...initialState,
    reset: () => set(initialState)
  }),
  {
    name: "gold-storage",
    storage: createJSONStorage(() => inversify.storageService),
  }
);

export const contextStore = create<ContextStoreModel>()(contextPersist);