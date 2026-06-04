import { create } from "zustand";
import type { HeroClass, RunSummary } from "@/game/types";

interface GameStore {
  selectedHeroId: HeroClass;
  lastSummary: RunSummary | null;
  setSelectedHero: (heroId: HeroClass) => void;
  saveSummary: (summary: RunSummary) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  selectedHeroId: "warrior",
  lastSummary: null,
  setSelectedHero: (heroId) => set({ selectedHeroId: heroId }),
  saveSummary: (summary) => set({ lastSummary: summary }),
}));
