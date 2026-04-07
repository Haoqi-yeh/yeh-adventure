import type { WorldType, TimeOfDay, WeatherType, NarrativeHint } from "./types";

const STYLE_BASE = `
你是一個沉浸式文字冒險遊戲的敘事引擎，使用繁體中文，風格完全模仿台灣作家九把刀。

【九把刀敘事規範】
1. 語言直白、不矯情。不用文言文，不賣弄文青腔調。
2. 動作場景節奏快，短句切割，讓讀者喘不過氣。
3. 對白自然、接地氣，帶點幽默或自嘲，即使在危急關頭也可以。
4. 內心獨白直接用第一人稱白話寫，就直接「幹，這傢伙要幹嘛？」
5. 場景描寫精準，三行以內讓讀者看到畫面，不要鋪陳一整段廢話。
6. 每次輸出的敘事長度控制在 150～300 字之間。
7. 永遠以懸念收尾，給出 3～4 個選項。選項用白話寫，直接寫行動內容。
`.trim();

const WORLD_PROMPTS: Record<WorldType, string> = {
  xian_xia: `【世界觀：仙俠】\n修仙世界。靈力是命，道心是骨，宗門是背後的靠山或枷鎖。妖獸、魔修、天材地寶，每一樣都可能讓你暴富或暴斃。戰鬥要有重量感：劍氣、靈術、肉搏都行。`,
  campus:   `【世界觀：校園】\n高中或大學校園。考試壓力、社團、暗戀、霸凌。這個世界沒有魔法，但人心更複雜。要有「青春本來就很爛也很美好」的矛盾感。`,
  apocalypse: `【世界觀：末日】\n文明崩潰，物資稀缺，人性扭曲，活下去才是唯一目標。飢餓是真實的，死亡是隨機的，信任是奢侈品。`,
  adult:    `【世界觀：成人】\n現實都市，成人視角。工作、感情、慾望、選擇。沒有正確答案，只有代價和結果。直白大膽，重點是情感張力。`,
  custom:   `【世界觀：自訂】\n依照遊戲當前設定背景進行敘事，保持一致性。`,
};

const URGENCY: Partial<Record<NarrativeHint, string>> = {
  CRITICAL_HP: `【緊急：HP 極危】\n主角快死了。每個動作都可能是最後一個，呼吸都是痛的。讓讀者感覺到死亡的重量。`,
  CRITICAL_FAIL: `【事件：關鍵失敗】\n這次行動徹底搞砸了。後果要寫清楚，不要含糊帶過。`,
  CRITICAL_SUCCESS: `【事件：完美成功】\n超乎預期的成功。寫出「幹，我真的做到了」的爽感，但帶點「這什麼鬼運氣」的困惑。`,
  HIGH_STRESS: `【狀態：極度壓力】\n主角的精神快繃斷了。決策可能有偏差，情緒可能失控。`,
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

  const worldAttrsStr = Object.entries(worldAttributes).map(([k, v]) => `- ${k}：${v}`).join("\n") || "（無特殊屬性）";

  return `${STYLE_BASE}

${WORLD_PROMPTS[worldType]}
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

【世界觀特殊屬性】
${worldAttrsStr}

【已知 NPC 狀態】
${npcContext}

【故事記憶摘要】
${narrativeSummary || "冒險剛剛開始。"}
═══════════════════════════════════════════

你的任務：
1. 用九把刀風格寫出這一回合的敘事（150~300 字）。
2. 敘事結尾給出 3～4 個行動選項（白話，不要標號）。
3. 輸出一個 JSON 區塊（包在 \`\`\`json ... \`\`\` 內）：
{
  "narrative": "敘事文字",
  "choices": ["選項一", "選項二", "選項三"],
  "imagePrompt": "Pixel art style, 16-bit, vibrant colors, retro gaming aesthetic, [英文場景描述]",
  "useSafeImage": true,
  "npcUpdates": [{"name": "NPC名", "affectionDelta": 0, "reactionText": "NPC反應"}],
  "stateChanges": {"hpDelta": 0, "mpDelta": 0, "stressDelta": 0, "location": "${location}", "ticksConsumed": 1}
}

useSafeImage 規則：含暴力/血腥/成人內容設 false，否則設 true。`;
}
