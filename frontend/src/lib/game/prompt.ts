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

// ── 世界觀術語體系（邏輯自洽用） ───────────────────────────────────────────────

const WORLD_TERMINOLOGY: Record<string, string> = {
  xian_xia:
    "成長用「境界（煉氣/築基/金丹/元嬰）、靈根、道心、悟性」；資源用「靈石、靈草、法寶、功法秘籍、丹藥」；組織用「宗門、散修、魔道、長老、弟子」；戰鬥用「靈力、法術、飛劍、神識、靈壓」。禁止使用等級、HP、魔法、技能點等遊戲術語。",
  wuxia:
    "成長用「內力（一成/三成/純青）、武功境界、輕功、暗器、心法」；資源用「銀兩、江湖情報、武器、恩情、秘笈」；組織用「門派、江湖勢力、幫派、官府、黑道」；戰鬥用「招式、內勁、點穴、輕功身法」。禁止使用現代語言或超自然魔法。",
  apocalypse:
    "成長用「異能（覺醒/強化/等級）、生存技能、戰鬥能力」；資源用「物資、彈藥、藥品、食物、燃料、情報」；組織用「據點、倖存者聯盟、派系、軍閥」；威脅用「喪屍、變異體、異能者、匪徒」。禁止使用修仙或魔法術語。",
  western_fantasy:
    "成長用「等級、魔法熟練、法術環階、聲望、技能」；資源用「金幣、魔法材料、裝備、法術卷軸、遺物」；組織用「冒險者公會、王國、精靈族、矮人族、教會」；戰鬥用「咒語、神術、物理技能、魔法陣」。",
  cyberpunk:
    "成長用「義體等級、駭客技術、街頭聲望、企業評級」；資源用「信用點、義體零件、晶片、數據碎片、黑市情報」；組織用「企業、底層幫派、黑客集團、地下市場」；戰鬥用「義體武裝、神經接口、電磁脈衝、駭入」。",
  campus:
    "成長用「成績（GPA/排名）、社團地位、人緣、特長、自信心」；資源用「零用錢、人脈、秘密、時間、信任」；組織用「班級、社團、學生會、老師、家長」。禁止引入任何超自然元素。",
  adult:
    "成長用「職位晉升、財富累積、人脈拓展、情感深度、自我認知」；資源用「金錢、時間、信任、機會、人脈關係」；組織用「公司、家族、朋友圈、業界圈子」。語言寫實，貼近現代都市生活。",
  horror:
    "成長用「異常認知程度、靈覺、規則掌握度、心理承受力」；資源用「護身符、情報、儀式材料、神智值」；敵對存在用「靈異現象、詛咒、未知規則、異界存在」。氣氛壓抑，資訊不完整，未知比已知更恐怖。",
  palace_intrigue:
    "成長用「位階（才人/嬪/妃/貴妃）、聖眷、勢力範圍、謀略聲望」；資源用「金帛、情報、人情、侍從忠誠、秘密」；組織用「各宮派系、太監首領、宮廷御醫、朝臣」；行動用「賜恩、打壓、聯盟、下毒、誣陷」。",
  wasteland:
    "成長用「廢土等級、身體改造、特殊能力、部族地位」；資源用「廢鐵、食物、清水、燃料、武器彈藥」；組織用「部族、軍閥、拾荒者商隊、廢土傳說人物」；威脅用「變異體、匪徒、輻射、極端天氣」。",
};

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
  normal:       "正常",
  flushed:      "臉紅耳熱",
  sweaty:       "汗如雨下",
  injured:      "帶傷",
  exhausted:    "精疲力竭",
  aroused:      "慾火中燒",
  poisoned:     "中毒",
  inner_injured:"內傷",
  bleeding:     "失血",
  fever:        "發燒",
  starving:     "飢餓",
  possessed:    "附身",
  cursed:       "詛咒",
  drunk:        "醉酒",
  medicated:    "藥效中",
  paralyzed:    "麻痺",
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

  // Gender (from world_attributes, set at adventure creation)
  const gender = (worldAttributes.gender as string) ?? null;

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

  // Scenario hook — only inject on the very first tick; after that it's in narrative_summary
  const scenarioHook = tick <= 1 ? (worldAttributes.scenario_hook as string | undefined) : undefined;

  // Filter worldAttrs for display — exclude internal fields
  const INTERNAL_KEYS = new Set(["world_flavor", "character_bio", "writing_style", "gender", "lust", "willpower", "clothing_state", "body_status", "scenario_hook"]);
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

  // World terminology block
  const worldTerminology = WORLD_TERMINOLOGY[effectiveWorldType] ?? "";

  // Character block: strict bio or auto-protagonist
  const characterBlock = characterBio
    ? `【玩家角色設定（最高優先級）】
${characterBio}
▶ 上述設定是本故事的絕對核心，不可偏離或替換。
▶ 主角的姓名、出身、性格缺陷、過去事件必須完整體現在每一回合的敘事語氣、行為動機、內心獨白中。
▶ 若開場情境與角色設定有任何潛在矛盾，必須以能讓兩者自然融合的方式處理，而非忽略其中一個。`
    : `【自動主角生成指令】
使用者未提供角色背景。請根據本世界觀，在此次首回合敘事中生成一個具有強烈個人色彩的主角，並在後續每局保持一致性：
• 賦予一個符合世界觀的具體姓名
• 設定一個有缺陷的鮮明性格（避免完美無缺的英雄形象）
• 確立一個具體且急迫的核心動機（復仇／生存／守護／追求）
• 埋下一個尚未解決的核心衝突或秘密作為故事引擎
在首回合中用敘事自然帶出這個主角的身份與處境，不需另作說明。`;

  return `${styleBase}

${worldPrompt}
${worldTerminology ? `\n【世界觀術語規範（邏輯自洽）】\n${worldTerminology}\n▶ 嚴禁在此世界觀中使用其他世界觀的概念和術語（例如：仙俠中不出現「技能點」，末日中不出現「靈力」）。` : ""}

${characterBlock}
${scenarioHook ? `\n【本局開場設定】\n${scenarioHook}\n本局的故事從此情境切入展開，NPC 必須是全新的獨特角色。${characterBio ? "開場情境需與主角角色設定相容、自然融合。" : ""}` : ""}
${urgencyBlock ? "\n" + urgencyBlock : ""}

═══════════════ 當前狀態快照 ═══════════════
【時間】第 ${generation} 世 | Tick ${tick} | ${timeOfDay} | ${weather}
【地點】${location}
【環境】${envDesc}

【主角屬性】
- HP：${hp}/${hpMax}（${hpRatio}%）
- MP：${mp}/${mpMax}
- 壓力：${stress}/100
- 魅力：${charisma}${gender ? `\n- 性別：${gender}` : ""}
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

【敘事驅動規則（每回合必須遵守）】

▌高頻反饋原則
主角的每一次行動都必須產生可見的實質結果，結果類型須符合世界觀：
• 資源類：獲得物品／情報／靈石／物資／金錢／線索
• 關係類：NPC 的態度、好感、信任或敵意發生具體轉變
• 成長類：技能提升／修為精進／知識獲取／人脈擴展
不允許「什麼都沒改變」的回合，即使行動失敗也要帶來負面但清晰的結果。

▌動態世界模擬（NPC 自我運行）
${npcContext !== "目前沒有已知的 NPC。"
  ? "當前已建立的 NPC 在主角行動的同時不能靜止等待。\n必須在本回合敘事中加入至少一句他們「自我運行」的描寫：\n• 他們根據自身特質正在做的事（修煉、學習、管理勢力、謀劃、等待）\n• 他們因主角的行動或不在場而產生的情緒（思念、嫉妒、憤怒、擔憂、期待）\n這些發展不必立刻衝擊主線，但會在未來某回合作為意外衝突或援助出現。"
  : "當後方勢力或 NPC 建立後，他們在每回合都必須有自我運行的描寫，不能靜止等待主角。"
}

【寫作風格指南】
▌節奏：放慢。每回合只推進一個核心事件。禁止在同一段落內連續推進多個情節節點。
▌感官描寫：用具體感官語言，避免抽象形容。
  ✗「他很帥」→ ✓「他下頜線很硬，說話時頸側的肌肉輕輕收緊」
  ✗「她很緊張」→ ✓「她的指尖不停撚著袖口的線頭，眼神也不敢落在你身上超過半秒」
▌張力優先：每個場景用環境細節、角色外貌、內心獨白、對話的潛台詞來填充質感，讓讀者沉浸，而不只是跟著事件走。
${trackLust ? "▌成人場景：衣著與身體狀態的變化要自然融入感官描寫，不要直白列舉。" : ""}

你的回應格式（先輸出兩個文字模組，最後輸出 JSON）：

【情境演繹】
（用${writingStyleKey}寫出 ${writingStyleKey === "日常直白風格" ? "100~200" : "200~350"} 字的場景敘事。
節奏放慢，用感官細節填充場景。必須包含：精彩對話或動作場面、角色內心獨白、環境氛圍描寫。
包含本回合的實質反饋結果。${npcContext !== "目前沒有已知的 NPC。" ? "\n同時加入至少一句已知NPC的自我運行描寫。" : ""}
如有重大 NPC 登場：插入 【奇遇NPC：名字】。如有突發危機：插入 【突發狀況：摘要】。）

【當前資訊更新】
（用1～2行，以本世界觀術語記錄主角這回合的核心狀態或成長。
${getWorldStatusHint(effectiveWorldType)}）

行動選項（列在此處，格式如下，供 JSON 的 choices 欄使用）：
【行動標題（4字以內）】一句話描述動機與細節（20字以內）
若有顯著風險或收益加上：| ⚠ 慾望+15（只在變化顯著時加，不要每個都加）

\`\`\`json
{
  "narrative": "【情境演繹】的完整文字 + 換行 + 【當前資訊更新】的完整文字（含模組標題行）",
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
\`\`\`

useSafeImage 規則：含暴力/血腥/成人內容設 false，否則設 true。
clothingState 可選值：normal / disheveled / partial / minimal / bare
bodyStatus 可選值：normal / flushed / sweaty / injured / exhausted / aroused / poisoned / inner_injured / bleeding / fever / starving / possessed / cursed / drunk / medicated / paralyzed`;
}

// ── 世界觀狀態更新範例（提示 LLM 使用正確術語） ──────────────────────────────

function getWorldStatusHint(worldType: string): string {
  const hints: Record<string, string> = {
    xian_xia:        "範例：「境界：煉氣三層（+1）｜靈力：48/80｜本回合習得：【御氣術·初階】」",
    wuxia:           "範例：「內力：三成半（+半成）｜武學：【青風劍法·第三式】已習｜江湖聲名：微弱流傳」",
    campus:          "範例：「成績：B+（本週模擬考+5分）｜社團地位：普通成員｜與【顧辭】好感：微升」",
    apocalypse:      "範例：「異能：一階（覺醒度 70%）｜物資：食物+3日份｜【馮燁】動向：仍在搜索你」",
    western_fantasy: "範例：「等級：Lv.3（60%）｜習得：【火球術·Rank1】｜公會聲望：D級」",
    cyberpunk:       "範例：「義體：二代腿部強化｜駭客評級：B｜街頭聲望+小幅｜信用點：+200」",
    horror:          "範例：「異常認知：35%｜神智：86%｜掌握規則：第三條（禁止照鏡）」",
    palace_intrigue: "範例：「位階：才人｜聖眷：薄弱｜本回合：與【蕭燁】關係：謹慎觀望」",
    wasteland:       "範例：「廢土等級：Lv.2｜物資：食物5日/燃料2份｜車輛耐久：修復至70%」",
    adult:           "範例：「職位：副理｜本回合：與【江以晴】關係：微妙升溫｜帳戶：±0元」",
  };
  return hints[worldType] ?? "用1～2行以本世界觀術語記錄主角的核心成長、資源變化或關鍵人際動態。";
}
