import type {
  AdventureRequest,
  AdventureState,
  PlayerProfile,
  StoryChoice,
  StoryEntry,
  WorldPreset,
} from "./types";

const WORLD_LABEL: Record<WorldPreset, string> = {
  urban_fantasy: "台北異聞",
  xianxia: "現代修真",
  school_mystery: "校園怪談",
  custom: "自訂世界",
};

const OPENING_BY_WORLD: Record<WorldPreset, string> = {
  urban_fantasy: "捷運末班車停在不存在的站名下，月台廣播用你的名字提醒你下車。",
  xianxia: "你在便利商店的冷藏櫃前醒來，掌心多了一道像呼吸一樣發亮的靈紋。",
  school_mystery: "晚自習鐘聲響過三次後，教室裡只剩你，黑板卻自己寫下明天的日期。",
  custom: "世界像一張剛被翻開的紙，第一行字還沒有定稿，只等你走進去。",
};

const CHOICE_BANK: StoryChoice[][] = [
  [
    { id: "observe", label: "先觀察周遭", intent: "放慢腳步，尋找環境裡不合理的細節" },
    { id: "approach", label: "主動靠近異常", intent: "靠近最可疑的東西，確認它是否會回應" },
    { id: "leave-mark", label: "留下記號", intent: "留下只有自己看得懂的記號，避免之後迷路" },
  ],
  [
    { id: "ask", label: "詢問路人", intent: "找一個看似普通的人搭話，試探這裡的規則" },
    { id: "hide", label: "暫時躲起來", intent: "避開視線，先確認是否有人在追蹤你" },
    { id: "touch", label: "觸碰關鍵物", intent: "用手碰觸那個最像線索的物件" },
  ],
  [
    { id: "promise", label: "做出承諾", intent: "答應眼前存在提出的要求，但保留一點餘地" },
    { id: "refuse", label: "拒絕交易", intent: "拒絕不明代價，逼對方露出真正目的" },
    { id: "improvise", label: "自由發揮", intent: "不照常理行動，打亂事件原本的節奏" },
  ],
];

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function makeEntry(speaker: StoryEntry["speaker"], text: string): StoryEntry {
  return {
    id: `${speaker}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    speaker,
    text,
  };
}

function normalizeProfile(profile: PlayerProfile): PlayerProfile {
  return {
    name: profile.name.trim() || "無名者",
    premise: profile.premise.trim() || "一個想知道故事會把自己帶去哪裡的人。",
    world: profile.world,
  };
}

export function createInitialAdventure(profile: PlayerProfile): AdventureState {
  const normalized = normalizeProfile(profile);
  const opening = OPENING_BY_WORLD[normalized.world];

  return {
    phase: "playing",
    turn: 1,
    profile: normalized,
    location: WORLD_LABEL[normalized.world],
    mood: "異常剛剛開始",
    stats: {
      focus: 54,
      nerve: 46,
      luck: 50,
    },
    memory: [
      `${normalized.name}：${normalized.premise}`,
      `世界：${WORLD_LABEL[normalized.world]}`,
    ],
    entries: [
      makeEntry("system", "冒險開始。"),
      makeEntry("story", `${opening}\n\n你很確定，這不是普通的一天。`),
    ],
    choices: CHOICE_BANK[0],
  };
}

export function advanceAdventure({ state, action }: AdventureRequest): AdventureState {
  const cleanAction = action.trim() || "保持沉默，等待下一個變化";
  const nextTurn = state.turn + 1;
  const statShift = cleanAction.length % 9;
  const nextChoices = CHOICE_BANK[(nextTurn - 1) % CHOICE_BANK.length];

  const consequence = [
    `你選擇：「${cleanAction}」。`,
    "空氣像被輕輕折了一下，原本模糊的線索開始靠近。",
    `這一次行動讓你更接近真相，但也讓${state.location}記住了你的輪廓。`,
  ].join("\n\n");

  return {
    ...state,
    turn: nextTurn,
    mood: nextTurn % 3 === 0 ? "事件正在收束" : "未知仍在擴大",
    stats: {
      focus: clamp(state.stats.focus + 3 + statShift),
      nerve: clamp(state.stats.nerve + (statShift > 4 ? 4 : -2)),
      luck: clamp(state.stats.luck + (nextTurn % 2 === 0 ? 2 : -1)),
    },
    memory: [
      ...state.memory.slice(-5),
      `第 ${state.turn} 回合：${cleanAction}`,
    ],
    entries: [
      ...state.entries,
      makeEntry("player", cleanAction),
      makeEntry("story", consequence),
    ],
    choices: nextChoices,
  };
}
