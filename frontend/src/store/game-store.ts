import { create } from "zustand";
import type { AdventureState, NarrativeResponse, WorldType } from "@/types/game";
import { createAdventure, sendPlayerAction } from "@/lib/api";

interface GameStore {
  adventure: AdventureState | null;
  narrative: string;
  choices: string[];
  imagePrompt: string;
  useSafeImage: boolean;
  isLoading: boolean;
  error: string | null;
  playerName: string;

  setPlayerName: (name: string) => void;
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

  setPlayerName: (name) => set({ playerName: name }),

  startAdventure: async (worldType) => {
    const { playerName } = get();
    if (!playerName.trim()) {
      set({ error: "請先輸入名字" });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const adventure = await createAdventure({
        world_type: worldType,
        player_name: playerName,
      });
      // 取得開場敘事
      const response = await sendPlayerAction({
        adventure_id: adventure.id,
        free_input: "開始冒險",
      });
      _applyResponse(set, response);
    } catch (e) {
      set({ error: "連線失敗，請確認後端服務是否啟動", isLoading: false });
    }
  },

  makeChoice: async (choiceIndex) => {
    const { adventure } = get();
    if (!adventure) return;
    set({ isLoading: true, error: null });
    try {
      const response = await sendPlayerAction({
        adventure_id: adventure.id,
        choice_index: choiceIndex,
      });
      _applyResponse(set, response);
    } catch (e) {
      set({ error: "行動失敗，請稍後再試", isLoading: false });
    }
  },

  freeAction: async (input) => {
    const { adventure } = get();
    if (!adventure) return;
    set({ isLoading: true, error: null });
    try {
      const response = await sendPlayerAction({
        adventure_id: adventure.id,
        free_input: input,
      });
      _applyResponse(set, response);
    } catch (e) {
      set({ error: "行動失敗，請稍後再試", isLoading: false });
    }
  },

  reset: () =>
    set({
      adventure: null,
      narrative: "",
      choices: [],
      imagePrompt: "",
      isLoading: false,
      error: null,
    }),
}));

function _applyResponse(
  set: (partial: Partial<GameStore>) => void,
  response: NarrativeResponse
) {
  set({
    adventure: response.state,
    narrative: response.narrative,
    choices: response.choices,
    imagePrompt: response.image_prompt,
    useSafeImage: response.use_safe_image,
    isLoading: false,
  });
}
