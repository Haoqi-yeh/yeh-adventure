import type {
  AdventureRequest,
  AdventureState,
  Destiny,
  Gender,
  Origin,
  PlayerProfile,
  StoryChoice,
  StoryEntry,
} from "./types";

const GENDER_LABEL: Record<Gender, string> = {
  male: "男修",
  female: "女修",
  unspecified: "不拘",
};

const ORIGIN_LABEL: Record<Origin, string> = {
  wandering: "江湖散修",
  fallen_clan: "沒落世家",
  outer_disciple: "宗門外門",
  hidden_bloodline: "隱脈遺孤",
};

const DESTINY_LABEL: Record<Destiny, string> = {
  sword: "劍修",
  alchemy: "丹道",
  formation: "陣法",
  beast_taming: "御獸",
};

const OPENING_BY_ORIGIN: Record<Origin, string> = {
  wandering: "你背著一柄缺口鐵劍，沿著青石山道走到雲霧盡頭。山門前的銅鐘無風自鳴，像是在確認你的名字。",
  fallen_clan: "祖宅被封的第七年，你在廢井裡找到一枚裂開的玉簡。玉簡只剩半句話：若葉家仍有血脈，速往青玄山。",
  outer_disciple: "你掃了三年藏經閣，從未被任何長老記住。直到今晚，書架最底層那本無字經自己翻開，露出一道微光。",
  hidden_bloodline: "你一直以為自己只是市井孤兒，直到追殺者叫出了你母親的道號。那一刻，沉睡多年的靈根終於發燙。",
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
    name: profile.name.trim() || "無名散修",
    premise: profile.premise.trim() || "一個初入江湖，想在仙路上留下姓名的人。",
    gender: profile.gender,
    origin: profile.origin,
    destiny: profile.destiny,
  };
}

export function createInitialAdventure(profile: PlayerProfile): AdventureState {
  const normalized = normalizeProfile(profile);
  const opening = OPENING_BY_ORIGIN[normalized.origin];

  return {
    phase: "playing",
    turn: 1,
    profile: normalized,
    location: "青玄山門",
    mood: "仙路初開",
    stats: {
      focus: 54,
      nerve: 46,
      luck: 50,
    },
    memory: [
      `${normalized.name}：${normalized.premise}`,
      `身份：${GENDER_LABEL[normalized.gender]}，${ORIGIN_LABEL[normalized.origin]}，偏向${DESTINY_LABEL[normalized.destiny]}`,
    ],
    entries: [
      makeEntry("system", "冒險開始。"),
      makeEntry("story", `${opening}\n\n你知道自己還很弱，但今日若退，往後便再也踏不上這條仙路。`),
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
    "山霧在你身前分開一線，遠處傳來劍鳴，又像是有人在低聲誦訣。",
    `這一次行動讓你離青玄山更近，也讓暗處的目光開始記住${state.profile.name}這個名字。`,
  ].join("\n\n");

  return {
    ...state,
    turn: nextTurn,
    mood: nextTurn % 3 === 0 ? "因果將至" : "山門未開",
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
