// Zustand store for buddy collection state

import { create } from "zustand";

interface PetStoreState {
  buddies: BuddyRecord[];
  activeBuddy: BuddyRecord | null;
  pawCoins: number;
  loaded: boolean;

  setBuddies: (buddies: BuddyRecord[]) => void;
  setActiveBuddy: (buddy: BuddyRecord | null) => void;
  setCoins: (coins: number) => void;
  setLoaded: (loaded: boolean) => void;
  addBuddy: (buddy: BuddyRecord) => void;
  renameBuddy: (id: string, name: string) => void;
}

export const usePetStore = create<PetStoreState>((set) => ({
  buddies: [],
  activeBuddy: null,
  pawCoins: 0,
  loaded: false,

  setBuddies: (buddies) => set({ buddies }),
  setActiveBuddy: (buddy) => set({ activeBuddy: buddy }),
  setCoins: (coins) => set({ pawCoins: coins }),
  setLoaded: (loaded) => set({ loaded }),
  addBuddy: (buddy) => set((state) => ({ buddies: [buddy, ...state.buddies] })),
  renameBuddy: (id, name) => set((state) => ({
    buddies: state.buddies.map((b) => b.id === id ? { ...b, name } : b),
    activeBuddy: state.activeBuddy?.id === id ? { ...state.activeBuddy, name } : state.activeBuddy,
  })),
}));
