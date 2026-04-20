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
  殺業:   { label: "【血債血還·既視感】", action: "我感應到體內殺念凝聚，試圖引導這股力量化為神通" },
  悟道:   { label: "【大道至簡·既視感】", action: "那些感悟碎片驟然聚合，我嘗試抓住這一瞬間的頓悟" },
  血債:   { label: "【以血祭道·既視感】", action: "以滿身業力為引，我嘗試踏出一條以殺入道之路" },
  天道感應: { label: "【天道回響·既視感】", action: "我感受到天道的回望，試圖借助這股共鳴突破當前境界" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, v));
}

// ─── useGameState Hook ────────────────────────────────────────────────────────

function useGameState() {
  const [state, setState] = useState<GameState>({
    qiXue: 80, lingLi: 60, shouYuan: 500,
    mingSheng: 10, zuiE: 0,
    karmaHistory: [],
    cultivation: CULTIVATION_STAGES[0],
    cultivationLevel: 0,
    displayedNarrative: "",
    isTyping: false,
    isLoading: true,   // 開局時即進入 loading
    turn: 0,
    options: [],
    error: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // ── 打字機 ──────────────────────────────────────────────────────────────────
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

  // ── 套用 AI 回傳結果 ─────────────────────────────────────────────────────────
  const applyResponse = useCallback((response: AIGameResponse, isStart = false) => {
    setState(prev => {
      const c = response.statChanges ?? {};
      const rawLingLi = isStart ? prev.lingLi : prev.lingLi + (c.lingLi ?? 0);
      let newLevel = prev.cultivationLevel;
      if (rawLingLi >= 100 && prev.cultivationLevel < CULTIVATION_STAGES.length - 1) {
        newLevel = prev.cultivationLevel + 1;
      }
      const newKarma = c.karmaTag && !prev.karmaHistory.includes(c.karmaTag)
        ? ([...prev.karmaHistory, c.karmaTag] as KarmaTag[])
        : prev.karmaHistory;
      return {
        ...prev,
        qiXue:     isStart ? prev.qiXue     : clamp(prev.qiXue     + (c.qiXue     ?? 0)),
        lingLi:    newLevel > prev.cultivationLevel ? 20 : clamp(rawLingLi),
        shouYuan:  isStart ? prev.shouYuan  : Math.max(0, prev.shouYuan + (c.shouYuan ?? 0)),
        mingSheng: isStart ? prev.mingSheng : clamp(prev.mingSheng  + (c.mingSheng ?? 0)),
        zuiE:      isStart ? prev.zuiE      : clamp(prev.zuiE       + (c.zuiE      ?? 0)),
        karmaHistory: newKarma,
        cultivation:  CULTIVATION_STAGES[newLevel],
        cultivationLevel: newLevel,
        turn:    isStart ? 0 : prev.turn + 1,
        options:   response.options ?? [],
        isLoading: false,
        error:     null,
      };
    });
    runTypewriter(response.narrative);
  }, [runTypewriter]);

  // ── 呼叫後端 API ─────────────────────────────────────────────────────────────
  const callAPI = useCallback(async (
    userInput: string | null
  ): Promise<AIGameResponse> => {
    const s = stateRef.current;
    const body = userInput === null
      ? { isStart: true }
      : {
          userInput,
          stats: {
            qiXue:        s.qiXue,
            lingLi:       s.lingLi,
            shouYuan:     s.shouYuan,
            mingSheng:    s.mingSheng,
            zuiE:         s.zuiE,
            cultivation:  s.cultivation,
            karmaHistory: s.karmaHistory,
            turn:         s.turn,
          },
        };

    const res = await fetch("/api/game", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error((errData as { error?: string }).error ?? `HTTP ${res.status}`);
    }

    return res.json() as Promise<AIGameResponse>;
  }, []);

  // ── 開局：mount 時自動呼叫 ───────────────────────────────────────────────────
  useEffect(() => {
    callAPI(null)
      .then(r => applyResponse(r, true))
      .catch(err => {
        setState(s => ({
          ...s,
          isLoading: false,
          displayedNarrative: "",
          error: `開局失敗：${err instanceof Error ? err.message : err}`,
        }));
      });
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 玩家送出行動 ─────────────────────────────────────────────────────────────
  const handleSendMessage = useCallback(async (userInput: string) => {
    const s = stateRef.current;
    if (!userInput.trim() || s.isLoading || s.isTyping) return;

    setState(prev => ({ ...prev, isLoading: true, options: [], error: null }));

    try {
      const response = await callAPI(userInput);
      applyResponse(response);
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        options: stateRef.current.options.length > 0 ? stateRef.current.options : [],
        error: `AI 生成失敗：${err instanceof Error ? err.message : err}`,
      }));
    }
  }, [callAPI, applyResponse]);

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
            width:   { duration: 0.5, ease: "easeOut" },
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
  const [inputValue, setInputValue]  = useState("");
  const [rippleKey, setRippleKey]    = useState<number | null>(null);

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

  // ── Inline styles ────────────────────────────────────────────────────────────

  const outerStyle: React.CSSProperties = {
    position: "fixed", inset: 0,
    backgroundColor: "#cbd5e1",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "16px",
    fontFamily: '"Noto Sans TC", "PingFang TC", sans-serif',
  };

  const panelStyle: React.CSSProperties = {
    position: "relative", width: "100%", maxWidth: "448px",
    height: "90vh", maxHeight: "90vh",
    backgroundColor: "#020617",
    borderRadius: "16px",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6), 0 0 0 4px #1e293b",
    display: "flex", flexDirection: "column", overflow: "hidden",
  };

  return (
    <div style={outerStyle}>
      <div style={panelStyle}>

        {/* 靈氣漣漪 */}
        <AnimatePresence>
          {rippleKey !== null && (
            <motion.div key={rippleKey}
              style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 20 }}
            >
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

        {/* ── HEADER ───────────────────────────────────────────── */}
        <div style={{ flexShrink: 0, backgroundColor: "rgba(15,23,42,0.95)", padding: "14px 16px 12px", borderBottom: "1px solid #1e293b" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ color: "#fbbf24", fontSize: "14px", fontWeight: 600, letterSpacing: "0.1em" }}>
              {state.cultivation}
            </span>
            <span style={{ color: "#475569", fontSize: "11px" }}>
              {state.turn > 0 ? `第 ${state.turn} 回 · ` : ""}壽元{" "}
              <span style={{ color: "#34d399", fontFamily: "monospace" }}>{state.shouYuan}</span> 年
            </span>
          </div>

          <BreathBar label="氣血" value={state.qiXue}   color="#dc2626" />
          <div style={{ marginTop: "6px" }}>
            <BreathBar label="靈力" value={state.lingLi} color="#06b6d4" />
          </div>

          <div style={{ display: "flex", gap: "16px", marginTop: "8px", fontSize: "11px", color: "#475569" }}>
            <span>名聲 <span style={{ color: "#fbbf24", fontFamily: "monospace" }}>{state.mingSheng}</span></span>
            <span>罪惡 <span style={{ color: "#f87171", fontFamily: "monospace" }}>{state.zuiE}</span></span>
          </div>

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

        {/* ── CONTENT ──────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", minHeight: 0 }}>
          {/* 開局 loading */}
          {state.isLoading && state.turn === 0 && !state.displayedNarrative && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "16px" }}>
              <motion.div
                style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid #06b6d4", borderTopColor: "transparent" }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <span style={{ color: "#475569", fontSize: "13px", letterSpacing: "0.1em" }}>天道推演中…</span>
            </div>
          )}

          {/* 敘事文字 */}
          {(state.displayedNarrative || (!state.isLoading && !state.displayedNarrative)) && (
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
          )}

          {/* 既視感隱藏按鈕 */}
          {!isBusy && activeDejaVuKeys.length > 0 && (
            <div style={{ marginTop: "20px", paddingTop: "14px", borderTop: "1px solid rgba(30,41,59,0.8)" }}>
              <p style={{ fontSize: "10px", color: "#475569", fontStyle: "italic", letterSpacing: "0.12em", marginBottom: "8px" }}>
                〔因果共鳴·既視感〕
              </p>
              {activeDejaVuKeys.map(key => (
                <motion.button key={key}
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
            <p style={{ color: "#f87171", fontSize: "12px", marginTop: "12px", padding: "10px", backgroundColor: "rgba(239,68,68,0.1)", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.2)" }}>
              {state.error}
            </p>
          )}
        </div>

        {/* ── FOOTER：輸入框 + 動態選項 ───────────────────────── */}
        <div style={{ flexShrink: 0, backgroundColor: "rgba(15,23,42,0.8)", borderTop: "1px solid #1e293b", padding: "12px" }}>

          {/* 輸入列 */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === "Enter" && onSubmitInput()}
              disabled={isBusy}
              placeholder="輸入自定義行動或對話…"
              style={{ flex: 1, backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "10px", padding: "9px 12px", fontSize: "13px", color: "#f1f5f9", outline: "none", opacity: isBusy ? 0.5 : 1 }}
            />
            <motion.button
              onClick={onSubmitInput}
              disabled={isBusy || !inputValue.trim()}
              whileTap={{ scale: 0.93 }}
              style={{ backgroundColor: isBusy || !inputValue.trim() ? "#1e293b" : "#0ea5e9", border: "none", borderRadius: "10px", padding: "9px 16px", fontSize: "13px", color: "#f1f5f9", cursor: isBusy || !inputValue.trim() ? "not-allowed" : "pointer", flexShrink: 0, transition: "background-color 0.2s" }}
            >
              送出
            </motion.button>
          </div>

          {/* 動態選項 / loading */}
          {state.isLoading && state.turn > 0 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", gap: "8px" }}>
              {[0, 0.2, 0.4].map((delay, i) => (
                <motion.div key={i}
                  style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#06b6d4" }}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay }}
                />
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {state.options.map((opt, i) => (
                <motion.button key={i}
                  onClick={() => fire(opt.action)}
                  disabled={isBusy}
                  whileTap={{ scale: 0.97 }}
                  style={{ width: "100%", textAlign: "left", backgroundColor: "#0f172a", border: "1px solid #1e293b", borderTop: "1px solid #334155", borderBottom: "2px solid #000", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#cbd5e1", cursor: isBusy ? "not-allowed" : "pointer", opacity: isBusy ? 0.4 : 1, lineHeight: 1.5 }}
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
