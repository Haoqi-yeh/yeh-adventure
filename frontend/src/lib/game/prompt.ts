import { WorldType, TimeOfDay, WeatherType, NarrativeHint } from "./types";

// ── 1. 文筆風格定義  ──────────────────────────────────────────

const WRITING_STYLES: Record<string, string> = {
  "小說風格": `
你是一個沉浸式文字冒險遊戲的敘事引擎，使用繁體中文。風格：節奏明快、對話熱血直白，充滿少年意氣的快節奏敘事。
【敘事規範】
1. 節奏是靈魂。短句、短段，讓每一行都有衝擊感。切忌拖沓。
2. 對白熱血直白，有少年意氣——說話就是衝，不拐彎，不矯情。
3. 動作場面要讓讀者的心跳跟著加速，動詞精準、力道十足。
4. 場景三行內建立畫面，不鋪廢話，每個細節都推動節奏。
5. 敘事結尾停在「決斷點」——NPC 動作或環境變化，讓讀者感受到下一步的壓力。
6. 敘事長度 150～300 字，以懸念或熱血高點收尾。`.trim(),

  "言情小說風格": `
你是一個沉浸式文字冒險遊戲的敘事引擎，使用繁體中文。風格：情感描寫細膩入微，專注於眼神交會與感官張力。
【敘事規範】
1. 每個場景的核心是「情感張力」——即使普通對話，也要讓讀者感受到暗流湧動。
2. 眼神交會是最強武器：「他低頭的一瞬間，睫毛的陰影落在臉頰上。」描寫對方的外貌細節，不替主角詮釋感受。
3. 感官具體化：NPC 的聲音低沉、呼吸節奏、手指的動作——用這些細節製造張力，讓讀者自己心跳加速。
4. 對白要撩——一句話能讓人心軟或心慌，不說破但字字有意。
5. 敘事最後停在一個 NPC 的動作或眼神——讓讀者必須決定下一步才能知道結果。
6. 敘事長度 150～300 字，以情感懸念或心動瞬間收尾。`.trim(),

  "龍傲天爽文風格": `
你是一個沉浸式文字冒險遊戲的敘事引擎，使用繁體中文。風格：天之驕子龍傲天，專注於打臉反殺與無敵主宰的暢快感。
【敘事規範】
1. 主角是天之驕子——每一次被輕視，都是為了更狠的打臉準備。
2. 反殺必須爽：節奏要在反派最囂張的那一刻急轉直下，讓讀者看到碾壓。
3. 反派必須夠蠢夠狂：「你有什麼資格——」話沒說完就已經跪了。
4. 旁觀者的震驚是標配：「那是……那怎麼可能！」「他到底是什麼人！」
5. 突破/升級/獲得神物的場面要讓讀者覺得爽到冒煙，金光萬丈毫不含糊。
6. 主宰感要貫穿全文——主角說的每句話都是降維打擊。
7. 敘事長度 150～300 字，以爽感高點或下一個更大的挑戰收尾。`.trim(),

  "日常直白風格": `
你是一個沉浸式文字冒險遊戲的敘事引擎，使用繁體中文。風格：語言親切接地氣，如同日常敘事，讀起來輕鬆無壓力。
【敘事規範】
1. 像在跟朋友說話，不賣弄文學，不使用文青腔調。
2. 場景直說——發生什麼就寫什麼，不拐彎、不鋪陳。
3. 對白自然，語氣詞和口頭禪都歡迎：「對啦」「然後呢」「這樣啊……」
4. 描寫周圍環境和 NPC 的行為，不替主角詮釋情緒或決定。
5. 敘事長度 100～200 字，停在一個開放的時刻，讓玩家決定怎麼做。
6. 選項白話，直接說要做什麼。`.trim(),

  "情色成人風格": `
你是一個沉浸式文字冒險遊戲的敘事引擎，使用繁體中文，成人限制級（18+）。風格：筆觸大膽肆意，深度刻畫慾望流動與充滿張力的感官互動。
【敘事規範】
1. 大膽肆意：不迴避慾望的存在，直面情慾流動，用精準的語言刻畫感官細節。
2. 感官深度優先：觸感（布料的滑動、皮膚的溫度差）、聲音（呼吸的頻率、NPC 聲音的顫抖）、氣息（距離縮短時的氣味）——讓讀者的身體也有反應。
3. 慾望是流動的：描寫 NPC 的掙扎、動搖、主動或退縮，透過外在行為和語氣讓張力升溫，不替主角詮釋感受。
4. 衣著與身體狀態是敘事元素，狀態的每次變化都要有情境支撐，自然融入而非直白列舉。
5. 環境張力：溫度、燈光、氣味、聲音——場景本身要有官能刺激，不依賴心理獨白。
6. 慾望（Lust）越高，描寫越大膽細膩；意志（Willpower）越低，NPC 越難抗拒衝動，場景越失控。
7. 敘事長度 150～300 字，以情慾懸念或張力高點收尾，停在主角面臨選擇的決斷點。`.trim(),
};

const DEFAULT_STYLE = "小說風格";

// ── 2. 世界觀術語體系  ───────────────────────────────────────────────

const WORLD_TERMINOLOGY: Record<string, string> = {
  xian_xia: "成長用「境界（煉氣/築基/金丹/元嬰）、靈根、道心、悟性」；資源用「靈石、靈草、法寶、功法秘籍、丹藥」；組織用「宗門、散修、魔道、長老、弟子」；戰鬥用「靈力、法術、飛劍、神識、靈壓」。禁止使用等級、HP、魔法、技能點等遊戲術語。",
  wuxia: "成長用「內力（一成/三成/純青）、武功境界、輕功、暗器、心法」；資源用「銀兩、江湖情報、武器、恩情、秘笈」；組織用「門派、江湖勢力、幫派、官府、黑道」；戰鬥用「招式、內勁、點穴、輕功身法」。禁止使用現代語言或超自然魔法。",
  apocalypse: "成長用「異能（覺醒/強化/等級）、生存技能、戰鬥能力」；資源用「物資、彈藥、藥品、食物、燃料、情報」；組織用「據點、倖存者聯盟、派系、軍閥」；威脅用「喪屍、變異體、異能者、匪徒」。禁止使用修仙或魔法術語。",
  western_fantasy: "成長用「等級、魔法熟練、法術環階、聲望、技能」；資源用「金幣、魔法材料、裝備、法術卷軸、遺物」；組織用「冒險者公會、王國、精靈族、矮人族、教會」；戰鬥用「咒語、神術、物理技能、魔法陣」。",
  cyberpunk: "成長用「義體等級、駭客技術、街頭聲望、企業評級」；資源用「信用點、義體零件、晶片、數據碎片、黑市情報」；組織用「企業、底層幫派、黑客集團、地下市場」；戰鬥用「義體武裝、神經接口、電磁脈衝、駭入」。",
  campus: "成長用「成績（GPA/排名）、社團地位、人緣、特長、自信心」；資源用「零用錢、人脈、秘密、時間、信任」；組織用「班級、社團、學生會、老師、家長」。禁止引入任何超自然元素。",
  adult: "成長用「職位晉升、財富累積、人脈拓展、情感深度、自我認知」；資源用「金錢、時間、信任、機會、人脈關係」；組織用「公司、家族、朋友圈、業界圈子」。語言寫實，貼近現代都市生活。",
  horror: "成長用「異常認知程度、靈覺、規則掌握度、心理承受力」；資源用「護身符、情報、儀式材料、神智值」；敵對存在用「靈異現象、詛咒、未知規則、異界存在」。",
  palace_intrigue: "成長用「位階、聖眷、勢力範圍、謀略聲望」；資源用「金帛、情報、人情、侍從忠誠、秘密」；組織用「各宮派系、太監首領、宮廷御醫、朝臣」；行動用「賜恩、打壓、聯盟、下毒、誣陷」。",
  wasteland: "成長用「廢土等級、身體改造、特殊能力、部族地位」；資源用「廢鐵、食物、清水、燃料、武器彈藥」；組織用「部族、軍閥、拾荒者商隊、廢土傳說人物」。",
  taiwanese_folk: "成長用「功德、法力值、神緣、天命、神契等級」；技能用「符籙、指法、五營神將、法繩/法索、踏罡步斗、押煞」；威脅用「魔神仔、冤魂、地縛靈、外道、煞氣、邪神」。",
};

// ── 3. 世界觀提示  ────────────────────────────────────────────────────────────────

const WORLD_PROMPTS: Record<string, string> = {
  xian_xia: `【世界觀：仙俠】\n修仙世界。靈力是命，道心是骨，宗門是背後的靠山或枷鎖。妖獸、魔修、天材地寶，每一樣都可能讓你暴富或暴斃。`,
  campus: `【世界觀：校園】\n高中或大學校園。考試壓力、社團、暗戀、霸凌、同儕壓力。這個世界沒有魔法、沒有古代文物、沒有修仙物件——所有衝突都來自人心。`,
  apocalypse: `【世界觀：末日】\n文明崩潰，物資稀缺，人性扭曲，活下去才是唯一目標。飢餓是真實的，死亡是隨機的，信任是奢侈品。`,
  adult: `【世界觀：成人】\n現實都市，成人視角。工作、感情、慾望、選擇。沒有正確答案，只有代價和結果。直白大膽，重點是情感張力。`,
  wuxia: `【世界觀：武俠】\n江湖是規矩，也是陷阱。刀光劍影之間，快意恩仇，但背叛永遠比義氣更常見。武功是硬實力，江湖地位靠殺出來。`,
  western_fantasy: `【世界觀：西幻】\n古老大陸，魔法橫行。巨龍守著遺蹟，精靈記得舊恨，人類總是走在野心的邊緣。每個法術都有代價，每段冒險都埋著背叛。`,
  cyberpunk: `【世界觀：賽博龐克】\n義體取代血肉，黑客撕裂現實。霓虹燈照不到的地方是真正的底層，企業比政府更有權力。`,
  horror: `【世界觀：怪談】\n規則存在是為了保命，禁忌存在是因為有人試過。深夜的恐懼不是來自外面，而是你已經踏進去了卻不知道。`,
  palace_intrigue: `【世界觀：宮鬥】\n皇宮是最精緻的籠子。每一句話都是刀，每一個笑都是佈局。位階決定生死，但智謀才是真正的武器。`,
  wasteland: `【世界觀：廢土】\n文明的殘骸散落在荒原。變異體、拾荒者、殘存勢力在廢墟上重寫秩序。資源就是尊嚴，子彈就是貨幣。`,
  taiwanese_folk: `【世界觀：台式都市傳說】\n現代台灣。神、魔、人三界共存於都市陰影中。筆法模仿星子風格，強調草根江湖義氣。`,
  custom: `【世界觀：自訂】\n依照遊戲當前設定背景進行敘事，保持一致性。`,
};

// ── 4. 核心標籤與標題  ────────────────────────────────────────────────────────────────

const URGENCY: Partial<Record<NarrativeHint, string>> = {
  CRITICAL_HP: `【緊急：HP 極危】\n主角快死了。每個動作都可能是最後一個，呼吸都是痛的。讓讀者感覺到死亡的重量。`,
  CRITICAL_FAIL: `【事件：關鍵失敗】\n這次行動徹底搞砸了。後果要寫清楚，不要含糊帶過。`,
  CRITICAL_SUCCESS: `【事件：完美成功】\n超乎預期的成功。寫出「幹，我真的做到了」的爽感。`,
  HIGH_STRESS: `【狀態：極度壓力】\n主角的精神快繃斷了。`,
};

const CLOTHING_LABELS: Record<string, string> = { normal: "正常", disheveled: "衣衫凌亂", partial: "衣物散亂", minimal: "衣不蔽體", bare: "赤裸" };
const BODY_LABELS: Record<string, string> = { normal: "正常", flushed: "臉紅耳熱", sweaty: "汗如雨下", injured: "帶傷", exhausted: "精疲力竭", aroused: "慾火中燒", poisoned: "中毒", inner_injured: "內傷", bleeding: "失血", fever: "發燒", starving: "飢餓", possessed: "附身", cursed: "詛咒", drunk: "醉酒", medicated: "藥效中", paralyzed: "麻痺" };

// ── 5. System Prompt 生成邏輯  ───────────────────────────────────────

export function buildSystemPrompt(params: {
  worldType: WorldType; playerName: string; narrativeHint: NarrativeHint;
  hp: number; hpMax: number; mp: number; mpMax: number;
  stress: number; charisma: number; tick: number; timeOfDay: TimeOfDay; weather: WeatherType;
  location: string; envDesc: string; npcContext: string;
  personalityTags: string[]; skills: string[];
  worldAttributes: Record<string, unknown>;
  legacyModifiers: Record<string, unknown>;
  narrativeSummary: string; generation: number;
}): string {
  const { worldType, playerName, narrativeHint, hp, hpMax, mp, mpMax, stress, charisma, tick, timeOfDay, weather, location, envDesc, npcContext, personalityTags, skills, worldAttributes, legacyModifiers, narrativeSummary, generation } = params;

  const effectiveWorldType = (worldAttributes.world_flavor as string) ?? worldType;
  const worldPrompt = WORLD_PROMPTS[effectiveWorldType] ?? WORLD_PROMPTS.custom;
  const characterBio = worldAttributes.character_bio as string | undefined;
  const writingStyleKey = (worldAttributes.writing_style as string) ?? DEFAULT_STYLE;
  const styleBase = WRITING_STYLES[writingStyleKey] ?? WRITING_STYLES[DEFAULT_STYLE];
  const gender = (worldAttributes.gender as string) ?? null;
  const lust = (worldAttributes.lust as number) ?? 50;
  const willpower = (worldAttributes.willpower as number) ?? 70;
  const clothingState = (worldAttributes.clothing_state as string) ?? "normal";
  const bodyStatus = (worldAttributes.body_status as string) ?? "normal";
  
  const hpRatio = hpMax > 0 ? Math.round((hp / hpMax) * 100) : 0;
  const tagsStr = personalityTags.length ? personalityTags.join("、") : "平凡人";
  const skillsStr = skills.length ? skills.join("、") : "無特殊技能";

  // 傳承修正
  const legacyHints: string[] = [];
  const affBonus = (legacyModifiers.affection_bonus ?? {}) as Record<string, number>;
  Object.entries(affBonus).forEach(([npc, v]) => legacyHints.push(`前世與【${npc}】淵源(${v > 0 ? "+" : ""}${v})`));
  const legacyStr = legacyHints.length ? legacyHints.join("；") : "無";

  // 逆天改命特質
  const rawTraits = worldAttributes.traits as Array<{ id: string; rarity: string; name: string; effect: string }> | undefined;
  const traitsBlock = rawTraits?.length ? `\n【逆天改命特質】\n${rawTraits.map(t => `• 「${t.name}」— ${t.effect}`).join("\n")}` : "";

  // 內部欄位過濾
  const INTERNAL_KEYS = new Set(["world_flavor", "character_bio", "writing_style", "gender", "lust", "willpower", "clothing_state", "body_status", "scenario_hook", "traits"]);
  const worldAttrsStr = Object.entries(worldAttributes)
    .filter(([k]) => !INTERNAL_KEYS.has(k))
    .map(([k, v]) => `- ${k}：${v}`)
    .join("\n") || "（無）";

  return `${styleBase}

${worldPrompt}
${WORLD_TERMINOLOGY[effectiveWorldType] ? `\n【世界觀術語規範】\n${WORLD_TERMINOLOGY[effectiveWorldType]}` : ""}

【玩家角色設定】
主角姓名：${playerName}
${characterBio || "自動生成一個鮮明的主角。"}
${traitsBlock}

═══════════════ 當前狀態快照 ═══════════════
【時間】第 ${generation} 世 | Tick ${tick} | ${timeOfDay} | ${weather}
【地點】${location} | 環境：${envDesc}
【屬性】HP：${hp}/${hpMax} | MP：${mp}/${mpMax} | 壓力：${stress}/100
【加成】個性：${tagsStr} | 技能：${skillsStr} | 傳承：${legacyStr}
【慾望】Lust: ${lust} | Willpower: ${willpower} | 衣著: ${CLOTHING_LABELS[clothingState]}
【世界屬性】\n${worldAttrsStr}
【已知 NPC】${npcContext}
【故事摘要】${narrativeSummary || "冒險開始。"}
═══════════════════════════════════════════

【輸出鐵則】
1. 禁止描寫主角內心想法，禁止代為行動，敘事停在決斷點。
2. 必須以 JSON 格式結尾。
3. JSON 的 choices 陣列必須根據當前故事內容動態生成，禁止使用重複的模板。
4. imagePrompt 必須鎖定 8-bit pixel art, GBA pokemon emerald style 風格。

\`\`\`json
{
  "narrative": "【情境演繹】文字...\\n\\n【當前資訊更新】文字",
  "choices": ["根據場景生成動態選項1", "根據場景生成動態選項2", "根據場景生成動態選項3"],
  "imagePrompt": "8-bit pixel art, ${WORLD_IMAGE_STYLE[effectiveWorldType] || "adventure scene"}, sharp pixel edges, vibrant colors, GBA style, [場景具體英文描述, 10字內]",
  "useSafeImage": true,
  "npcUpdates": [],
  "stateChanges": { "ticksConsumed": 1, "location": "${location}" }
}
\`\`\``;
}

// ── 6. 視覺風格鎖定  ──────────────────────────────────────────────────

export const WORLD_IMAGE_STYLE: Record<string, string> = {
  xian_xia: "8-bit pixel art, GBA pokemon emerald style, ancient sect, misty mountains, jade buildings, sharp edges",
  campus: "8-bit pixel art, GBA style, japanese high school classroom, cherry blossoms, sunlight through windows, flat colors, hard edges",
  apocalypse: "8-bit pixel art, GBA style, ruined urban city, vines, rusty metal, 16-bit JRPG background, crisp edges",
  adult: "8-bit pixel art, GBA style, modern bedroom interior, warm lighting, flat pixel art, saturated colors",
  wuxia: "8-bit pixel art, GBA style, ancient tavern, bamboo forest, red lanterns, 16-bit retro RPG scene",
  western_fantasy: "8-bit pixel art, GBA pokemon style, castle courtyard, medieval town, forest, flat colors, sharp edges",
  cyberpunk: "8-bit pixel art, GBA style, neon city alley, rain, pixel signs, futuristic JRPG aesthetic",
  horror: "8-bit pixel art, GBA style, dark abandoned hospital, eerie shadows, limited color palette, 16-bit horror JRPG",
  palace_intrigue: "8-bit pixel art, GBA style, golden imperial palace, red silk, ornate court, vibrant flat colors",
  wasteland: "8-bit pixel art, GBA style, desert dunes, rusted machinery, red sky, sharp pixel grid",
  taiwanese_folk: "8-bit pixel art, GBA style, traditional taiwanese temple, red lanterns, night streets, retro JRPG style",
  custom: "8-bit pixel art, GBA style, classic JRPG adventure scene",
};

function getWorldStatusHint(worldType: string): string {
  const hints: Record<string, string> = {
    xian_xia: "境界：煉氣三層（+1）｜靈力：48/80｜習得：【御氣術】",
    campus: "成績：B+｜社團地位：成員｜人緣：+1",
  };
  return hints[worldType] ?? "記錄主角成長與資源動態。";
}
