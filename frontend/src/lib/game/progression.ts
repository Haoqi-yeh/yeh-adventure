// ── Dynamic Causality & Progression Gate system ───────────────────────────────

export type CausalityType = "kill" | "save" | "promise" | "betray" | "humiliate" | "ally";

export interface CausalityTag {
  id: string;
  tick: number;
  type: CausalityType;
  npcName: string;
  detail: string;           // e.g. "殺死了李四的父親"
  triggered: boolean;
  triggerAtTick: number;    // future tick when consequence fires
}

export interface GateDef {
  stage: number;            // 1-based, gate unlocks after reaching this stage
  activateAtTick: number;   // earliest tick this gate can fire
  missionName: string;
  missionBrief: string;
}

// ── Gate definitions per world type ──────────────────────────────────────────

export const WORLD_GATES: Record<string, GateDef[]> = {
  xian_xia: [
    {
      stage: 1, activateAtTick: 10,
      missionName: "宗門晉升大比",
      missionBrief: "宗門每年一度的弟子大比正式開始。主角必須在三輪對決中勝出，才能晉升內門；失敗則被打回外門，連接下來的修煉資源也將被剝奪。",
    },
    {
      stage: 2, activateAtTick: 28,
      missionName: "天關突破",
      missionBrief: "靈力積蓄已至臨界，金丹期境界的門正在打開。這次突破只有一次機會——成功則蛻變，根骨大幅強化；失敗將傷及道基，境界倒退三層。",
    },
  ],
  campus: [
    {
      stage: 1, activateAtTick: 10,
      missionName: "期末大考週",
      missionBrief: "三科期末考試接連登場，任何一科不及格都將影響獎學金、社團資格與升學選擇。這一週的所有人際糾紛將全數壓縮進複習室與考場之間。",
    },
    {
      stage: 2, activateAtTick: 28,
      missionName: "畢業前最後一道關",
      missionBrief: "指定評審委員面前的公開發表，評分結果將決定你的大學選擇、人脈資本，以及某些關係的最終走向。",
    },
  ],
  apocalypse: [
    {
      stage: 1, activateAtTick: 10,
      missionName: "據點保衛戰",
      missionBrief: "大規模喪屍潮即將抵達，所有倖存者必須協力守住防線整整三天。戰鬥力、物資與信任同時接受考驗，任何一環崩潰都可能讓整個據點淪陷。",
    },
    {
      stage: 2, activateAtTick: 28,
      missionName: "抗體取得任務",
      missionBrief: "疫苗樣本就在核心污染區最深處的研究站，一個來回需要突破三個變異體封鎖帶。成功將改變整個倖存群體的命運，失敗則永遠沒有下一次機會。",
    },
  ],
  adult: [
    {
      stage: 1, activateAtTick: 10,
      missionName: "關鍵談判",
      missionBrief: "職涯或感情的決定性談判到來，對方的條件與你的底線之間只剩一道縫隙。這場談判的結果將直接決定後續所有選擇的空間有多大。",
    },
    {
      stage: 2, activateAtTick: 28,
      missionName: "人生岔路口",
      missionBrief: "那個無法回頭的重大決定終於來了。兩條路都有代價，都有誘惑。這個選擇將切換整個人生的軌道，不管哪條路，都沒有後悔的餘地。",
    },
  ],
  wuxia: [
    {
      stage: 1, activateAtTick: 10,
      missionName: "江湖名號之戰",
      missionBrief: "一場眾目睽睽之下的比武，勝者將在江湖上立下名號，敗者的弱點將成為所有人的笑柄。對手不止一個，挑戰者的順序由命運決定。",
    },
    {
      stage: 2, activateAtTick: 28,
      missionName: "武林大會",
      missionBrief: "各大門派、幫派頭目與江湖散仙齊聚，這場決定整個武林格局的盟主之爭，每一個到場的人都帶著各自的目的。",
    },
  ],
  western_fantasy: [
    {
      stage: 1, activateAtTick: 10,
      missionName: "試煉塔第七層",
      missionBrief: "冒險者公會的晉升考核在試煉塔七層展開，通過者獲得A級資格與配套資源；失敗者需等待整整一年才能再次挑戰。",
    },
    {
      stage: 2, activateAtTick: 28,
      missionName: "龍裔覺醒儀式",
      missionBrief: "傳說中只有真正的龍裔才能通過的試煉，儀式的核心是直面自己最深的恐懼。成功者將覺醒遠古血脈，失敗者……至今沒有人回來報告結果。",
    },
  ],
  cyberpunk: [
    {
      stage: 1, activateAtTick: 10,
      missionName: "黑市改造手術",
      missionBrief: "頂級義體安裝手術的機會難得一遇。手術成功，戰力與能力全面提升；但如果神經接口適應失敗，將造成永久性神經損傷，甚至人格崩解。",
    },
    {
      stage: 2, activateAtTick: 28,
      missionName: "企業核心滲透",
      missionBrief: "深入企業最高安保等級的核心系統，提取能撼動底層格局的數據。這是也許唯一一次改變街頭勢力版圖的機會，但任何一個失誤都是死路一條。",
    },
  ],
  horror: [
    {
      stage: 1, activateAtTick: 8,
      missionName: "古老的破除儀式",
      missionBrief: "打破詛咒或規則的機會窗口正在關閉，這個儀式必須在今晚完成。材料的取得方式會讓你付出代價，但不嘗試的代價更大。",
    },
    {
      stage: 2, activateAtTick: 22,
      missionName: "源頭對質",
      missionBrief: "追溯到恐懼的真正起源地，在它完全覺醒之前正面對峙。你知道的規則在這裡全部失效，只有你自己挖掘到的線索還有一點用處。",
    },
  ],
  palace_intrigue: [
    {
      stage: 1, activateAtTick: 10,
      missionName: "皇帝壽誕獻禮",
      missionBrief: "大典上的獻禮將在眾妃嬪、朝臣與皇帝面前公開評判。一鳴驚人者聖眷大增，黯然失色者會成為接下來攻訐的活靶。準備的過程同樣充滿算計。",
    },
    {
      stage: 2, activateAtTick: 28,
      missionName: "廢后危機",
      missionBrief: "皇后之位出現動搖的訊號，各派勢力全面展開傾軋。站錯邊的後果是從宮中消失，站對邊的代價是永遠無法回頭。這是最危險也最關鍵的時刻。",
    },
  ],
  wasteland: [
    {
      stage: 1, activateAtTick: 10,
      missionName: "部族血祭考驗",
      missionBrief: "廢土最具影響力的部族正在舉行加入儀式。通過者獲得完整的資源網絡與戰士頭銜；失敗者在這片荒原上將失去所有保護，成為其他倖存者的獵物。",
    },
    {
      stage: 2, activateAtTick: 28,
      missionName: "死城深處",
      missionBrief: "輻射最強的死城核心藏著能改變整個廢土格局的秘密。沒有人完整回來過，但也沒有人回來說那裡到底有什麼。你是第一個有足夠實力嘗試的人。",
    },
  ],
  taiwanese_folk: [
    {
      stage: 1, activateAtTick: 8,
      missionName: "城隍千秋大典",
      missionBrief: "城隍爺千秋大典前夕，神明突然透過乩示交付了一個必須在典禮結束前完成的任務。完成者神契晉階，法力大增；未能完成者將面臨神契斷裂的代價。",
    },
    {
      stage: 2, activateAtTick: 22,
      missionName: "鬼門關大戰",
      missionBrief: "農曆七月最後一夜，積壓整個月的冤魂在午夜後同時湧現。必須在天亮前完成封印，否則整個區域的陰氣濃度將吞噬所有活人。",
    },
  ],
  custom: [
    {
      stage: 1, activateAtTick: 12,
      missionName: "命運的第一道門",
      missionBrief: "這個世界為你設置的第一個重大考驗終於到來。通過者，故事將進入更深的層次；未能通過者，所有的積累都將面臨清算。",
    },
    {
      stage: 2, activateAtTick: 30,
      missionName: "核心衝突爆發點",
      missionBrief: "整個故事的核心矛盾在此刻達到頂峰，所有伏線在這一刻同時收攏。這個決定將決定一切，包括你還有沒有機會再做下一個決定。",
    },
  ],
};

// ── Helper: find the gate that should currently be active ─────────────────────

export function getActiveGate(
  worldType: string,
  currentStage: number,
  currentTick: number
): GateDef | null {
  const gates = WORLD_GATES[worldType] ?? WORLD_GATES.custom;
  // The next gate is the one whose stage === currentStage + 1 and tick threshold is reached
  return (
    gates.find(
      (g) => g.stage === currentStage + 1 && currentTick >= g.activateAtTick
    ) ?? null
  );
}

// ── Helper: build a random future trigger tick for causality events ───────────

export function causalityTriggerTick(currentTick: number): number {
  // Fire 5–18 ticks in the future
  return currentTick + 5 + Math.floor(Math.random() * 14);
}

// ── Causality type labels ─────────────────────────────────────────────────────

export const CAUSALITY_LABELS: Record<CausalityType, string> = {
  kill:      "殺戮",
  save:      "救贖",
  promise:   "承諾",
  betray:    "背叛",
  humiliate: "羞辱",
  ally:      "結盟",
};
