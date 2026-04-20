import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// ── Gemini 設定 ───────────────────────────────────────────────────────────────

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: `你是一個武俠修仙文字 RPG 的遊戲主持人（GM）。

核心規則：
1. 永遠以第二人稱「你」描述玩家角色的遭遇、感受與結果
2. 絕對不要逐字重複或引用玩家的輸入句子——描述「行動後發生了什麼事」
3. 劇情生動有畫面感，使用繁體中文，100-200字左右
4. 數值變化要合理，每次幅度在 -20 到 +20 之間
5. 選項文字簡潔（20字以內），代表玩家接下來可採取的行動
6. 選項的 action 欄位是點擊後自動送出的完整行動描述（不是標題的重複）
7. 嚴格回傳 JSON，不含任何 Markdown 包裝或多餘說明

世界觀：武俠修仙世界，修煉境界從煉氣到化神，充滿機緣、因果與江湖恩怨。`,

  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        narrative: { type: SchemaType.STRING },
        options: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              label:  { type: SchemaType.STRING },
              action: { type: SchemaType.STRING },
            },
            required: ["label", "action"],
          },
        },
        statChanges: {
          type: SchemaType.OBJECT,
          properties: {
            qiXue:     { type: SchemaType.NUMBER },
            lingLi:    { type: SchemaType.NUMBER },
            shouYuan:  { type: SchemaType.NUMBER },
            mingSheng: { type: SchemaType.NUMBER },
            zuiE:      { type: SchemaType.NUMBER },
            karmaTag:  { type: SchemaType.STRING },
          },
        },
      },
      required: ["narrative", "options", "statChanges"],
    },
  },
});

// ── Request / Response 型別 ───────────────────────────────────────────────────

interface GameRequest {
  isStart?: boolean;
  userInput?: string;
  stats?: {
    qiXue: number;
    lingLi: number;
    shouYuan: number;
    mingSheng: number;
    zuiE: number;
    cultivation: string;
    karmaHistory: string[];
    turn: number;
  };
}

// ── 建立提示詞 ────────────────────────────────────────────────────────────────

function buildPrompt(req: GameRequest): string {
  if (req.isStart) {
    return `請隨機生成一個武俠修仙世界的開局場景。
主角剛剛甦醒，失去了所有記憶，不知道自己是誰或為何在此。
場景必須是以下之一（隨機選擇，每次不同）：
- 深山竹林、雲霧繚繞的山頂、熱鬧的江湖城鎮、廢棄的古老宗門遺址、
  海上漂浮的孤島、地下洞窟的靈穴、邊境沙漠的廢墟、懸崖邊的茅屋

用生動筆觸描述主角甦醒後看到的一切，讓讀者立刻感受到世界的氛圍。
提供3個初始行動選項，讓玩家決定如何開始探索。`;
  }

  const s = req.stats!;
  const karma = s.karmaHistory.length > 0 ? s.karmaHistory.join("、") : "無";

  return `【當前遊戲狀態】
修為境界：${s.cultivation}（第 ${s.turn} 回合）
氣血：${s.qiXue}/100　靈力：${s.lingLi}/100　壽元：${s.shouYuan} 年
名聲：${s.mingSheng}　罪惡：${s.zuiE}
因果標記：${karma}

【玩家行動】
${req.userInput}

請以 GM 身份，描述上述行動之後發生的事情與後果，再給出3個接下來的選項。
記得：不要重複玩家說的話，直接描述結果與周遭環境的反應。`;
}

// ── POST handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY 未設定" },
      { status: 500 }
    );
  }

  let body: GameRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.isStart && !body.userInput?.trim()) {
    return NextResponse.json({ error: "userInput 不可空白" }, { status: 400 });
  }

  try {
    const prompt = buildPrompt(body);
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const data = JSON.parse(text);

    // 基本結構驗證
    if (!data.narrative || !Array.isArray(data.options)) {
      throw new Error("AI 回傳格式不符");
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/game] Gemini error:", message);
    return NextResponse.json(
      { error: "靈氣混亂，請重試" },
      { status: 500 }
    );
  }
}
