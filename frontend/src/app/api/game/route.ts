import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// ── Request 型別 ──────────────────────────────────────────────────────────────

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

// ── 工具函式 ──────────────────────────────────────────────────────────────────

/** 清除 AI 可能加上的 Markdown 包裝 (```json ... ```) */
function stripMarkdown(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

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

請以 GM 身份描述行動後發生的事，再給出3個接下來的選項。`;
}

// ── POST handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── 暴力 Debug：確認金鑰是否有被 Vercel 注入 ─────────────────────────────
  console.log("DEBUG: Key exists?", !!process.env.GEMINI_API_KEY);
  console.log("DEBUG: Key prefix:", (process.env.GEMINI_API_KEY ?? "").slice(0, 4) || "(empty)");

  const apiKey = process.env.GEMINI_API_KEY ?? "";
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY 未設定" }, { status: 500 });
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

  // ── 在 handler 內部建立 client，強制走 v1 正式版（非 v1beta）────────────
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
  console.log("DEBUG: Using default SDK API version");
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: `你是一個武俠修仙文字 RPG 的遊戲主持人（GM）。
永遠以第二人稱「你」描述玩家角色的遭遇。
不要逐字重複玩家輸入，直接描述行動後發生的事。
劇情使用繁體中文，100-200字。
嚴格回傳 JSON，不含任何 Markdown 包裝。`,

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

  try {
    // ── 簡化測試：先用 "你好" 確認連線，再換回完整 prompt ─────────────────
    // const result = await model.generateContent("你好");   // ← 測試用，確認後刪除
    const prompt = buildPrompt(body);
    console.log("DEBUG: Prompt sent (first 100):", prompt.slice(0, 100));

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    console.log("DEBUG: AI raw response (first 300):", rawText.slice(0, 300));

    const cleaned = stripMarkdown(rawText);
    const data = JSON.parse(cleaned);

    if (!data.narrative || !Array.isArray(data.options)) {
      console.error("DEBUG: Bad schema received:", JSON.stringify(data).slice(0, 200));
      throw new Error("schema 不符");
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("DEBUG: Error detail:", message);
    return NextResponse.json(
      { error: "靈氣混亂，請重試", detail: message },
      { status: 500 }
    );
  }
}
