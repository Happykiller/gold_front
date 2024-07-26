import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const initialState:any = null;

const passkeyPersist = persist<any>(
  (set) => ({
    ...initialState,
    reset: () => set(initialState)
  }),
  {
    name: "siguri-passkey-storage",
    storage: createJSONStorage(() => localStorage),
  }
);

export const passkeyStore = create<any>()(passkeyPersist);