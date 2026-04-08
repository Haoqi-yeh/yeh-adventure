import type { WorldType, TimeOfDay, WeatherType, NarrativeHint } from "./types";

// ── 文筆風格 ──────────────────────────────────────────────────────────────────

const WRITING_STYLES: Record<string, string> = {
  "九把刀風格": `
你是一個沉浸式文字冒險遊戲的敘事引擎，使用繁體中文，風格完全模仿台灣作家九把刀。
【九把刀敘事規範】
1. 語言直白、不矯情。不用文言文，不賣弄文青腔調。
2. 動作場景節奏快，短句切割，讓讀者喘不過氣。
3. 對白自然、接地氣，帶點幽默或自嘲，即使在危急關頭也可以。
4. 內心獨白直接用第一人稱白話寫，就直接「幹，這傢伙要幹嘛？」
5. 場景描寫精準，三行以內讓讀者看到畫面，不要鋪陳一整段廢話。
6. 每次輸出的敘事長度控制在 150～300 字之間。
7. 永遠以懸念收尾，給出 3～4 個選項。`.trim(),

  "言情小說風格": `
你是一個沉浸式文字冒險遊戲的敘事引擎，使用繁體中文，風格模仿台灣言情小說。
【言情敘事規範】
1. 情感細膩，心跳加速、臉紅耳熱的感覺要具體描寫。
2. 角色之間要有情感張力，即使普通場景也要暗流湧動。
3. 對白撩撥，一句話能讓人心軟或心跳。
4. 場景描寫用感官語言，讓讀者置身其中。
5. 第一人稱內心獨白要細膩：「他剛才碰了我的手……我是不是傻了？」
6. 每次輸出的敘事長度控制在 150～300 字之間。
7. 以情感懸念收尾，選項帶有情感推進的可能性。`.trim(),

  "龍傲天爽文風格": `
你是一個沉浸式文字冒險遊戲的敘事引擎，使用繁體中文，風格模仿龍傲天爽文網絡小說。
【爽文敘事規範】
1. 主角永遠強，被看不起就打臉，被欺負就反殺，每一場面都要爽到。
2. 反派囂張、嘴賤、傲慢，被主角打臉要寫得越慘越爽。
3. 對白氣勢十足：「你以為你是什麼東西？」「今天是你自己找死的。」
4. 升級、突破、獲得神器的場景要快、要爽，讓讀者看到金光閃閃。
5. 旁人的震驚和崇拜必不可少：「他……他怎麼可能這麼強！」
6. 每次輸出的敘事長度控制在 150～300 字之間。
7. 以爽感懸念收尾，讓讀者覺得下一段更精彩。`.trim(),

  "日常直白風格": `
你是一個沉浸式文字冒險遊戲的敘事引擎，使用繁體中文，日常直白風格。
【日常敘事規範】
1. 語言接地氣，像在跟朋友說話，不用文學修辭。
2. 場景直說，就寫發生了什麼，不賣弄，不鋪陳。
3. 對白自然，有時候語氣詞、口頭禪都可以。
4. 情緒直白：「我有點緊張」「這個人看起來不對勁」。
5. 每次輸出的敘事長度控制在 100～200 字之間，保持精簡。
6. 選項白話，直接說要做什麼，不文青。`.trim(),

  "情色成人風格": `
你是一個沉浸式文字冒險遊戲的敘事引擎，使用繁體中文，成人限制級慢熱風格（18+）。
【成人沉浸式慢熱敘事規範】
1. 慢熱原則：情慾需要自然升溫，不要直接跳進高潮。先描述環境、角色神情、衣著、氣息。在情境成熟前，保持在暗示與感官描寫的層面。
2. 感官先行：優先描寫觸感、溫度、呼吸聲、氣味——讓讀者感受到身體的存在，而不只是行為。
3. 衣著是敘事元素：衣物的狀態（正常→凌亂→散開）一步一步融入故事，每個狀態變化都有情境支撐。
4. 心理張力：寫出慾望與克制之間的拉鋸。角色的內心掙扎比外在行為更重要。
5. 慾望（Lust）體現為身體感官反應：心跳加速、臉頰發熱、呼吸變淺、腦中浮現的畫面。Lust越高，感官描述越細膩大膽。
6. 意志（Willpower）體現為克制力：意志越低，角色越難抗拒本能衝動或他人的誘惑，選擇更衝動或屈服。
7. 每次輸出的敘事長度控制在 150～300 字之間。
8. 以情慾懸念、情境升溫收尾，選項讓玩家決定繼續推進或抗拒。`.trim(),
};

const DEFAULT_STYLE = "九把刀風格";

// ── 世界觀提示 ────────────────────────────────────────────────────────────────

const WORLD_PROMPTS: Record<string, string> = {
  xian_xia:        `【世界觀：仙俠】\n修仙世界。靈力是命，道心是骨，宗門是背後的靠山或枷鎖。妖獸、魔修、天材地寶，每一樣都可能讓你暴富或暴斃。戰鬥要有重量感：劍氣、靈術、肉搏都行。`,
  campus:          `【世界觀：校園】\n高中或大學校園。考試壓力、社團、暗戀、霸凌。這個世界沒有魔法，但人心更複雜。要有「青春本來就很爛也很美好」的矛盾感。`,
  apocalypse:      `【世界觀：末日】\n文明崩潰，物資稀缺，人性扭曲，活下去才是唯一目標。飢餓是真實的，死亡是隨機的，信任是奢侈品。`,
  adult:           `【世界觀：成人】\n現實都市，成人視角。工作、感情、慾望、選擇。沒有正確答案，只有代價和結果。直白大膽，重點是情感張力。`,
  wuxia:           `【世界觀：武俠】\n江湖是規矩，也是陷阱。刀光劍影之間，快意恩仇，但背叛永遠比義氣更常見。武功是硬實力，江湖地位靠殺出來。`,
  western_fantasy: `【世界觀：西幻】\n古老大陸，魔法橫行。巨龍守著遺蹟，精靈記得舊恨，人類總是走在野心的邊緣。每個法術都有代價，每段冒險都埋著背叛。`,
  cyberpunk:       `【世界觀：賽博龐克】\n義體取代血肉，黑客撕裂現實。霓虹燈照不到的地方是真正的底層，企業比政府更有權力。每個人都在賣什麼，區別只在你願不願意知道。`,
  horror:          `【世界觀：怪談】\n規則存在是為了保命，禁忌存在是因為有人試過。深夜的恐懼不是來自外面，而是你已經踏進去了卻不知道。`,
  palace_intrigue: `【世界觀：宮鬥】\n皇宮是最精緻的籠子。每一句話都是刀，每一個笑都是佈局。位階決定生死，但智謀才是真正的武器。`,
  wasteland:       `【世界觀：廢土】\n文明的殘骸散落在荒原。變異體、拾荒者、殘存勢力在廢墟上重寫秩序。資源就是尊嚴，子彈就是貨幣。`,
  custom:          `【世界觀：自訂】\n依照遊戲當前設定背景進行敘事，保持一致性。`,
};

const URGENCY: Partial<Record<NarrativeHint, string>> = {
  CRITICAL_HP: `【緊急：HP 極危】\n主角快死了。每個動作都可能是最後一個，呼吸都是痛的。讓讀者感覺到死亡的重量。`,
  CRITICAL_FAIL: `【事件：關鍵失敗】\n這次行動徹底搞砸了。後果要寫清楚，不要含糊帶過。`,
  CRITICAL_SUCCESS: `【事件：完美成功】\n超乎預期的成功。寫出「幹，我真的做到了」的爽感，但帶點「這什麼鬼運氣」的困惑。`,
  HIGH_STRESS: `【狀態：極度壓力】\n主角的精神快繃斷了。決策可能有偏差，情緒可能失控。`,
};

const CLOTHING_LABELS: Record<string, string> = {
  normal: "正常",
  disheveled: "衣衫凌亂",
  partial: "衣物散亂",
  minimal: "衣不蔽體",
  bare: "赤裸",
};

const BODY_LABELS: Record<string, string> = {
  normal: "正常",
  flushed: "臉紅耳熱",
  sweaty: "汗如雨下",
  injured: "帶傷",
  exhausted: "精疲力竭",
  aroused: "慾火中燒",
};

export function buildSystemPrompt(params: {
  worldType: WorldType;
  narrativeHint: NarrativeHint;
  hp: number; hpMax: number;
  mp: number; mpMax: number;
  stress: number;
  charisma: number;
  tick: number;
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  location: string;
  envDesc: string;
  npcContext: string;
  personalityTags: string[];
  skills: string[];
  worldAttributes: Record<string, unknown>;
  legacyModifiers: Record<string, unknown>;
  narrativeSummary: string;
  generation: number;
}): string {
  const {
    worldType, narrativeHint, hp, hpMax, mp, mpMax, stress, charisma,
    tick, timeOfDay, weather, location, envDesc, npcContext,
    personalityTags, skills, worldAttributes, legacyModifiers,
    narrativeSummary, generation,
  } = params;

  // Use world_flavor from worldAttributes if present (for extended world types stored as "custom" in DB)
  const effectiveWorldType = (worldAttributes.world_flavor as string) ?? worldType;
  const worldPrompt = WORLD_PROMPTS[effectiveWorldType] ?? WORLD_PROMPTS.custom;
  const characterBio = worldAttributes.character_bio as string | undefined;

  // Writing style selection
  const writingStyleKey = (worldAttributes.writing_style as string) ?? DEFAULT_STYLE;
  const styleBase = WRITING_STYLES[writingStyleKey] ?? WRITING_STYLES[DEFAULT_STYLE];

  // Lust / Willpower / clothing / body status
  const lust = (worldAttributes.lust as number) ?? 50;
  const willpower = (worldAttributes.willpower as number) ?? 70;
  const clothingState = (worldAttributes.clothing_state as string) ?? "normal";
  const bodyStatus = (worldAttributes.body_status as string) ?? "normal";
  const clothingLabel = CLOTHING_LABELS[clothingState] ?? clothingState;
  const bodyLabel = BODY_LABELS[bodyStatus] ?? bodyStatus;
  const trackLust = writingStyleKey === "情色成人風格" || lust !== 50 || willpower !== 70;

  const hpRatio = hpMax > 0 ? Math.round((hp / hpMax) * 100) : 0;
  const urgencyBlock = URGENCY[narrativeHint] ?? "";
  const tagsStr = personalityTags.length ? personalityTags.join("、") : "平凡人";
  const skillsStr = skills.length ? skills.join("、") : "無特殊技能";

  // 傳承修正提示
  const legacyHints: string[] = [];
  const affBonus = (legacyModifiers.affection_bonus ?? {}) as Record<string, number>;
  const skillBonus = (legacyModifiers.skill_bonus ?? {}) as Record<string, number>;
  Object.entries(affBonus).forEach(([npc, v]) => legacyHints.push(`前世與【${npc}】有過淵源（好感 ${v > 0 ? "+" : ""}${v}）`));
  Object.entries(skillBonus).forEach(([s, v]) => legacyHints.push(`前世留下的【${s}】殘留記憶（加成 ${v > 0 ? "+" : ""}${v}）`));
  const legacyStr = legacyHints.length ? legacyHints.join("；") : "無前世傳承";

  // Filter worldAttrs for display — exclude internal fields
  const INTERNAL_KEYS = new Set(["world_flavor", "character_bio", "writing_style", "lust", "willpower", "clothing_state", "body_status"]);
  const worldAttrsStr = Object.entries(worldAttributes)
    .filter(([k]) => !INTERNAL_KEYS.has(k))
    .map(([k, v]) => `- ${k}：${v}`)
    .join("\n") || "（無特殊屬性）";

  const lustBlock = trackLust ? `
【慾望與意志】
- 慾望（Lust）：${lust}/100 — ${lust >= 80 ? "極度渴望，感官敏銳至極" : lust >= 60 ? "慾火湧動，難以冷靜" : lust >= 40 ? "心中有所感動" : "平靜，慾念輕微"}
- 意志（Willpower）：${willpower}/100 — ${willpower >= 80 ? "意志堅定，理智清晰" : willpower >= 50 ? "尚能克制，但有動搖" : willpower >= 25 ? "克制力薄弱，容易動搖" : "意志瓦解，難以抗拒衝動"}
- 衣著狀態：${clothingLabel}
- 身體狀態：${bodyLabel}` : "";

  return `${styleBase}

${worldPrompt}
${characterBio ? `\n【玩家角色設定】\n${characterBio}\n（請依照此設定塑造主角，並在敘事中融入這些背景細節。）` : ""}
${urgencyBlock ? "\n" + urgencyBlock : ""}

═══════════════ 當前狀態快照 ═══════════════
【時間】第 ${generation} 世 | Tick ${tick} | ${timeOfDay} | ${weather}
【地點】${location}
【環境】${envDesc}

【主角屬性】
- HP：${hp}/${hpMax}（${hpRatio}%）
- MP：${mp}/${mpMax}
- 壓力：${stress}/100
- 魅力：${charisma}
- 個性標籤：${tagsStr}
- 技能：${skillsStr}
- 傳承記憶：${legacyStr}
${lustBlock}

【世界觀特殊屬性】
${worldAttrsStr}

【已知 NPC 狀態】
${npcContext}

【故事記憶摘要】
${narrativeSummary || "冒險剛剛開始。"}
═══════════════════════════════════════════

你的任務：
1. 用${writingStyleKey}寫出這一回合的敘事（${writingStyleKey === "日常直白風格" ? "100~200" : "150~300"} 字）。
   如有重大 NPC 登場，在敘事中插入 【奇遇NPC：NPC名字】標籤。
   如有突發危機或命運轉折，插入 【突發狀況：事件摘要】標籤。
   ${trackLust ? "衣著與身體狀態若有變化，要自然地融入敘事描寫中。" : ""}
2. 給出 3～4 個行動選項。格式：
   【行動標題（4字以內）】一句話描述動機與細節（20字以內）
   若此行動有顯著的慾望/意志/HP/MP/名聲風險或收益，在描述後加上風險標注：
   | ⚠ 慾望+15（只在變化顯著時加入，不要每個選項都加）
   例如：【順勢靠近】讓他抱著自己，感受他的溫度 | ⚠ 慾望+20 意志-10
3. 輸出一個 JSON 區塊（包在 \`\`\`json ... \`\`\` 內）：
{
  "narrative": "敘事文字",
  "choices": ["【標題】細節描述", "【標題】細節 | ⚠ 慾望+15", "【標題】細節描述"],
  "imagePrompt": "16-bit pixel art, retro gaming, vibrant colors, [英文場景描述，不超過20字]",
  "useSafeImage": true,
  "npcUpdates": [{"name": "NPC名", "affectionDelta": 0, "reactionText": "NPC反應"}],
  "stateChanges": {
    "hpDelta": 0, "mpDelta": 0, "stressDelta": 0,
    "lustDelta": 0, "willpowerDelta": 0,
    "clothingState": "${clothingState}",
    "bodyStatus": "${bodyStatus}",
    "location": "${location}", "ticksConsumed": 1
  }
}

useSafeImage 規則：含暴力/血腥/成人內容設 false，否則設 true。
clothingState 可選值：normal / disheveled / partial / minimal / bare
bodyStatus 可選值：normal / flushed / sweaty / injured / exhausted / aroused`;
}
