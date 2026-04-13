import { WorldType, TimeOfDay, WeatherType, NarrativeHint } from "./types";

// ── 文筆風格 ──────────────────────────────────────────────────────────────────

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

// ── 世界觀術語體系 ───────────────────────────────────────────────────────────────

const WORLD_TERMINOLOGY: Record<string, string> = {
  xian_xia: "成長用「境界（煉氣/築基/金丹/元嬰）、靈根、道心、悟性」；資源用「靈石、靈草、法寶、功法秘籍、丹藥」；組織用「宗門、散修、魔道、長老、弟子」；戰鬥用「靈力、法術、飛劍、神識、靈壓」。禁止使用等級、HP、魔法、技能點等遊戲術語。",
  wuxia: "成長用「內力（一成/三成/純青）、武功境界、輕功、暗器、心法」；資源用「銀兩、江湖情報、武器、恩情、秘笈」；組織用「門派、江湖勢力、幫派、官府、黑道」；戰鬥用「招式、內勁、點穴、輕功身法」。禁止使用現代語言或超自然魔法。",
  apocalypse: "成長用「異能（覺醒/強化/等級）、生存技能、戰鬥能力」；資源用「物資、彈藥、藥品、食物、燃料、情報」；組織用「據點、倖存者聯盟、派系、軍閥」；威脅用「喪屍、變異體、異能者、匪徒」。禁止使用修仙或魔法術語。",
  western_fantasy: "成長用「等級、魔法熟練、法術環階、聲望、技能」；資源用「金幣、魔法材料、裝備、法術卷軸、遺物」；組織用「冒險者公會、王國、精靈族、矮人族、教會」；戰鬥用「咒語、神術、物理技能、魔法陣」。",
  cyberpunk: "成長用「義體等級、駭客技術、街頭聲望、企業評級」；資源用「信用點、義體零件、晶片、數據碎片、黑市情報」；組織用「企業、底層幫派、黑客集團、地下市場」；戰鬥用「義體武裝、神經接口、電磁脈衝、駭入」。",
  campus: "成長用「成績（GPA/排名）、社團地位、人緣、特長、自信心」；資源用「零用錢、人脈、秘密、時間、信任」；組織用「班級、社團、學生會、老師、家長」。禁止引入任何超自然元素。【物件嚴格限制】所有道具、物品必須是現代校園場景可能出現的東西（手機、筆記本、隨身碟、球鞋、耳機等）；絕對禁止出現：玉佩、靈石、法寶、符文、古玩、功法、秘籍、神器、江湖物件、歷史文物等任何非現代校園物品。",
  adult: "成長用「職位晉升、財富累積、人脈拓展、情感深度、自我認知」；資源用「金錢、時間、信任、機會、人脈關係」；組織用「公司、家族、朋友圈、業界圈子」。語言寫實，貼近現代都市生活。",
  horror: "成長用「異常認知程度、靈覺、規則掌握度、心理承受力」；資源用「護身符、情報、儀式材料、神智值」；敵對存在用「靈異現象、詛咒、未知規則、異界存在」。氣氛壓抑，資訊不完整，未知比已知更恐怖。",
  palace_intrigue: "成長用「位階（才人/嬪/妃/貴妃）、聖眷、勢力範圍、謀略聲望」；資源用「金帛、情報、人情、侍從忠誠、秘密」；組織用「各宮派系、太監首領、宮廷御醫、朝臣」；行動用「賜恩、打壓、聯盟、下毒、誣陷」。",
  wasteland: "成長用「廢土等級、身體改造、特殊能力、部族地位」；資源用「廢鐵、食物、清水、燃料、武器彈藥」；組織用「部族、軍閥、拾荒者商隊、廢土傳說人物」；威脅用「變異體、匪徒、輻射、極端天氣」。",
  taiwanese_folk: "成長用「功德、法力值、神緣、天命、神契等級」（禁止使用修為/境界/靈力）；技能用「符籙、指法、五營神將、法繩/法索、踏罡步斗、押煞」；威脅用「魔神仔、冤魂、地縛靈、外道、煞氣、邪神」；組織用「宮廟、乩壇、神軍、廟公、同門兄弟、神明指示」；禁止使用：靈力、內力、境界、魔法、法術等非台式術語。",
};

// ── 世界觀提示 ────────────────────────────────────────────────────────────────

const WORLD_PROMPTS: Record<string, string> = {
  xian_xia: `【世界觀：仙俠】\n修仙世界。靈力是命，道心是骨，宗門是背後的靠山或枷鎖。妖獸、魔修、天材地寶，每一樣都可能讓你暴富或暴斃。`,
  campus: `【世界觀：校園】\n高中或大學校園。考試壓力、社團、暗戀、霸凌。所有衝突都來自人心。不得混入任何非現代校園物品。`,
  apocalypse: `【世界觀：末日】\n文明崩潰，物資稀缺，人性扭曲。飢餓是真實的，死亡是隨機的。`,
  adult: `【世界觀：成人】\n現實都市，成人視角。工作、感情、慾望。重點是情感張力。`,
  wuxia: `【世界觀：武俠】\n江湖是規矩，也是陷阱。刀光劍影之間，快意恩仇。`,
  western_fantasy: `【世界觀：西幻】\n古老大陸，魔法橫行。巨龍守著遺蹟，精靈記得舊恨。`,
  cyberpunk: `【世界觀：賽博龐克】\n義體取代血肉，黑客撕裂現實。霓虹燈照不到的地方是真正的底層。`,
  horror: `【世界觀：怪談】\n規則存在是為了保命。深夜的恐懼不是來自外面，而是你已經踏進去了。`,
  palace_intrigue: `【世界觀：宮鬥】\n皇宮是最精緻的籠子。每一句話都是刀，每一個笑都是佈局。`,
  wasteland: `【世界觀：廢土】\n文明的殘骸散落在荒原。資源就是尊嚴，子彈就是貨幣。`,
  taiwanese_folk: `【世界觀：台式都市傳說】\n現代台灣。筆法模仿星子風格，強調草根江湖義氣與神明信仰。`,
  custom: `【世界觀：自訂】\n依照遊戲當前背景進行敘事。`,
};

const URGENCY: Partial<Record<NarrativeHint, string>> = {
  CRITICAL_HP: `【緊急：HP 極危】\n主角快死了。呼吸都是痛的。讓讀者感覺到死亡的重量。`,
  CRITICAL_FAIL: `【事件：關鍵失敗】\n行動徹底搞砸了。`,
  CRITICAL_SUCCESS: `【事件：完美成功】\n超乎預期的成功。寫出「幹，我真的做到了」的爽感。`,
  HIGH_STRESS: `【狀態：極度壓力】\n主角的精神快繃斷了。`,
};

const CLOTHING_LABELS: Record<string, string> = { normal: "正常", disheveled: "衣衫凌亂", partial: "衣物散亂", minimal: "衣不蔽體", bare: "赤裸" };
const BODY_LABELS: Record<string, string> = { normal: "正常", flushed: "臉紅耳熱", sweaty: "汗如雨下", injured: "帶傷", exhausted: "精疲力竭", aroused: "慾火中燒", poisoned: "中毒", inner_injured: "內傷", bleeding: "失血", fever: "發燒", starving: "飢餓", possessed: "附身", cursed: "詛咒", drunk: "醉酒", medicated: "藥效中", paralyzed: "麻痺" };

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
  const trackLust = writingStyleKey === "情色成人風格" || lust !== 50 || willpower !== 70;
  const hpRatio = hpMax > 0 ? Math.round((hp / hpMax) * 100) : 0;
  const urgencyBlock = URGENCY[narrativeHint] ?? "";
  const scenarioHook = tick <= 1 ? (worldAttributes.scenario_hook as string | undefined) : undefined;
  
  // Traits 
  const rawTraits = worldAttributes.traits as Array<{ id: string; rarity: string; name: string; effect: string }> | undefined;
  const traitsBlock = rawTraits?.length ? `\n【逆天改命特質】\n${rawTraits.map(t => `• 「${t.name}」— ${t.effect}`).join("\n")}` : "";

  return `${styleBase}

${worldPrompt}
${WORLD_TERMINOLOGY[effectiveWorldType] ? `\n【世界觀術語規範】\n${WORLD_TERMINOLOGY[effectiveWorldType]}` : ""}

【玩家角色設定】
主角姓名：${playerName}（全程固定，不可遺忘）
${characterBio || `生成一個性格鮮明、有核心衝突的主角。名字固定為「${playerName}」。`}

${traitsBlock}
${scenarioHook ? `\n【本局開場靈感】\n${scenarioHook}` : ""}
${urgencyBlock ? "\n" + urgencyBlock : ""}

═══════════════ 當前狀態快照 ═══════════════
【時間】第 ${generation} 世 | Tick ${tick} | ${timeOfDay} | ${weather}
【地點】${location}
【環境】${envDesc}
【主角】HP:${hp}/${hpMax} | MP:${mp}/${mpMax} | 壓力:${stress} | 魅力:${charisma}${gender ? ` | 性別:${gender}` : ""}
${trackLust ? `- 慾望/意志：${lust}/${willpower} | 衣著:${CLOTHING_LABELS[clothingState]} | 身體:${BODY_LABELS[bodyStatus]}` : ""}
【NPC】${npcContext}
【摘要】${narrativeSummary || "冒險開始。"}
═══════════════════════════════════════════

【鐵則：玩家主權】
1. 禁止描寫主角的心理活動（想法、感受、猶豫）。
2. 禁止替主角做出行動。AI 僅呈現外部環境與 NPC 反應。
3. 敘事必須以「決斷點」收尾。

你的回應格式：

【情境演繹】
（文字敘事。禁止主角內心戲與行動。包含 NPC 自我運行描寫。NPC 登場插入 【奇遇NPC：名字】。突發危機插入 【突發狀況：摘要】。）

【當前資訊更新】
（1～2行術語更新。${getWorldStatusHint(effectiveWorldType)}）

▼ 下方為 JSON 模組。
\`\`\`json
{
  "narrative": "【情境演繹】\\n\\n【當前資訊更新】",
  "choices": ["【標題4字】描述20字內", "【標題】細節"],
  "imagePrompt": "8-bit pixel art, ${WORLD_IMAGE_STYLE[effectiveWorldType] ?? "retro scene"}, crisp hard edges, saturated colors, GBA style, [描述本回合場景的英文單字，5-10字，嚴禁現代元素]",
  "useSafeImage": true,
  "npcUpdates": [{"name": "NPC名", "affectionDelta": 0, "reactionText": "反應"}],
  "stateChanges": { "hpDelta": 0, "mpDelta": 0, "stressDelta": 0, "lustDelta": 0, "willpowerDelta": 0, "location": "${location}", "ticksConsumed": 1 }
}
\`\`\`

imagePrompt 鐵則：必須包含 "8-bit pixel art" 與 "GBA style"。嚴禁出現 "photorealistic" 或 "3d"。`;
}

// ── 世界觀圖片風格：鎖定 GBA 寶可夢綠寶石風格 ──────────────────────────────────────────

export const WORLD_IMAGE_STYLE: Record<string, string> = {
  xian_xia: "8-bit pixel art, GBA pokemon emerald style, sharp pixel edges, vibrant colors, ancient chinese sect, floating mist, jade architecture",
  campus: "8-bit pixel art, GBA style, japanese high school, anime classroom, cherry blossoms, flat colors, hard edges",
  apocalypse: "8-bit pixel art, GBA style, ruined urban city, wasteland, rusty metal, overgrown vines, 16-bit JRPG background",
  adult: "8-bit pixel art, GBA style, cozy modern bedroom, warm interior, flat pixel art, saturated colors",
  wuxia: "8-bit pixel art, GBA style, ancient chinese tavern, bamboo forest, red lanterns, 16-bit retro RPG background",
  western_fantasy: "8-bit pixel art, GBA pokemon style, castle courtyard, medieval town, flat colors, crisp edges",
  cyberpunk: "8-bit pixel art, GBA style, neon city alley, rainy street, pixel holographic signs, dark vibrant atmosphere",
  horror: "8-bit pixel art, GBA style, dark abandoned hospital, eerie shadows, limited color palette, 16-bit horror JRPG",
  palace_intrigue: "8-bit pixel art, GBA style, golden imperial hall, ornate curtains, ancient palace, vibrant flat colors",
  wasteland: "8-bit pixel art, GBA style, desert ruins, rusted robots, red sky, sharp pixel grid",
  taiwanese_folk: "8-bit pixel art, GBA style, traditional taiwanese temple, red lanterns, night market, retro JRPG aesthetic",
  custom: "8-bit pixel art, GBA style, classic JRPG adventure scene",
};

function getWorldStatusHint(worldType: string): string {
  const hints: Record<string, string> = {
    xian_xia: "範例：「境界：煉氣三層｜靈力：48/80｜習得：御氣術」",
    campus: "範例：「成績：B+｜社團地位：成員｜人緣：+1」",
    apocalypse: "範例：「異能：一階｜物資：食物+3｜生存度：穩定」",
    taiwanese_folk: "範例：「法力：七成｜功德：+3｜神契：二階」",
  };
  return hints[worldType] ?? "用術語記錄主角成長與資源。";
}
