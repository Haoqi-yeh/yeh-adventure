import { create } from "zustand";
import type { AdventureRow, NarrativeResponse, NPCStateRow, WorldType } from "@/lib/game/types";
import { createAdventure, sendPlayerAction } from "@/lib/api";

interface GameStore {
  adventure: AdventureRow | null;
  narrative: string;
  choices: string[];
  imagePrompt: string;
  useSafeImage: boolean;
  isLoading: boolean;
  error: string | null;
  playerName: string;
  characterBio: string;
  npcs: NPCStateRow[];

  setPlayerName: (name: string) => void;
  setCharacterBio: (bio: string) => void;
  startAdventure: (worldType: WorldType) => Promise<void>;
  makeChoice: (choiceIndex: number) => Promise<void>;
  freeAction: (input: string) => Promise<void>;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  adventure: null,
  narrative: "",
  choices: [],
  imagePrompt: "",
  useSafeImage: true,
  isLoading: false,
  error: null,
  playerName: "",
  characterBio: "",
  npcs: [],

  setPlayerName: (name) => set({ playerName: name }),
  setCharacterBio: (bio) => set({ characterBio: bio }),

  startAdventure: async (worldType) => {
    const { playerName, characterBio } = get();
    if (!playerName.trim()) { set({ error: "請先輸入名字" }); return; }
    set({ isLoading: true, error: null });
    try {
      const adventure = await createAdventure({ playerName, worldType, characterBio: characterBio.trim() || undefined });
      const response = await sendPlayerAction({ adventureId: adventure.id, freeInput: "開始冒險" });
      applyResponse(set, response);
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : "連線失敗", isLoading: false });
    }
  },

  makeChoice: async (choiceIndex) => {
    const { adventure, choices } = get();
    if (!adventure) return;
    set({ isLoading: true, error: null });
    try {
      const response = await sendPlayerAction({ adventureId: adventure.id, choiceIndex, previousChoices: choices });
      applyResponse(set, response);
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : "行動失敗", isLoading: false });
    }
  },

  freeAction: async (input) => {
    const { adventure } = get();
    if (!adventure) return;
    set({ isLoading: true, error: null });
    try {
      const response = await sendPlayerAction({ adventureId: adventure.id, freeInput: input });
      applyResponse(set, response);
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : "行動失敗", isLoading: false });
    }
  },

  reset: () => set({
    adventure: null, narrative: "", choices: [], imagePrompt: "",
    isLoading: false, error: null, characterBio: "", npcs: [],
  }),
}));

function applyResponse(set: (partial: Partial<GameStore>) => void, response: NarrativeResponse) {
  set({
    adventure: response.state,
    narrative: response.narrative,
    choices: response.choices,
    imagePrompt: response.imagePrompt,
    useSafeImage: response.useSafeImage,
    npcs: response.npcs ?? [],
    isLoading: false,
    error: null,
  });
}
