import { create } from "zustand";
import type { AdventureRow, NarrativeResponse, NPCStateRow, WorldType } from "@/lib/game/types";
import { createAdventure } from "@/lib/api";

interface GameStore {
  adventure: AdventureRow | null;
  narrative: string;
  choices: string[];
  imagePrompt: string;
  useSafeImage: boolean;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  playerName: string;
  characterBio: string;
  writingStyle: string;
  gender: string;
  npcs: NPCStateRow[];

  setPlayerName: (name: string) => void;
  setCharacterBio: (bio: string) => void;
  setWritingStyle: (style: string) => void;
  setGender: (gender: string) => void;
  startAdventure: (worldType: WorldType) => Promise<void>;
  makeChoice: (choiceIndex: number) => Promise<void>;
  freeAction: (input: string) => Promise<void>;
  reset: () => void;
}

// ── NDJSON streaming fetch ────────────────────────────────────────────────────
async function streamAction(
  body: Record<string, unknown>,
  set: (partial: Partial<GameStore>) => void
) {
  const res = await fetch("/api/game/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "請求失敗");
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let streamingNarrative = "";
  let firstToken = true;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      const msg = JSON.parse(line) as { t: string; v: unknown };

      if (msg.t === "n") {
        // Narrative token — transition from loading to streaming on first token
        if (firstToken) {
          firstToken = false;
          set({ isLoading: false, isStreaming: true });
        }
        streamingNarrative += msg.v as string;
        set({ narrative: streamingNarrative });

      } else if (msg.t === "d") {
        // Done — apply full state
        const r = msg.v as NarrativeResponse;
        set({
          adventure:    r.state,
          narrative:    r.narrative,
          choices:      r.choices,
          imagePrompt:  r.imagePrompt,
          useSafeImage: r.useSafeImage,
          npcs:         r.npcs ?? [],
          isStreaming:  false,
          isLoading:    false,
          error:        null,
        });

      } else if (msg.t === "e") {
        throw new Error(msg.v as string);
      }
    }
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  adventure:    null,
  narrative:    "",
  choices:      [],
  imagePrompt:  "",
  useSafeImage: true,
  isLoading:    false,
  isStreaming:  false,
  error:        null,
  playerName:   "",
  characterBio: "",
  writingStyle: "九把刀風格",
  gender:       "不指定",
  npcs:         [],

  setPlayerName:   (name)  => set({ playerName: name }),
  setCharacterBio: (bio)   => set({ characterBio: bio }),
  setWritingStyle: (style) => set({ writingStyle: style }),
  setGender:       (g)     => set({ gender: g }),

  startAdventure: async (worldType) => {
    const { playerName, characterBio, writingStyle, gender } = get();
    if (!playerName.trim()) { set({ error: "請先輸入名字" }); return; }
    set({ isLoading: true, isStreaming: false, narrative: "", error: null });
    try {
      const adventure = await createAdventure({
        playerName, worldType,
        characterBio: characterBio.trim() || undefined,
        writingStyle:  writingStyle || undefined,
        gender:        gender !== "不指定" ? gender : undefined,
      });
      set({ adventure });
      await streamAction({ adventureId: adventure.id, freeInput: "開始冒險" }, set);
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : "連線失敗", isLoading: false, isStreaming: false });
    }
  },

  makeChoice: async (choiceIndex) => {
    const { adventure, choices } = get();
    if (!adventure) return;
    set({ isLoading: true, isStreaming: false, narrative: "", error: null });
    try {
      await streamAction(
        { adventureId: adventure.id, choiceIndex, previousChoices: choices },
        set
      );
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : "行動失敗", isLoading: false, isStreaming: false });
    }
  },

  freeAction: async (input) => {
    const { adventure } = get();
    if (!adventure) return;
    set({ isLoading: true, isStreaming: false, narrative: "", error: null });
    try {
      await streamAction({ adventureId: adventure.id, freeInput: input }, set);
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : "行動失敗", isLoading: false, isStreaming: false });
    }
  },

  reset: () => set({
    adventure: null, narrative: "", choices: [], imagePrompt: "",
    isLoading: false, isStreaming: false, error: null,
    characterBio: "", writingStyle: "九把刀風格", gender: "不指定", npcs: [],
  }),
}));
