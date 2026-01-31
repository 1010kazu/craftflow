// store/game-store.ts

import { create } from 'zustand';
import { Game } from '@/types';

interface GameState {
  selectedGame: Game | null;
  setSelectedGame: (game: Game | null) => void;
}

export const useGameStore = create<GameState>((set) => ({
  selectedGame: null,
  setSelectedGame: (game) => set({ selectedGame: game }),
}));
