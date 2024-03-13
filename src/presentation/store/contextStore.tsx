import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ContextStoreModel {
  id: string;
  code: string;
  access_token: string,
  name_first: string,
  name_last: string,
  chests_secret: {
    id: string;
    secret: string;
  }[]
  reset: () => void
}

const initialState:any = {
  id: null,
  code: null,
  access_token: null,
  name_first: null,
  name_last: null,
  chests_secret: null,
}

const contextPersist = persist<ContextStoreModel>(
  (set) => ({
    ...initialState,
    reset: () => set(initialState)
  }),
  {
    name: "gold-storage",
    storage: createJSONStorage(() => localStorage),
  }
);

export const contextStore = create<ContextStoreModel>()(contextPersist);