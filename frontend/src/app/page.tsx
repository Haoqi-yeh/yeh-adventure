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
  殺業:     { label: "【血債血還·既視感】", action: "我感應到體內殺念凝聚，試圖引導這股力量化為神通" },
  悟道:     { label: "【大道至簡·既視感】", action: "那些感悟碎片驟然聚合，我嘗試抓住這一瞬間的頓悟" },
  血債:     { label: "【以血祭道·既視感】", action: "以滿身業力為引，我嘗試踏出一條以殺入道之路" },
  天道感應: { label: "【天道回響·既視感】", action: "我感受到天道的回望，試圖借助這股共鳴突破當前境界" },
};

const CJK_FONT = "'PingFang TC', 'Microsoft JhengHei', 'Noto Sans TC', sans-serif";

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
    isLoading: true,
    turn: 0,
    options: [],
    error: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

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

  const callAPI = useCallback(async (userInput: string | null): Promise<AIGameResponse> => {
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

// ─── StatBar ──────────────────────────────────────────────────────────────────

function StatBar({
  label, value, maxVal = 100, gradientFrom, gradientTo,
}: {
  label: string; value: number; maxVal?: number; gradientFrom: string; gradientTo: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / maxVal) * 100));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{
        color: "#94a3b8", fontSize: "11px", fontWeight: 700,
        width: "22px", flexShrink: 0, letterSpacing: "0.04em",
        fontFamily: CJK_FONT,
      }}>
        {label}
      </span>
      <div style={{
        flex: 1, height: "6px", backgroundColor: "#1e293b",
        borderRadius: "3px", overflow: "hidden",
      }}>
        <motion.div
          style={{
            height: "100%", borderRadius: "3px",
            background: `linear-gradient(90deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
          }}
          animate={{ width: `${pct}%`, opacity: [0.8, 1, 0.8] }}
          transition={{
            width:   { duration: 0.5, ease: "easeOut" },
            opacity: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      </div>
      <span style={{
        color: "#e2e8f0", fontFamily: "monospace", fontSize: "11px",
        width: "54px", textAlign: "right", flexShrink: 0,
      }}>
        {value}&nbsp;/&nbsp;{maxVal}
      </span>
    </div>
  );
}

// ─── DetailPanel ──────────────────────────────────────────────────────────────

function DetailPanel({ state, onClose }: { state: GameState; onClose: () => void }) {
  const basicRows = [
    { label: "氣血",   value: `${state.qiXue} / 100`,  color: "#ef4444" },
    { label: "靈力",   value: `${state.lingLi} / 100`,  color: "#06b6d4" },
    { label: "壽元",   value: `${state.shouYuan} 年`,   color: "#34d399" },
    { label: "修為",   value: state.cultivation,         color: "#fbbf24" },
  ];
  const worldRows = [
    { label: "名聲",   value: `${state.mingSheng}`,  color: "#fbbf24" },
    { label: "罪惡",   value: `${state.zuiE}`,        color: "#f87171" },
    { label: "魅力",   value: "—",                    color: "#a78bfa" },
    { label: "意志",   value: "—",                    color: "#60a5fa" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(4px)", zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        style={{
          backgroundColor: "#0f172a", borderRadius: "16px",
          border: "1px solid #1e293b", padding: "24px", width: "100%",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          fontFamily: CJK_FONT,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <span style={{ color: "#fbbf24", fontSize: "13px", fontWeight: 700, letterSpacing: "0.2em" }}>
            ⟨ 人 物 詳 細 ⟩
          </span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "18px", lineHeight: 1, padding: "2px 6px" }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <p style={{ color: "#334155", fontSize: "10px", letterSpacing: "0.18em", marginBottom: "14px", fontWeight: 700 }}>
              [ 基本屬性 ]
            </p>
            {basicRows.map(row => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "13px" }}>
                <span style={{ color: "#94a3b8", fontSize: "12px" }}>{row.label}</span>
                <span style={{ color: row.color, fontFamily: "monospace", fontSize: "13px", fontWeight: 700 }}>{row.value}</span>
              </div>
            ))}
          </div>
          <div>
            <p style={{ color: "#334155", fontSize: "10px", letterSpacing: "0.18em", marginBottom: "14px", fontWeight: 700 }}>
              [ 世界屬性 ]
            </p>
            {worldRows.map(row => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "13px" }}>
                <span style={{ color: "#94a3b8", fontSize: "12px" }}>{row.label}</span>
                <span style={{ color: row.color, fontFamily: "monospace", fontSize: "13px", fontWeight: 700 }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {state.karmaHistory.length > 0 && (
          <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #1e293b" }}>
            <p style={{ color: "#334155", fontSize: "10px", letterSpacing: "0.18em", marginBottom: "10px", fontWeight: 700 }}>
              [ 因果印記 ]
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {state.karmaHistory.map(tag => (
                <span key={tag} style={{
                  padding: "3px 10px", fontSize: "11px", borderRadius: "6px",
                  backgroundColor: "#1e293b", color: "#94a3b8", border: "1px solid #334155",
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── BagPanel ─────────────────────────────────────────────────────────────────

function BagPanel({ state, onClose }: { state: GameState; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(4px)", zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        style={{
          backgroundColor: "#0f172a", borderRadius: "16px",
          border: "1px solid #1e293b", padding: "24px", width: "100%",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          fontFamily: CJK_FONT,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <span style={{ color: "#fbbf24", fontSize: "13px", fontWeight: 700, letterSpacing: "0.2em" }}>
            ⟨ 背 包 ⟩
          </span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "18px", lineHeight: 1, padding: "2px 6px" }}
          >
            ✕
          </button>
        </div>

        {state.karmaHistory.length === 0 ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "32px 0", color: "#334155", fontSize: "13px", letterSpacing: "0.12em" }}>
            〔 空空如也 〕
          </div>
        ) : (
          <div>
            <p style={{ color: "#334155", fontSize: "10px", letterSpacing: "0.18em", marginBottom: "12px", fontWeight: 700 }}>
              [ 因果印記 ]
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {state.karmaHistory.map(tag => (
                <span key={tag} style={{
                  padding: "6px 14px", fontSize: "12px", borderRadius: "8px",
                  backgroundColor: "#1e293b", color: "#94a3b8", border: "1px solid #334155",
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── HUD button style ─────────────────────────────────────────────────────────

const hudBtnStyle: React.CSSProperties = {
  background: "none",
  border: "1px solid #334155",
  borderRadius: "6px",
  color: "#94a3b8",
  fontSize: "10px",
  letterSpacing: "0.22em",
  padding: "5px 10px",
  cursor: "pointer",
  fontFamily: CJK_FONT,
  lineHeight: 1,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Page() {
  const { state, handleSendMessage } = useGameState();
  const [inputValue, setInputValue]  = useState("");
  const [rippleKey, setRippleKey]    = useState<number | null>(null);
  const [showDetail, setShowDetail]  = useState(false);
  const [showBag, setShowBag]        = useState(false);

  const activeDejaVuKeys = Object.keys(DEJA_VU_TRIGGERS).filter(k =>
    state.karmaHistory.includes(k as KarmaTag)
  );

  const fire = (action: string) => {
    if (!action.trim()) return;
    setRippleKey(Date.now());
    handleSendMessage(action);
  };

  const onSubmitInput = () => {
    if (!inputValue.trim()) return;
    fire(inputValue);
    setInputValue("");
  };

  const isBusy = state.isLoading || state.isTyping;

  return (
    <div style={{
      position: "fixed", inset: 0,
      backgroundColor: "#cbd5e1",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px",
      fontFamily: CJK_FONT,
    }}>
      <div style={{
        position: "relative", width: "100%", maxWidth: "448px",
        height: "90vh", maxHeight: "90vh",
        backgroundColor: "#020617",
        borderRadius: "16px",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6), 0 0 0 4px #1e293b",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>

        {/* ── 靈氣漣漪 ─────────────────────────────────────────── */}
        <AnimatePresence>
          {rippleKey !== null && (
            <motion.div key={rippleKey} style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              pointerEvents: "none", zIndex: 20,
            }}>
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

        {/* ── HUD ──────────────────────────────────────────────── */}
        <div style={{
          flexShrink: 0,
          backgroundColor: "rgba(2, 6, 23, 0.80)",
          backdropFilter: "blur(12px)",
          padding: "12px 14px 10px",
          borderBottom: "1px solid rgba(30,41,59,0.8)",
        }}>
          {/* 修為 + 壽元 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ color: "#fbbf24", fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em" }}>
              {state.cultivation}
            </span>
            <span style={{ color: "#475569", fontSize: "11px" }}>
              {state.turn > 0 ? `第 ${state.turn} 回 · ` : ""}
              壽元&nbsp;
              <span style={{ color: "#34d399", fontFamily: "monospace" }}>{state.shouYuan}</span> 年
            </span>
          </div>

          {/* HP bar */}
          <StatBar label="HP" value={state.qiXue} gradientFrom="#dc2626" gradientTo="#ef4444" />
          <div style={{ marginTop: "6px" }}>
            <StatBar label="MP" value={state.lingLi} gradientFrom="#0ea5e9" gradientTo="#06b6d4" />
          </div>

          {/* 名聲 / 罪惡 + 功能鍵 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
            <div style={{ display: "flex", gap: "14px", fontSize: "11px", color: "#475569" }}>
              <span>名聲&nbsp;<span style={{ color: "#fbbf24", fontFamily: "monospace" }}>{state.mingSheng}</span></span>
              <span>罪惡&nbsp;<span style={{ color: "#f87171", fontFamily: "monospace" }}>{state.zuiE}</span></span>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <button style={hudBtnStyle} onClick={() => setShowDetail(true)}>〔 詳 細 〕</button>
              <button style={hudBtnStyle} onClick={() => setShowBag(true)}>〔 背 包 〕</button>
            </div>
          </div>
        </div>

        {/* ── CONTENT ──────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 12px", minHeight: 0 }}>

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
            <p style={{ color: "#f1f5f9", fontSize: "14px", lineHeight: 1.9, letterSpacing: "0.04em", margin: 0 }}>
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

          {/* 既視感 */}
          {!isBusy && activeDejaVuKeys.length > 0 && (
            <div style={{ marginTop: "20px", paddingTop: "14px", borderTop: "1px solid rgba(30,41,59,0.8)" }}>
              <p style={{ fontSize: "10px", color: "#475569", fontStyle: "italic", letterSpacing: "0.12em", marginBottom: "8px" }}>
                〔因果共鳴·既視感〕
              </p>
              {activeDejaVuKeys.map(key => (
                <motion.button key={key}
                  onClick={() => fire(DEJA_VU_TRIGGERS[key].action)}
                  whileTap={{ scale: 0.97 }}
                  style={{ display: "block", width: "100%", textAlign: "left", fontSize: "12px", color: "rgba(251,191,36,0.85)", border: "1px solid rgba(120,53,15,0.35)", borderRadius: "10px", padding: "10px 14px", backgroundColor: "rgba(69,26,3,0.25)", cursor: "pointer", marginBottom: "6px", fontFamily: CJK_FONT }}
                >
                  {DEJA_VU_TRIGGERS[key].label}
                </motion.button>
              ))}
            </div>
          )}

          {/* 錯誤 */}
          {state.error && (
            <p style={{ color: "#f87171", fontSize: "12px", marginTop: "12px", padding: "10px", backgroundColor: "rgba(239,68,68,0.1)", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.2)" }}>
              {state.error}
            </p>
          )}
        </div>

        {/* ── FOOTER ───────────────────────────────────────────── */}
        <div style={{ flexShrink: 0, backgroundColor: "rgba(15,23,42,0.9)", borderTop: "1px solid #1e293b", padding: "12px" }}>

          {/* 輸入列 */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === "Enter" && onSubmitInput()}
              disabled={isBusy}
              placeholder={isBusy ? "思考中…" : "輸入自定義行動或對話…"}
              style={{
                flex: 1,
                backgroundColor: isBusy ? "#080e1c" : "#0f172a",
                border: "1px solid #334155", borderRadius: "10px",
                padding: "9px 12px", fontSize: "13px", color: "#f1f5f9",
                outline: "none",
                opacity: isBusy ? 0.55 : 1,
                transition: "background-color 0.3s, opacity 0.3s",
                fontFamily: CJK_FONT,
              }}
            />
            <motion.button
              onClick={onSubmitInput}
              disabled={isBusy || !inputValue.trim()}
              whileTap={!isBusy && !!inputValue.trim() ? { scale: 0.93 } : {}}
              style={{
                backgroundColor: isBusy || !inputValue.trim() ? "#1e293b" : "#0ea5e9",
                border: "none", borderRadius: "10px",
                padding: "9px 0", fontSize: "13px",
                color: isBusy ? "#475569" : "#f1f5f9",
                cursor: isBusy || !inputValue.trim() ? "not-allowed" : "pointer",
                flexShrink: 0, width: "64px",
                transition: "background-color 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {isBusy ? (
                <motion.div
                  style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #475569", borderTopColor: "#94a3b8" }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
              ) : "送出"}
            </motion.button>
          </div>

          {/* 選項列表 / 等待動畫 */}
          {state.isLoading && state.turn > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 14px" }}>
              {[0, 0.18, 0.36].map((delay, i) => (
                <motion.div key={i}
                  style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#06b6d4" }}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay }}
                />
              ))}
              <span style={{ color: "#475569", fontSize: "12px", marginLeft: "4px", letterSpacing: "0.06em" }}>思考中…</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {state.options.map((opt, i) => (
                <motion.button key={i}
                  onClick={() => fire(opt.action)}
                  disabled={isBusy}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    width: "100%", textAlign: "left",
                    backgroundColor: "#0f172a",
                    border: "1px solid #1e293b",
                    borderTop: "1px solid #334155",
                    borderBottom: "2px solid #000",
                    borderRadius: "10px", padding: "10px 14px",
                    fontSize: "13px", color: "#cbd5e1",
                    cursor: isBusy ? "not-allowed" : "pointer",
                    opacity: isBusy ? 0.4 : 1, lineHeight: 1.55,
                    fontFamily: CJK_FONT,
                  }}
                >
                  <span style={{ color: "#334155", marginRight: "8px", fontFamily: "monospace", fontSize: "11px" }}>
                    {i + 1}
                  </span>
                  {opt.label}
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* ── 彈窗 ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {showDetail && <DetailPanel state={state} onClose={() => setShowDetail(false)} />}
        </AnimatePresence>
        <AnimatePresence>
          {showBag && <BagPanel state={state} onClose={() => setShowBag(false)} />}
        </AnimatePresence>

      </div>
    </div>
  );
}
