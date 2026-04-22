import { NextRequest, NextResponse } from "next/server";

// ── Request 型別 ──────────────────────────────────────────────────────────────

interface NPC {
  name: string;
  relation: string;
  favor: number;
  gender?: string;
  physicalDescription?: string;
  alias?: string;
}

interface GameRequest {
  isStart?: boolean;
  userInput?: string;
  stats?: {
    qiXue: number;
    lingLi: number;
    age: number;
    shouYuan: number;
    mingSheng: number;
    zuiE: number;
    cultivation: string;
    cultivationLevel: number;
    karmaHistory: string[];
    characters: NPC[];
    turn: number;
  };
}

// ── Prompt 建構 ───────────────────────────────────────────────────────────────

function buildPrompt(req: GameRequest): string {
  if (req.isStart) {
    return `請隨機生成一個武俠修仙世界的開局場景。
主角剛剛甦醒，失去了所有記憶，不知道自己是誰或為何在此，年紀約莫十八歲。
場景必須是以下之一（隨機選擇，每次不同）：
- 深山竹林、雲霧繚繞的山頂、熱鬧的江湖城鎮、廢棄的古老宗門遺址、
  海上漂浮的孤島、地下洞窟的靈穴、邊境沙漠的廢墟、懸崖邊的茅屋

用生動筆觸描述主角甦醒後看到的一切，讓讀者立刻感受到世界的氛圍。
若場景中有 NPC，請在 newCharacters 欄位中加入其資訊。
提供3個初始行動選項。`;
  }

  const s = req.stats!;
  const karma = s.karmaHistory.length > 0 ? s.karmaHistory.join("、") : "無";
  const chars = s.characters.length > 0
    ? s.characters.map(c => `${c.name}（${c.relation}，好感 ${c.favor}）`).join("、")
    : "無";

  const totalStages = 10;
  const nextStage = s.cultivationLevel < totalStages - 1 ? `下一境界：第 ${s.cultivationLevel + 1} 階` : "已達最高境界";

  return `【當前遊戲狀態】
修為境界：${s.cultivation}（第 ${s.cultivationLevel} 階 / 共 ${totalStages - 1} 階，第 ${s.turn} 回合）
${nextStage}
年齡：${s.age} 歲　壽元上限：${s.shouYuan} 年
氣血：${s.qiXue}　靈力/修為：${s.lingLi}/100
名聲：${s.mingSheng}　罪惡：${s.zuiE}
因果標記：${karma}
已知人物：${chars}

【境界規則（嚴格遵守）】
玩家當前為第 ${s.cultivationLevel} 階。生成選項時，若涉及突破境界，只可提示突破至第 ${s.cultivationLevel + 1} 階（${s.cultivationLevel < totalStages - 1 ? `即 ${["煉氣一層","煉氣五層","煉氣九層","築基初期","築基中期","築基圓滿","金丹初期","金丹後期","元嬰初期","化神境"][s.cultivationLevel + 1] ?? "最高境界"}` : "已達頂峰，不可再突破"}）。不得出現跨越多層的突破選項。

【玩家行動】
${req.userInput}

以 GM 身份描述行動後的結果，再給出3個選項。
若遇到新角色填 newCharacters；已有角色好感變化填 characterUpdates。`;
}

// ── Gemini REST API ───────────────────────────────────────────────────────────

const SYSTEM_INSTRUCTION = `你是一個武俠修仙文字 RPG 的遊戲主持人（GM）。
永遠以第二人稱「你」描述玩家角色的遭遇。
不要逐字重複玩家輸入，直接描述行動後發生的事。
劇情使用繁體中文，100-200字。

每次回傳必須包含：
1. imagePrompt：用30字以內的英文描述當前場景的視覺畫面，著重環境、光線、氛圍，供圖片生成使用。例如：「ancient bamboo forest, misty mountains, wuxia cultivation fantasy, cinematic lighting」
2. eventLog：將本回合所有具體的遊戲反饋整理為條目清單，每條選擇最合適的類型：
   - 屬性：數值或狀態變動（如「氣血減少10點」）
   - 獲取：習得技能、道具、功法（如「獲得殘破煉氣訣」）
   - 世界：環境事件、天象異動（如「遠處傳來洞天破碎之聲」）
   - 戰況：戰鬥結果、傷勢描述（如「受到輕傷，左臂麻木」）
   若無對應事件，請傳回空陣列。
3. itemsAdded：當劇情中玩家獲得任何物品、道具、功法或技能時，將每個物品以繁體中文名稱列入此陣列（用於背包顯示），例如：["殘破煉氣訣", "鐵劍", "回春丹"]。若本回合未獲得任何物品，傳回空陣列。

若劇情中出現新角色，必須在 newCharacters 填入完整資訊，包括：
- gender：角色性別，"male" 或 "female"
- physicalDescription：20字以內的英文外貌描述，用於肖像圖片生成，著重臉部特徵、髮型、服裝風格。例如：「young woman, flowing black hair, white robes, gentle eyes, ethereal beauty」
- alias（選填）：若此角色是玩家先前認識的 NPC 的真實身份揭露（如「神秘老人」被揭露為「青雲長老」），則在 alias 填入玩家原本知道的舊名稱（「神秘老人」）。系統將自動合併為同一人，保留好感值。若為全新角色，不填此欄。
嚴格回傳 JSON，不含任何 Markdown 包裝。`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    narrative: { type: "STRING" },
    imagePrompt: { type: "STRING" },
    options: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          label:  { type: "STRING" },
          action: { type: "STRING" },
        },
        required: ["label", "action"],
      },
    },
    statChanges: {
      type: "OBJECT",
      properties: {
        qiXue:     { type: "NUMBER" },
        lingLi:    { type: "NUMBER" },
        ageAdd:    { type: "NUMBER" },
        mingSheng: { type: "NUMBER" },
        zuiE:      { type: "NUMBER" },
        karmaTag:  { type: "STRING" },
      },
    },
    eventLog: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          type: { type: "STRING" },
          text: { type: "STRING" },
        },
        required: ["type", "text"],
      },
    },
    itemsAdded: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    newCharacters: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name:                { type: "STRING" },
          relation:            { type: "STRING" },
          favor:               { type: "NUMBER" },
          gender:              { type: "STRING" },
          physicalDescription: { type: "STRING" },
          alias:               { type: "STRING" },
        },
        required: ["name", "relation", "favor"],
      },
    },
    characterUpdates: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name:       { type: "STRING" },
          favorDelta: { type: "NUMBER" },
        },
        required: ["name", "favorDelta"],
      },
    },
  },
  required: ["narrative", "imagePrompt", "options", "statChanges", "eventLog"],
};

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API ${res.status}: ${errText.slice(0, 400)}`);
  }
  const result = await res.json();
  const text: string = result?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) throw new Error("Gemini 回傳空內容");
  return text;
}

// ── POST handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY ?? "";
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY 未設定" }, { status: 500 });

  let body: GameRequest;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  if (!body.isStart && !body.userInput?.trim()) {
    return NextResponse.json({ error: "userInput 不可空白" }, { status: 400 });
  }

  try {
    const rawText = await callGemini(apiKey, buildPrompt(body));
    const data = JSON.parse(rawText);
    if (!data.narrative || !Array.isArray(data.options)) throw new Error("schema 不符");
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Game API error:", message);
    return NextResponse.json({ error: "靈氣混亂，請重試", detail: message }, { status: 500 });
  }
}
