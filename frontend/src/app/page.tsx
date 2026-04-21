"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ───────────────────────────────────────────────────────────────────

type KarmaTag =
  | "修煉" | "吐納" | "淬體" | "悟道"
  | "遊歷" | "問道" | "採集" | "煉丹"
  | "殺業" | "御器" | "神通" | "逃遁"
  | "血債" | "天道感應" | "業火" | "渡劫";

interface NPC {
  name: string;
  relation: string;
  favor: number; // -100 ~ 100
  gender?: string;
  physicalDescription?: string;
}

interface CaveState {
  lingQiLevel: number;
  facilities: string[];
}

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
    ageAdd?: number;
    mingSheng?: number;
    zuiE?: number;
    karmaTag?: KarmaTag;
  };
  newCharacters?: NPC[];
  characterUpdates?: { name: string; favorDelta: number }[];
  imagePrompt?: string;
  eventLog?: { type: string; text: string }[];
  itemsAdded?: string[];
}

interface GameState {
  qiXue: number;
  lingLi: number;
  age: number;
  shouYuan: number;
  mingSheng: number;
  zuiE: number;
  karmaHistory: KarmaTag[];
  characters: NPC[];
  cultivation: string;
  cultivationLevel: number;
  playerName: string;
  imagePrompt: string;
  eventLog: { id: number; type: string; text: string }[];
  displayedNarrative: string;
  isTyping: boolean;
  isLoading: boolean;
  turn: number;
  options: StoryOption[];
  error: string | null;
  inventory: string[];
  cave: CaveState;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CULTIVATION_STAGES = [
  "煉氣一層", "煉氣五層", "煉氣九層",
  "築基初期", "築基中期", "築基圓滿",
  "金丹初期", "金丹後期", "元嬰初期",
  "化神境",
];

const CULTIVATION_SHOUYUAN = [100, 100, 100, 500, 500, 500, 2000, 2000, 5000, 50000];

const DEJA_VU_TRIGGERS: Record<string, { label: string; action: string }> = {
  殺業:     { label: "【血債血還·既視感】", action: "我感應到體內殺念凝聚，試圖引導這股力量化為神通" },
  悟道:     { label: "【大道至簡·既視感】", action: "那些感悟碎片驟然聚合，我嘗試抓住這一瞬間的頓悟" },
  血債:     { label: "【以血祭道·既視感】", action: "以滿身業力為引，我嘗試踏出一條以殺入道之路" },
  天道感應: { label: "【天道回響·既視感】", action: "我感受到天道的回望，試圖借助這股共鳴突破當前境界" },
};

const CJK = "'PingFang TC', 'Microsoft JhengHei', 'Noto Sans TC', sans-serif";

const LOG_COLORS: Record<string, string> = {
  "屬性": "#fbbf24",
  "獲取": "#34d399",
  "世界": "#818cf8",
  "戰況": "#f87171",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, v));
}

// ─── useGameState ─────────────────────────────────────────────────────────────

function useGameState() {
  const [state, setState] = useState<GameState>({
    qiXue: 80, lingLi: 60,
    age: 18, shouYuan: 100,
    mingSheng: 10, zuiE: 0,
    karmaHistory: [], characters: [],
    cultivation: CULTIVATION_STAGES[0], cultivationLevel: 0,
    playerName: "無名散修", imagePrompt: "", eventLog: [],
    displayedNarrative: "", isTyping: false, isLoading: true,
    turn: 0, options: [], error: null,
    inventory: [],
    cave: { lingQiLevel: 1, facilities: [] },
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const runTypewriter = useCallback((text: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    let i = 0;
    setState(s => ({ ...s, displayedNarrative: "", isTyping: true }));
    timerRef.current = setInterval(() => {
      i++;
      const done = i >= text.length;
      setState(s => ({ ...s, displayedNarrative: text.slice(0, i), isTyping: !done }));
      if (done) clearInterval(timerRef.current!);
    }, 38);
  }, []);

  const applyResponse = useCallback((res: AIGameResponse, isStart = false) => {
    setState(prev => {
      const c = res.statChanges ?? {};

      // cultivation
      const rawLingLi = isStart ? prev.lingLi : prev.lingLi + (c.lingLi ?? 0);
      let newLevel = prev.cultivationLevel;
      if (rawLingLi >= 100 && prev.cultivationLevel < CULTIVATION_STAGES.length - 1) {
        newLevel = prev.cultivationLevel + 1;
      }

      // karma
      const newKarma = c.karmaTag && !prev.karmaHistory.includes(c.karmaTag)
        ? ([...prev.karmaHistory, c.karmaTag] as KarmaTag[])
        : prev.karmaHistory;

      // NPCs
      let chars = [...prev.characters];
      if (res.newCharacters) {
        res.newCharacters.forEach(npc => {
          if (!chars.find(ch => ch.name === npc.name)) chars.push(npc);
        });
      }
      if (res.characterUpdates) {
        res.characterUpdates.forEach(upd => {
          const idx = chars.findIndex(ch => ch.name === upd.name);
          if (idx >= 0) chars[idx] = { ...chars[idx], favor: clamp(chars[idx].favor + upd.favorDelta, -100, 100) };
        });
      }

      return {
        ...prev,
        qiXue:     isStart ? prev.qiXue     : clamp(prev.qiXue     + (c.qiXue     ?? 0)),
        lingLi:    newLevel > prev.cultivationLevel ? 20 : clamp(rawLingLi),
        age:       isStart ? prev.age        : prev.age + (c.ageAdd  ?? 0),
        shouYuan:  CULTIVATION_SHOUYUAN[newLevel],
        mingSheng: isStart ? prev.mingSheng  : clamp(prev.mingSheng + (c.mingSheng ?? 0)),
        zuiE:      isStart ? prev.zuiE       : clamp(prev.zuiE      + (c.zuiE      ?? 0)),
        karmaHistory: newKarma,
        characters: chars,
        cultivation:     CULTIVATION_STAGES[newLevel],
        cultivationLevel: newLevel,
        imagePrompt: res.imagePrompt ?? prev.imagePrompt,
        inventory: isStart
          ? []
          : Array.from(new Set([...prev.inventory, ...(res.itemsAdded ?? [])])),
        eventLog: isStart ? [] : [
          ...prev.eventLog,
          ...(res.eventLog ?? []).map((e, i) => ({
            id: Date.now() + i,
            type: e.type,
            text: e.text,
          })),
        ],
        turn:    isStart ? 0 : prev.turn + 1,
        options: res.options ?? [],
        isLoading: false, error: null,
      };
    });
    runTypewriter(res.narrative);
  }, [runTypewriter]);

  const callAPI = useCallback(async (userInput: string | null): Promise<AIGameResponse> => {
    const s = stateRef.current;
    const body = userInput === null
      ? { isStart: true }
      : {
          userInput,
          stats: {
            qiXue: s.qiXue, lingLi: s.lingLi,
            age: s.age, shouYuan: s.shouYuan,
            mingSheng: s.mingSheng, zuiE: s.zuiE,
            cultivation: s.cultivation,
            karmaHistory: s.karmaHistory,
            characters: s.characters,
            turn: s.turn,
          },
        };

    const res = await fetch("/api/game", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<AIGameResponse>;
  }, []);

  useEffect(() => {
    callAPI(null)
      .then(r => applyResponse(r, true))
      .catch(err => setState(s => ({
        ...s, isLoading: false, displayedNarrative: "",
        error: `開局失敗：${err instanceof Error ? err.message : err}`,
      })));
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendMessage = useCallback(async (userInput: string) => {
    const s = stateRef.current;
    if (!userInput.trim() || s.isLoading || s.isTyping) return;
    setState(p => ({ ...p, isLoading: true, options: [], error: null }));
    try {
      const r = await callAPI(userInput);
      applyResponse(r);
    } catch (err) {
      setState(p => ({
        ...p, isLoading: false,
        options: stateRef.current.options,
        error: `AI 生成失敗：${err instanceof Error ? err.message : err}`,
      }));
    }
  }, [callAPI, applyResponse]);

  return { state, handleSendMessage };
}

// ─── StatBar ──────────────────────────────────────────────────────────────────

function StatBar({ label, value, maxVal = 100, from, to }: {
  label: string; value: number; maxVal?: number; from: string; to: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / maxVal) * 100));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{ color: "#94a3b8", fontSize: "11px", fontWeight: 700, width: "22px", flexShrink: 0, fontFamily: CJK }}>
        {label}
      </span>
      <div style={{ flex: 1, height: "6px", backgroundColor: "#1e293b", borderRadius: "3px", overflow: "hidden" }}>
        <motion.div
          style={{ height: "100%", borderRadius: "3px", background: `linear-gradient(90deg, ${from} 0%, ${to} 100%)` }}
          animate={{ width: `${pct}%`, opacity: [0.8, 1, 0.8] }}
          transition={{ width: { duration: 0.5, ease: "easeOut" }, opacity: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } }}
        />
      </div>
      <span style={{ color: "#e2e8f0", fontFamily: "monospace", fontSize: "11px", width: "54px", textAlign: "right", flexShrink: 0 }}>
        {value}&nbsp;/&nbsp;{maxVal}
      </span>
    </div>
  );
}

// ─── FavorBar ─────────────────────────────────────────────────────────────────

function FavorBar({ favor }: { favor: number }) {
  const pct = Math.abs(favor);
  const isPos = favor >= 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1 }}>
      <div style={{ flex: 1, height: "4px", backgroundColor: "#1e293b", borderRadius: "2px", overflow: "hidden", position: "relative" }}>
        <motion.div
          style={{
            position: "absolute", top: 0, height: "100%", borderRadius: "2px",
            left: isPos ? "50%" : `${50 - pct / 2}%`,
            background: isPos ? "#34d399" : "#f87171",
          }}
          animate={{ width: `${pct / 2}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
        <div style={{ position: "absolute", left: "50%", top: 0, width: "1px", height: "100%", backgroundColor: "#334155" }} />
      </div>
      <span style={{ color: isPos ? "#34d399" : "#f87171", fontFamily: "monospace", fontSize: "10px", width: "28px", textAlign: "right", flexShrink: 0 }}>
        {favor > 0 ? "+" : ""}{favor}
      </span>
    </div>
  );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function Modal({ onClose, title, children }: {
  onClose: () => void; title: string; children: React.ReactNode;
}) {
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
          border: "1px solid #1e293b", padding: "22px", width: "100%",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)", fontFamily: CJK,
          maxHeight: "80vh", overflowY: "auto",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <span style={{ color: "#fbbf24", fontSize: "13px", fontWeight: 700, letterSpacing: "0.2em" }}>
            {title}
          </span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "18px", lineHeight: 1, padding: "2px 6px" }}
          >
            ✕
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

// ─── DetailPanel ──────────────────────────────────────────────────────────────

function DetailPanel({ state, onClose }: { state: GameState; onClose: () => void }) {
  const basicRows = [
    { label: "氣血", value: `${state.qiXue} / 100`, color: "#ef4444" },
    { label: "靈力", value: `${state.lingLi} / 100`, color: "#06b6d4" },
    { label: "壽元", value: `${state.age} / ${state.shouYuan}`, color: "#34d399" },
  ];
  const worldRows = [
    { label: "名聲", value: `${state.mingSheng}`, color: "#fbbf24" },
    { label: "罪惡", value: `${state.zuiE}`,      color: "#f87171" },
    { label: "魅力", value: "—",                   color: "#a78bfa" },
    { label: "意志", value: "—",                   color: "#60a5fa" },
  ];
  return (
    <Modal onClose={onClose} title="⟨ 人 物 詳 細 ⟩">
      {/* 境界 */}
      <div style={{ textAlign: "center", marginBottom: "18px", padding: "12px 0", borderBottom: "1px solid #1e293b" }}>
        <p style={{ color: "#475569", fontSize: "10px", letterSpacing: "0.18em", marginBottom: "6px" }}>[ 修為境界 ]</p>
        <span style={{ color: "#fbbf24", fontSize: "18px", fontWeight: 700, letterSpacing: "0.12em" }}>
          {state.cultivation}
        </span>
        {state.turn > 0 && (
          <span style={{ color: "#334155", fontSize: "11px", marginLeft: "10px", fontFamily: "monospace" }}>
            第 {state.turn} 回合
          </span>
        )}
      </div>

      {/* 兩欄屬性 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div>
          <p style={{ color: "#334155", fontSize: "10px", letterSpacing: "0.18em", marginBottom: "12px", fontWeight: 700 }}>[ 基本屬性 ]</p>
          {basicRows.map(row => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" }}>
              <span style={{ color: "#94a3b8", fontSize: "12px" }}>{row.label}</span>
              <span style={{ color: row.color, fontFamily: "monospace", fontSize: "12px", fontWeight: 700 }}>{row.value}</span>
            </div>
          ))}
        </div>
        <div>
          <p style={{ color: "#334155", fontSize: "10px", letterSpacing: "0.18em", marginBottom: "12px", fontWeight: 700 }}>[ 世界屬性 ]</p>
          {worldRows.map(row => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" }}>
              <span style={{ color: "#94a3b8", fontSize: "12px" }}>{row.label}</span>
              <span style={{ color: row.color, fontFamily: "monospace", fontSize: "12px", fontWeight: 700 }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 因果 */}
      {state.karmaHistory.length > 0 && (
        <div style={{ paddingTop: "14px", borderTop: "1px solid #1e293b" }}>
          <p style={{ color: "#334155", fontSize: "10px", letterSpacing: "0.18em", marginBottom: "10px", fontWeight: 700 }}>[ 因果印記 ]</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {state.karmaHistory.map(tag => (
              <span key={tag} style={{ padding: "3px 10px", fontSize: "11px", borderRadius: "6px", backgroundColor: "#1e293b", color: "#94a3b8", border: "1px solid #334155" }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── CharactersPanel ──────────────────────────────────────────────────────────

function CharactersPanel({ state, onClose }: { state: GameState; onClose: () => void }) {
  return (
    <Modal onClose={onClose} title="⟨ 人 物 關 係 ⟩">
      {state.characters.length === 0 ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "32px 0", color: "#334155", fontSize: "13px", letterSpacing: "0.12em" }}>
          〔 尚未結識任何人 〕
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {state.characters.map(npc => (
            <div key={npc.name} style={{ padding: "12px 14px", backgroundColor: "#0f1929", borderRadius: "10px", border: "1px solid #1e293b" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ color: "#f1f5f9", fontSize: "13px", fontWeight: 700 }}>{npc.name}</span>
                <span style={{ color: "#64748b", fontSize: "11px", backgroundColor: "#1e293b", padding: "2px 8px", borderRadius: "4px" }}>
                  {npc.relation}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#475569", fontSize: "10px", flexShrink: 0 }}>好感</span>
                <FavorBar favor={npc.favor} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

// ─── LandscapePanel ───────────────────────────────────────────────────────────

function LandscapePanel({ narrative, imagePrompt, onClose }: {
  narrative: string; imagePrompt: string; onClose: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const imageUrl = imagePrompt
    ? `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt + ", wuxia cultivation fantasy, cinematic lighting, painterly")}?width=512&height=288&nologo=true`
    : "";

  return (
    <Modal onClose={onClose} title="⟨ 眼 前 的 風 景 ⟩">
      {/* 圖片區 */}
      <div style={{
        width: "100%", aspectRatio: "16/9", borderRadius: "10px",
        border: "1px solid #1e293b", overflow: "hidden", position: "relative",
        background: "linear-gradient(135deg, #020617 0%, #0c1a35 50%, #020617 100%)",
        marginBottom: "14px",
      }}>
        {imageUrl && !imgError ? (
          <>
            {!loaded && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                <motion.div
                  style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #06b6d4", borderTopColor: "transparent" }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <span style={{ color: "#334155", fontSize: "11px", letterSpacing: "0.15em" }}>靈境感知中…</span>
              </div>
            )}
            <img
              src={imageUrl} alt=""
              onLoad={() => setLoaded(true)}
              onError={() => setImgError(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: loaded ? 1 : 0, transition: "opacity 0.6s ease" }}
            />
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "10px" }}>
            <motion.div animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 3, repeat: Infinity }} style={{ fontSize: "28px" }}>✦</motion.div>
            <span style={{ color: "#334155", fontSize: "11px", letterSpacing: "0.18em" }}>靈境感知尚未開啟</span>
          </div>
        )}
      </div>

      {/* 場景描述 */}
      {narrative && (
        <div style={{ padding: "12px 14px", backgroundColor: "#080e1c", borderRadius: "10px", border: "1px solid #1e293b" }}>
          <p style={{ color: "#475569", fontSize: "10px", letterSpacing: "0.15em", marginBottom: "8px" }}>[ 當前場景 ]</p>
          <p style={{ color: "#94a3b8", fontSize: "12px", lineHeight: 1.8, letterSpacing: "0.04em", margin: 0 }}>
            {narrative.slice(0, 120)}{narrative.length > 120 ? "…" : ""}
          </p>
        </div>
      )}
    </Modal>
  );
}

// ─── BagPanel ─────────────────────────────────────────────────────────────────

function BagPanel({ state, onClose }: { state: GameState; onClose: () => void }) {
  const hasItems = state.inventory.length > 0;
  const hasKarma = state.karmaHistory.length > 0;
  return (
    <Modal onClose={onClose} title="⟨ 背 包 ⟩">
      {!hasItems && !hasKarma ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "32px 0", color: "#334155", fontSize: "13px", letterSpacing: "0.12em" }}>
          〔 空空如也 〕
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {hasItems && (
            <div>
              <p style={{ color: "#334155", fontSize: "10px", letterSpacing: "0.18em", marginBottom: "12px", fontWeight: 700 }}>[ 持有物品 ]</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {state.inventory.map(item => (
                  <span key={item} style={{
                    padding: "6px 14px", fontSize: "12px", borderRadius: "8px",
                    backgroundColor: "#0f172a", color: "#7dd3fc",
                    border: "1px solid #1e3a5f", letterSpacing: "0.05em",
                  }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
          {hasKarma && (
            <div>
              <p style={{ color: "#334155", fontSize: "10px", letterSpacing: "0.18em", marginBottom: "12px", fontWeight: 700 }}>[ 因果印記 ]</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {state.karmaHistory.map(tag => (
                  <span key={tag} style={{
                    padding: "6px 14px", fontSize: "12px", borderRadius: "8px",
                    backgroundColor: "#1e293b", color: "#94a3b8",
                    border: "1px solid #334155",
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// ─── HUD button style ─────────────────────────────────────────────────────────

const hudBtn: React.CSSProperties = {
  background: "none", border: "1px solid #334155", borderRadius: "6px",
  color: "#94a3b8", fontSize: "10px", letterSpacing: "0.18em",
  padding: "4px 8px", cursor: "pointer", fontFamily: CJK, lineHeight: 1,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Page() {
  const { state, handleSendMessage } = useGameState();
  const [inputValue, setInputValue]     = useState("");
  const [rippleKey, setRippleKey]       = useState<number | null>(null);
  const [showDetail, setShowDetail]     = useState(false);
  const [showChars, setShowChars]       = useState(false);
  const [showLandscape, setShowLandscape] = useState(false);
  const [showBag, setShowBag]           = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [state.eventLog.length]);

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
      position: "fixed", inset: 0, backgroundColor: "#cbd5e1",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px", fontFamily: CJK,
    }}>
      <div style={{
        position: "relative", width: "100%", maxWidth: "448px",
        height: "90vh", maxHeight: "90vh",
        backgroundColor: "#020617", borderRadius: "16px",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6), 0 0 0 4px #1e293b",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>

        {/* 靈氣漣漪 */}
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

        {/* ── HUD ──────────────────────────────────────────────── */}
        <div style={{
          flexShrink: 0, backgroundColor: "rgba(2,6,23,0.80)",
          backdropFilter: "blur(12px)", padding: "12px 14px 10px",
          borderBottom: "1px solid rgba(30,41,59,0.8)",
        }}>
          {/* Row 1: 玩家名 + 眼前的風景 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ color: "#cbd5e1", fontSize: "13px", fontWeight: 700, letterSpacing: "0.15em" }}>
              〔&nbsp;{state.playerName}&nbsp;〕
            </span>
            <button style={{ ...hudBtn, color: "#7dd3fc", borderColor: "#1e3a5f", letterSpacing: "0.15em" }} onClick={() => setShowLandscape(true)}>
              〔 眼前的風景 〕
            </button>
          </div>

          {/* HP / MP */}
          <StatBar label="HP" value={state.qiXue}  from="#dc2626" to="#ef4444" />
          <div style={{ marginTop: "6px" }}>
            <StatBar label="MP" value={state.lingLi} from="#0ea5e9" to="#06b6d4" />
          </div>

          {/* Row 4: 名聲/罪惡 + 功能鍵 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
            <div style={{ display: "flex", gap: "14px", fontSize: "11px", color: "#475569" }}>
              <span>名聲&nbsp;<span style={{ color: "#fbbf24", fontFamily: "monospace" }}>{state.mingSheng}</span></span>
              <span>罪惡&nbsp;<span style={{ color: "#f87171", fontFamily: "monospace" }}>{state.zuiE}</span></span>
            </div>
            <div style={{ display: "flex", gap: "5px" }}>
              <button style={hudBtn} onClick={() => setShowDetail(true)}>〔 詳細 〕</button>
              <button style={hudBtn} onClick={() => setShowChars(true)}>〔 人物 〕</button>
              <button style={hudBtn} onClick={() => setShowBag(true)}>〔 背包 〕</button>
            </div>
          </div>
        </div>

        {/* ── CONTENT 70/30 ────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>

          {/* 沉浸故事區 70% */}
          <div style={{ flex: 7, overflowY: "auto", padding: "20px 20px 12px", minHeight: 0 }}>

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

            {!isBusy && activeDejaVuKeys.length > 0 && (
              <div style={{ marginTop: "20px", paddingTop: "14px", borderTop: "1px solid rgba(30,41,59,0.8)" }}>
                <p style={{ fontSize: "10px", color: "#475569", fontStyle: "italic", letterSpacing: "0.12em", marginBottom: "8px" }}>〔因果共鳴·既視感〕</p>
                {activeDejaVuKeys.map(key => (
                  <motion.button key={key} onClick={() => fire(DEJA_VU_TRIGGERS[key].action)} whileTap={{ scale: 0.97 }}
                    style={{ display: "block", width: "100%", textAlign: "left", fontSize: "12px", color: "rgba(251,191,36,0.85)", border: "1px solid rgba(120,53,15,0.35)", borderRadius: "10px", padding: "10px 14px", backgroundColor: "rgba(69,26,3,0.25)", cursor: "pointer", marginBottom: "6px", fontFamily: CJK }}>
                    {DEJA_VU_TRIGGERS[key].label}
                  </motion.button>
                ))}
              </div>
            )}

            {state.error && (
              <p style={{ color: "#f87171", fontSize: "12px", marginTop: "12px", padding: "10px", backgroundColor: "rgba(239,68,68,0.1)", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.2)" }}>
                {state.error}
              </p>
            )}
          </div>

          {/* 遊戲戰報區 30% */}
          <div style={{ flex: 3, display: "flex", flexDirection: "column", borderTop: "1px solid #334155", backgroundColor: "#040810", minHeight: 0 }}>

            {/* 戰報標題列 */}
            <div style={{ padding: "5px 14px 4px", borderBottom: "1px solid rgba(51,65,85,0.4)", flexShrink: 0 }}>
              <span style={{ color: "#1e3a5f", fontSize: "10px", letterSpacing: "0.22em", fontFamily: "monospace" }}>── 戰 報 ──</span>
            </div>

            {/* 戰報條目 */}
            <div ref={logRef} style={{ flex: 1, overflowY: "auto", padding: "6px 14px 2px", minHeight: 0 }}>
              {state.eventLog.length === 0 ? (
                <span style={{ color: "#1e293b", fontSize: "11px", letterSpacing: "0.12em", fontFamily: "monospace" }}>〔 尚無戰報 〕</span>
              ) : (
                <AnimatePresence initial={false}>
                  {state.eventLog.map(entry => (
                    <motion.div key={entry.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ display: "flex", gap: "5px", marginBottom: "3px", fontFamily: "monospace", fontSize: "11px", lineHeight: 1.65 }}
                    >
                      <span style={{ color: LOG_COLORS[entry.type] ?? "#94a3b8", flexShrink: 0 }}>【{entry.type}】</span>
                      <span style={{ color: "#475569" }}>{entry.text}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* 掃描線 */}
            <div style={{ height: "1px", overflow: "hidden", flexShrink: 0 }}>
              <motion.div
                style={{ width: "100%", height: "100%", background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.45), transparent)" }}
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
              />
            </div>
          </div>
        </div>

        {/* ── FOOTER ───────────────────────────────────────────── */}
        <div style={{ flexShrink: 0, backgroundColor: "rgba(15,23,42,0.9)", borderTop: "1px solid #1e293b", padding: "12px" }}>

          <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === "Enter" && onSubmitInput()}
              disabled={isBusy}
              placeholder={isBusy ? "思考中…" : "輸入自定義行動或對話…"}
              style={{
                flex: 1, backgroundColor: isBusy ? "#080e1c" : "#0f172a",
                border: "1px solid #334155", borderRadius: "10px",
                padding: "9px 12px", fontSize: "13px", color: "#f1f5f9",
                outline: "none", opacity: isBusy ? 0.55 : 1,
                transition: "background-color 0.3s, opacity 0.3s", fontFamily: CJK,
              }}
            />
            <motion.button
              onClick={onSubmitInput}
              disabled={isBusy || !inputValue.trim()}
              whileTap={!isBusy && !!inputValue.trim() ? { scale: 0.93 } : {}}
              style={{
                backgroundColor: isBusy || !inputValue.trim() ? "#1e293b" : "#0ea5e9",
                border: "none", borderRadius: "10px", padding: "9px 0",
                color: isBusy ? "#475569" : "#f1f5f9",
                cursor: isBusy || !inputValue.trim() ? "not-allowed" : "pointer",
                flexShrink: 0, width: "64px", transition: "background-color 0.2s",
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

          {state.isLoading && state.turn > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 14px" }}>
              {[0, 0.18, 0.36].map((delay, i) => (
                <motion.div key={i}
                  style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#06b6d4" }}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay }}
                />
              ))}
              <span style={{ color: "#475569", fontSize: "12px", marginLeft: "4px" }}>思考中…</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {state.options.map((opt, i) => (
                <motion.button key={i} onClick={() => fire(opt.action)} disabled={isBusy} whileTap={{ scale: 0.97 }}
                  style={{
                    width: "100%", textAlign: "left", backgroundColor: "#0f172a",
                    border: "1px solid #1e293b", borderTop: "1px solid #334155", borderBottom: "2px solid #000",
                    borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#cbd5e1",
                    cursor: isBusy ? "not-allowed" : "pointer", opacity: isBusy ? 0.4 : 1,
                    lineHeight: 1.55, fontFamily: CJK,
                  }}>
                  <span style={{ color: "#334155", marginRight: "8px", fontFamily: "monospace", fontSize: "11px" }}>{i + 1}</span>
                  {opt.label}
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* ── 彈窗 ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {showDetail    && <DetailPanel     state={state} onClose={() => setShowDetail(false)} />}
          {showChars     && <CharactersPanel state={state} onClose={() => setShowChars(false)} />}
          {showLandscape && <LandscapePanel narrative={state.displayedNarrative} imagePrompt={state.imagePrompt} onClose={() => setShowLandscape(false)} />}
          {showBag       && <BagPanel        state={state} onClose={() => setShowBag(false)} />}
        </AnimatePresence>

      </div>
    </div>
  );
}
