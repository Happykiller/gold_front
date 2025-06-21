// src/stores/useCalculatorStore.ts
import { create } from 'zustand';
import { Operation } from '@components/hooks/useAccountOperations';

type CalculatorStore = {
  open: boolean;
  operations: Operation[];
  toggle: () => void;
  close: () => void;
  add: (operation: Operation) => void;
  reset: () => void;
};

export const useCalculatorStore = create<CalculatorStore>((set) => ({
  open: false,
  operations: [],
  toggle: () => set((s) => ({ open: !s.open })),
  close: () => set({ open: false }),
  add: (value) => set((s) => ({ operations: [...s.operations, value] })),
  reset: () => set({ operations: [] }),
}));
