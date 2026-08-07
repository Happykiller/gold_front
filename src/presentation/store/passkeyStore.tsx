// src\presentation\store\passkeyStore.tsx
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface PasskeyStoreModel {
  display: string | null;
  passkey_id: string | null;
  user_code: string | null;
  challenge: string | null;
  credential_id: string | null;
  reset?: () => void;
}

const initialState: PasskeyStoreModel = {
  display: null,
  passkey_id: null,
  user_code: null,
  challenge: null,
  credential_id: null,
};

const passkeyPersist = persist<PasskeyStoreModel>(
  (set: any) => ({
    ...initialState,
    reset: () => set(initialState),
  }),
  {
    name: 'gold-passkey-storage',
    storage: createJSONStorage(() => localStorage),
  },
);

export const passkeyStore = create<PasskeyStoreModel>()(passkeyPersist);
