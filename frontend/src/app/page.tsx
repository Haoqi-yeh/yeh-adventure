"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ───────────────────────────────────────────────────────────────────

type KarmaTag =
  | "修煉" | "吐納" | "淬體" | "悟道"
  | "遊歷" | "問道" | "採集" | "煉丹"
  | "殺業" | "御器" | "神通" | "逃遁"
  | "血債" | "天道感應" | "業火" | "渡劫";

interface StoryOption {
  label: string;
  action: string;
}

// ── AI 回傳 JSON 格式定義 ──────────────────────────────────────────────────
// POST /api/game/action
// Request: { adventureId, userInput, currentStats }
// Response: AIGameResponse
interface AIGameResponse {
  narrative: string;
  options: StoryOption[];
  statChanges: {
    qiXue?: number;
    lingLi?: number;
    shouYuan?: number;
    mingSheng?: number;
    zuiE?: number;
    karmaTag?: KarmaTag;
  };
}

interface GameState {
  qiXue: number;
  lingLi: number;
  shouYuan: number;
  mingSheng: number;
  zuiE: number;
  karmaHistory: KarmaTag[];
  cultivation: string;
  cultivationLevel: number;
  displayedNarrative: string;
  isTyping: boolean;
  isLoading: boolean;
  turn: number;
  options: StoryOption[];
  error: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CULTIVATION_STAGES = [
  "煉氣一層", "煉氣五層", "煉氣九層",
  "築基初期", "築基中期", "築基圓滿",
  "金丹初期", "金丹後期", "元嬰初期",
  "化神境",
];

const DEJA_VU_TRIGGERS: Record<string, { label: string; action: string }> = {
  殺業: { label: "【血債血還·既視感】", action: "我感應到體內殺念凝聚，試圖引導這股力量" },
  悟道: { label: "【大道至簡·既視感】", action: "那些感悟碎片突然聚合，我嘗試抓住那一瞬間的頓悟" },
  血債: { label: "【以血祭道·既視感】", action: "以滿身業力為引，我嘗試踏出一條以殺入道之路" },
  天道感應: { label: "【天道回響·既視感】", action: "我感受到天道的回望，試圖借助這股共鳴突破當前境界" },
};

const INITIAL_OPTIONS: StoryOption[] = [
  { label: "打坐感應天地靈氣，嘗試開始修行", action: "我盤膝而坐，試著感應周圍的天地靈氣，嘗試開始修行之路" },
  { label: "探索這片竹林，尋找線索", action: "我小心翼翼地起身，四處探索這片竹林，希望找到任何有關自己身份的線索" },
  { label: "閉眼回想，試圖找回記憶", action: "我閉上雙眼，努力回想自己是誰、為何會在此處，試圖找回失落的記憶" },
];

const INITIAL_NARRATIVE =
  "你睜開雙眼，發現自己身處一片翠竹深林之中。晨霧彌漫，靈氣充沛，遠處隱約傳來水流聲。" +
  "你不知道自己是誰，也不記得過去——但你清楚地感受到，丹田之中有一縷微弱的靈氣在流動。" +
  "一段嶄新的修仙之路，正在你腳下展開……";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, v));
}

// 模擬 AI 回應（後端尚未接入時的備用邏輯）
function mockAIResponse(input: string): AIGameResponse {
  const lower = input.toLowerCase();
  const isCombat = ["斬", "殺", "攻", "打", "戰", "劍"].some(k => input.includes(k));
  const isMeditate = ["坐", "修", "煉", "悟", "靈氣", "打坐"].some(k => input.includes(k));
  const isExplore = ["探", "走", "去", "找", "看", "搜"].some(k => input.includes(k));
  void lower;

  if (isCombat) {
    return {
      narrative: "你運起功法，劍指蒼穹。一道凌厲的劍意自指尖迸發，林間鳥雀四散驚飛。這一式雖僅是試探，卻讓你感受到了自身靈力的輪廓——比你想像中更加深厚。殺念在心底一閃而過，天道默默記錄著這一刻。",
      options: [
        { label: "繼續淬煉劍術，感受劍道真意", action: "我繼續修煉劍術，嘗試感受其中蘊含的劍道真意" },
        { label: "收斂殺意，重新回到靜心修煉", action: "我意識到殺念過重，收斂心神，重新靜心修煉" },
        { label: "向深處走去，探查林中動靜", action: "我沿著劍氣指向的方向，向竹林深處走去" },
      ],
      statChanges: { lingLi: -8, qiXue: 5, zuiE: 5, karmaTag: "殺業" },
    };
  }

  if (isMeditate) {
    return {
      narrative: "你盤膝而坐，調息吐納。天地間稀薄的靈氣緩緩向你匯聚，丹田中那縷微弱的靈氣漸漸壯大，如涓涓細流慢慢積聚成河。不知過了多久，你睜開雙眼，感到神清氣爽，對這片天地的感知也更加清晰。",
      options: [
        { label: "繼續打坐，感受靈氣的流向", action: "我繼續打坐，深入感受靈氣在體內的流動與天地間的呼應" },
        { label: "嘗試吐納更深層的靈氣", action: "我嘗試吐納術，試著吸納更深層、更純粹的天地靈氣" },
        { label: "起身活動，感受修行後的身體變化", action: "我結束靜坐，起身活動筋骨，感受修行後的身體變化" },
      ],
      statChanges: { lingLi: 12, shouYuan: -2, karmaTag: "修煉" },
    };
  }

  if (isExplore) {
    return {
      narrative: "你穿行於竹林深處，腳步輕盈。林間靈氣彌漫，不時有螢火蟲般的光點在霧氣中閃爍。走了約半個時辰，你在一塊平滑的青石旁停下——石上隱隱有文字被人刻下，字跡古樸，似乎記載著什麼功法的殘章。",
      options: [
        { label: "仔細研讀石上的殘章功法", action: "我靠近青石，仔細研讀上面刻下的殘章功法，試著理解其含義" },
        { label: "繼續向林深處探索", action: "我繞過青石，繼續向竹林更深處探索，感覺那裡還有更多秘密" },
        { label: "在此處靜坐，感悟殘章中的道理", action: "我在青石旁盤坐下來，靜心感悟殘章中蘊含的修行道理" },
      ],
      statChanges: { mingSheng: 3, shouYuan: -3, karmaTag: "遊歷" },
    };
  }

  return {
    narrative: `你${input.slice(0, 20)}……行動之後，天地間靈氣微微波動，彷彿有什麼隱藏的因果正在悄然變化。修行之路從來不只有一條，每一個選擇都在塑造著你未來的命運軌跡。`,
    options: [
      { label: "深入思考剛才的行動", action: "我停下來深入思考剛才行動帶來的變化與感悟" },
      { label: "繼續感應天地靈氣", action: "我重新靜下心來，感應天地靈氣的流動" },
      { label: "向更遠處探索", action: "我決定走出舒適區，向更遠更未知的地方探索" },
    ],
    statChanges: { shouYuan: -1 },
  };
}

// ─── useGameState Hook ────────────────────────────────────────────────────────

function useGameState() {
  const [state, setState] = useState<GameState>({
    qiXue: 80,
    lingLi: 60,
    shouYuan: 500,
    mingSheng: 10,
    zuiE: 0,
    karmaHistory: [],
    cultivation: CULTIVATION_STAGES[0],
    cultivationLevel: 0,
    displayedNarrative: "",
    isTyping: false,
    isLoading: false,
    turn: 0,
    options: INITIAL_OPTIONS,
    error: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runTypewriter = useCallback((text: string) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    let i = 0;
    setState(s => ({ ...s, displayedNarrative: "", isTyping: true }));
    intervalRef.current = setInterval(() => {
      i++;
      const done = i >= text.length;
      setState(s => ({ ...s, displayedNarrative: text.slice(0, i), isTyping: !done }));
      if (done) clearInterval(intervalRef.current!);
    }, 38);
  }, []);

  useEffect(() => {
    runTypewriter(INITIAL_NARRATIVE);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 核心函數：送出行動並取得 AI 回應
  const handleSendMessage = useCallback(async (userInput: string) => {
    if (!userInput.trim() || state.isLoading || state.isTyping) return;

    setState(s => ({ ...s, isLoading: true, options: [], error: null }));

    let response: AIGameResponse;

    try {
      // ── 真實 API 呼叫（後端就緒後啟用）──────────────────────────
      // const res = await fetch("/api/game/action", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     adventureId: "local-session",
      //     userInput,
      //     currentStats: {
      //       qiXue: state.qiXue,
      //       lingLi: state.lingLi,
      //       shouYuan: state.shouYuan,
      //       mingSheng: state.mingSheng,
      //       zuiE: state.zuiE,
      //       karmaHistory: state.karmaHistory,
      //       cultivation: state.cultivation,
      //     },
      //   }),
      // });
      // if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // response = await res.json() as AIGameResponse;
      // ── 目前使用模擬回應 ─────────────────────────────────────────
      await new Promise(r => setTimeout(r, 800)); // 模擬網路延遲
      response = mockAIResponse(userInput);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "未知錯誤";
      setState(s => ({
        ...s,
        isLoading: false,
        error: `無法連接伺服器：${msg}`,
        options: INITIAL_OPTIONS,
      }));
      return;
    }

    // 套用數值變化
    setState(prev => {
      const c = response.statChanges;
      const rawLingLi = prev.lingLi + (c.lingLi ?? 0);
      let newLevel = prev.cultivationLevel;
      if (rawLingLi >= 100 && prev.cultivationLevel < CULTIVATION_STAGES.length - 1) {
        newLevel = prev.cultivationLevel + 1;
      }
      const newKarma = c.karmaTag && !prev.karmaHistory.includes(c.karmaTag)
        ? ([...prev.karmaHistory, c.karmaTag] as KarmaTag[])
        : prev.karmaHistory;

      return {
        ...prev,
        qiXue: clamp(prev.qiXue + (c.qiXue ?? 0)),
        lingLi: newLevel > prev.cultivationLevel ? 20 : clamp(rawLingLi),
        shouYuan: Math.max(0, prev.shouYuan + (c.shouYuan ?? 0)),
        mingSheng: clamp(prev.mingSheng + (c.mingSheng ?? 0)),
        zuiE: clamp(prev.zuiE + (c.zuiE ?? 0)),
        karmaHistory: newKarma,
        cultivation: CULTIVATION_STAGES[newLevel],
        cultivationLevel: newLevel,
        turn: prev.turn + 1,
        options: response.options,
        isLoading: false,
        error: null,
      };
    });

    runTypewriter(response.narrative);
  }, [state.isLoading, state.isTyping, runTypewriter]);

  return { state, handleSendMessage };
}

// ─── BreathBar ────────────────────────────────────────────────────────────────

function BreathBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{ color: "#64748b", fontSize: "11px", width: "28px", flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: "8px", backgroundColor: "#1e293b", borderRadius: "4px", overflow: "hidden" }}>
        <motion.div
          style={{ height: "100%", borderRadius: "4px", backgroundColor: color }}
          animate={{ width: `${Math.max(0, value)}%`, opacity: [0.7, 1, 0.7] }}
          transition={{
            width: { duration: 0.5, ease: "easeOut" },
            opacity: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      </div>
      <span style={{ color: "#94a3b8", fontFamily: "monospace", fontSize: "11px", width: "28px", textAlign: "right", flexShrink: 0 }}>{value}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Page() {
  const { state, handleSendMessage } = useGameState();
  const [inputValue, setInputValue] = useState("");
  const [rippleKey, setRippleKey] = useState<number | null>(null);

  const activeDejaVuKeys = Object.keys(DEJA_VU_TRIGGERS).filter(k =>
    state.karmaHistory.includes(k as KarmaTag)
  );

  const fire = (action: string) => {
    if (!action.trim()) return;
    setRippleKey(Date.now());
    handleSendMessage(action);
  };

  const onSubmitInput = () => {
    fire(inputValue);
    setInputValue("");
  };

  const isBusy = state.isLoading || state.isTyping;

  // ── Inline style objects（確保跨環境正確渲染）────────────────────────────

  const outerStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    backgroundColor: "#cbd5e1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    fontFamily: '"Noto Sans TC", "PingFang TC", sans-serif',
  };

  const panelStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    maxWidth: "448px",
    height: "90vh",
    maxHeight: "90vh",
    backgroundColor: "#020617",
    borderRadius: "16px",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6), 0 0 0 4px #1e293b",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  };

  const headerStyle: React.CSSProperties = {
    flexShrink: 0,
    backgroundColor: "rgba(15,23,42,0.95)",
    padding: "14px 16px 12px",
    borderBottom: "1px solid #1e293b",
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    minHeight: 0,
  };

  const footerStyle: React.CSSProperties = {
    flexShrink: 0,
    backgroundColor: "rgba(15,23,42,0.8)",
    borderTop: "1px solid #1e293b",
    padding: "12px",
  };

  return (
    <div style={outerStyle}>
      <div style={panelStyle}>

        {/* 靈氣漣漪特效 */}
        <AnimatePresence>
          {rippleKey !== null && (
            <motion.div key={rippleKey} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 20 }}>
              <motion.div
                style={{ width: 80, height: 80, borderRadius: "50%", border: "1px solid rgba(34,211,238,0.3)", backgroundColor: "rgba(34,211,238,0.06)" }}
                initial={{ scale: 0.3, opacity: 0.6 }}
                animate={{ scale: 6, opacity: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                onAnimationComplete={() => setRippleKey(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── HEADER ─────────────────────────────────────────── */}
        <div style={headerStyle}>
          {/* 境界 + 回合 + 壽元 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ color: "#fbbf24", fontSize: "14px", fontWeight: 600, letterSpacing: "0.1em" }}>
              {state.cultivation}
            </span>
            <span style={{ color: "#475569", fontSize: "11px" }}>
              {state.turn > 0 ? `第 ${state.turn} 回 · ` : ""}壽元{" "}
              <span style={{ color: "#34d399", fontFamily: "monospace" }}>{state.shouYuan}</span> 年
            </span>
          </div>

          {/* 氣血 / 靈力 進度條 */}
          <BreathBar label="氣血" value={state.qiXue}    color="#dc2626" />
          <div style={{ marginTop: "6px" }}>
            <BreathBar label="靈力" value={state.lingLi}  color="#06b6d4" />
          </div>

          {/* 名聲 / 罪惡 */}
          <div style={{ display: "flex", gap: "16px", marginTop: "8px", fontSize: "11px", color: "#475569" }}>
            <span>名聲 <span style={{ color: "#fbbf24", fontFamily: "monospace" }}>{state.mingSheng}</span></span>
            <span>罪惡 <span style={{ color: "#f87171", fontFamily: "monospace" }}>{state.zuiE}</span></span>
          </div>

          {/* 因果標記 */}
          {state.karmaHistory.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "8px" }}>
              {state.karmaHistory.map(tag => (
                <span key={tag} style={{ padding: "2px 7px", fontSize: "10px", borderRadius: "4px", backgroundColor: "#0f172a", color: "#64748b", border: "1px solid #1e293b", letterSpacing: "0.05em" }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── CONTENT：劇情敘事區 ────────────────────────────── */}
        <div style={contentStyle}>
          {/* 敘事文字 */}
          <p style={{ color: "#f1f5f9", fontSize: "14px", lineHeight: 1.85, letterSpacing: "0.04em", margin: 0 }}>
            {state.displayedNarrative}
            {state.isTyping && (
              <motion.span
                style={{ display: "inline-block", width: "2px", height: "14px", backgroundColor: "#fbbf24", marginLeft: "2px", verticalAlign: "middle" }}
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              />
            )}
          </p>

          {/* 既視感隱藏按鈕 */}
          {!isBusy && activeDejaVuKeys.length > 0 && (
            <div style={{ marginTop: "20px", paddingTop: "14px", borderTop: "1px solid rgba(30,41,59,0.8)" }}>
              <p style={{ fontSize: "10px", color: "#475569", fontStyle: "italic", letterSpacing: "0.12em", marginBottom: "8px" }}>
                〔因果共鳴·既視感〕
              </p>
              {activeDejaVuKeys.map(key => (
                <motion.button
                  key={key}
                  onClick={() => fire(DEJA_VU_TRIGGERS[key].action)}
                  whileTap={{ scale: 0.97 }}
                  style={{ display: "block", width: "100%", textAlign: "left", fontSize: "12px", color: "rgba(251,191,36,0.85)", border: "1px solid rgba(120,53,15,0.35)", borderRadius: "10px", padding: "10px 14px", backgroundColor: "rgba(69,26,3,0.25)", cursor: "pointer", marginBottom: "6px" }}
                >
                  {DEJA_VU_TRIGGERS[key].label}
                </motion.button>
              ))}
            </div>
          )}

          {/* 錯誤訊息 */}
          {state.error && (
            <p style={{ color: "#f87171", fontSize: "12px", marginTop: "12px" }}>{state.error}</p>
          )}
        </div>

        {/* ── FOOTER：輸入框 + 動態選項 ─────────────────────── */}
        <div style={footerStyle}>

          {/* 自定義輸入列 */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === "Enter" && onSubmitInput()}
              disabled={isBusy}
              placeholder="輸入自定義行動或對話…"
              style={{
                flex: 1,
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "10px",
                padding: "9px 12px",
                fontSize: "13px",
                color: "#f1f5f9",
                outline: "none",
                opacity: isBusy ? 0.5 : 1,
              }}
            />
            <motion.button
              onClick={onSubmitInput}
              disabled={isBusy || !inputValue.trim()}
              whileTap={{ scale: 0.93 }}
              style={{
                backgroundColor: isBusy || !inputValue.trim() ? "#1e293b" : "#0ea5e9",
                border: "none",
                borderRadius: "10px",
                padding: "9px 14px",
                fontSize: "13px",
                color: "#f1f5f9",
                cursor: isBusy || !inputValue.trim() ? "not-allowed" : "pointer",
                flexShrink: 0,
                transition: "background-color 0.2s",
              }}
            >
              送出
            </motion.button>
          </div>

          {/* 動態劇情選項 */}
          {state.isLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "18px", gap: "8px" }}>
              <motion.div
                style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#06b6d4" }}
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#06b6d4" }}
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#06b6d4" }}
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
              />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {state.options.map((opt, i) => (
                <motion.button
                  key={i}
                  onClick={() => fire(opt.action)}
                  disabled={isBusy}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    backgroundColor: "#0f172a",
                    border: "1px solid #1e293b",
                    borderTop: "1px solid #334155",
                    borderBottom: "2px solid #000",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    fontSize: "13px",
                    color: "#cbd5e1",
                    cursor: isBusy ? "not-allowed" : "pointer",
                    opacity: isBusy ? 0.4 : 1,
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ color: "#475569", marginRight: "6px" }}>{i + 1}.</span>
                  {opt.label}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
