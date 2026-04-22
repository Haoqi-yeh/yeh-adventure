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
  alias?: string;
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
  maxQiXue: number;
  maxLingLi: number;
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
  "修為": "#a78bfa",
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
    maxQiXue: 100,
    maxLingLi: 100,
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
      const didLevelUp = newLevel > prev.cultivationLevel;
      const newMaxQiXue  = didLevelUp ? Math.round(prev.maxQiXue  * 1.2) : prev.maxQiXue;
      const newMaxLingLi = didLevelUp ? Math.round(prev.maxLingLi * 1.2) : prev.maxLingLi;

      // 修為 log entries (client-generated)
      const expGain = c.lingLi ?? 0;
      const cultivationLogs: { id: number; type: string; text: string }[] = [];
      const now = Date.now();
      if (!isStart && expGain > 0) {
        cultivationLogs.push({ id: now, type: "修為", text: `獲得 ${expGain} 點修為（${Math.min(rawLingLi, 100)} / 100）` });
      }
      if (didLevelUp) {
        cultivationLogs.push({ id: now + 1, type: "修為", text: `境界突破！晉升至【${CULTIVATION_STAGES[newLevel]}】，氣血補滿至 ${newMaxQiXue}` });
      }

      // karma
      const newKarma = c.karmaTag && !prev.karmaHistory.includes(c.karmaTag)
        ? ([...prev.karmaHistory, c.karmaTag] as KarmaTag[])
        : prev.karmaHistory;

      // NPCs
      let chars = [...prev.characters];
      if (res.newCharacters) {
        res.newCharacters.forEach(npc => {
          // alias reveal: "神秘老人" → "青雲長老"
          const aliasIdx = npc.alias
            ? chars.findIndex(ch => ch.name === npc.alias || ch.alias === npc.alias)
            : -1;
          if (aliasIdx >= 0) {
            // merge: update identity, preserve favor and portrait if not re-supplied
            chars[aliasIdx] = {
              ...chars[aliasIdx],
              name:                npc.name,
              relation:            npc.relation,
              alias:               npc.alias,
              gender:              npc.gender              ?? chars[aliasIdx].gender,
              physicalDescription: npc.physicalDescription ?? chars[aliasIdx].physicalDescription,
            };
          } else if (!chars.find(ch => ch.name === npc.name)) {
            chars.push(npc);
          }
        });
      }
      if (res.characterUpdates) {
        res.characterUpdates.forEach(upd => {
          // support lookup by current name or alias
          const idx = chars.findIndex(ch => ch.name === upd.name || ch.alias === upd.name);
          if (idx >= 0) chars[idx] = { ...chars[idx], favor: clamp(chars[idx].favor + upd.favorDelta, -100, 100) };
        });
      }

      return {
        ...prev,
        qiXue:  didLevelUp
          ? newMaxQiXue
          : clamp(isStart ? prev.qiXue : prev.qiXue + (c.qiXue ?? 0), 0, newMaxQiXue),
        lingLi: didLevelUp ? 0 : clamp(rawLingLi, 0, 100),
        maxQiXue:  newMaxQiXue,
        maxLingLi: newMaxLingLi,
        age:       isStart ? prev.age       : prev.age + (c.ageAdd  ?? 0),
        shouYuan:  CULTIVATION_SHOUYUAN[newLevel],
        mingSheng: isStart ? prev.mingSheng : clamp(prev.mingSheng + (c.mingSheng ?? 0)),
        zuiE:      isStart ? prev.zuiE      : clamp(prev.zuiE      + (c.zuiE      ?? 0)),
        karmaHistory: newKarma,
        characters: chars,
        cultivation:      CULTIVATION_STAGES[newLevel],
        cultivationLevel: newLevel,
        imagePrompt: res.imagePrompt ?? prev.imagePrompt,
        inventory: isStart
          ? []
          : Array.from(new Set([...prev.inventory, ...(res.itemsAdded ?? [])])),
        eventLog: isStart ? [] : [
          ...prev.eventLog,
          ...cultivationLogs,
          ...(res.eventLog ?? []).map((e, i) => ({
            id: now + i + 100,
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
            cultivationLevel: s.cultivationLevel,
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

// ─── PlayerAvatar ─────────────────────────────────────────────────────────────

const INVENTORY_PROMPTS: [RegExp, string][] = [
  [/[鐵鋼鉑]?劍|長劍|飛劍|古劍/, "holding a pixelated iron sword"],
  [/道袍|白袍|青袍|玄袍|法袍|仙袍/, "wearing a simple daoist robe"],
  [/弓/, "carrying a pixelated bow"],
  [/鎧甲|甲冑|護甲/, "wearing armor"],
  [/仙杖|法杖|靈杖|禪杖|拂塵/, "holding a magic staff"],
  [/扇/, "holding a folding fan"],
  [/護符|符籙|靈符/, "holding a glowing talisman"],
];

function buildAvatarPrompt(cultivation: string, inventory: string[]): string {
  const parts: string[] = [];
  for (const item of inventory) {
    for (const [regex, desc] of INVENTORY_PROMPTS) {
      if (regex.test(item) && !parts.includes(desc)) { parts.push(desc); break; }
    }
  }
  const equip = parts.length > 0 ? ", " + parts.join(", ") : "";
  return `young wuxia cultivator, ${cultivation} realm${equip}, pixel art sprite, retro 16-bit RPG character, standing pose, detailed fantasy`;
}

function PlayerAvatar({ state }: { state: GameState }) {
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState(false);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(buildAvatarPrompt(state.cultivation, state.inventory))}?width=128&height=128&nologo=true&model=flux`;
  return (
    <div style={{
      width: 96, height: 96, borderRadius: "12px", margin: "0 auto 16px",
      overflow: "hidden", border: "1px solid #2d1f5e", position: "relative",
      background: "linear-gradient(135deg,#020617 0%,#0c0a1f 50%,#020617 100%)",
      boxShadow: "0 0 18px rgba(124,58,237,0.18)",
    }}>
      {!loaded && !err && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <motion.div
            style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid #7c3aed", borderTopColor: "transparent" }}
            animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}
      {!err && (
        <img src={url} alt={state.playerName}
          onLoad={() => setLoaded(true)} onError={() => setErr(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", opacity: loaded ? 1 : 0, transition: "opacity 0.5s ease" }}
        />
      )}
      {err && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#2d1f5e", fontSize: "32px" }}>人</span>
        </div>
      )}
    </div>
  );
}

// ─── DetailPanel ──────────────────────────────────────────────────────────────

function DetailPanel({ state, onClose }: { state: GameState; onClose: () => void }) {
  const basicRows = [
    { label: "氣血", value: `${state.qiXue} / ${state.maxQiXue}`, color: "#ef4444" },
    { label: "靈力", value: `${state.lingLi} / ${state.maxLingLi}`, color: "#06b6d4" },
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
      {/* 主角頭像 */}
      <PlayerAvatar state={state} />

      {/* 境界 */}
      <div style={{ textAlign: "center", marginBottom: "10px" }}>
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

      {/* EXP 光感條 */}
      <div style={{ marginBottom: "18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
          <span style={{ color: "#4c1d95", fontSize: "9px", letterSpacing: "0.2em", fontFamily: "monospace" }}>EXP</span>
          <span style={{ color: "#a78bfa", fontSize: "9px", fontFamily: "monospace" }}>{state.lingLi}&nbsp;/&nbsp;100</span>
        </div>
        <div style={{ height: "5px", backgroundColor: "#0f0a1e", borderRadius: "3px", overflow: "hidden" }}>
          <motion.div
            style={{
              height: "100%", borderRadius: "3px",
              background: "linear-gradient(90deg,#5b21b6 0%,#7c3aed 55%,#c4b5fd 100%)",
              boxShadow: "0 0 8px rgba(167,139,250,0.55)",
            }}
            animate={{ width: `${state.lingLi}%`, opacity: [0.75, 1, 0.75] }}
            transition={{ width: { duration: 0.6, ease: "easeOut" }, opacity: { duration: 2.2, repeat: Infinity, ease: "easeInOut" } }}
          />
        </div>
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

// ─── NpcPortrait ──────────────────────────────────────────────────────────────

function NpcPortrait({ npc }: { npc: NPC }) {
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState(false);
  if (!npc.physicalDescription) return null;
  const genderTag = npc.gender === "female"
    ? ", voluptuous body, alluring pose, pixel art sprite, retro 16-bit, masterpiece portrait, wuxia cultivation fantasy"
    : ", strong masculine features, wuxia warrior, pixel art sprite, retro 16-bit, masterpiece portrait, wuxia cultivation fantasy";
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(npc.physicalDescription + genderTag)}?width=128&height=192&nologo=true&model=flux`;
  return (
    <div style={{
      width: 72, height: 108, borderRadius: "8px", flexShrink: 0, overflow: "hidden",
      border: "1px solid #1e293b", position: "relative",
      background: "linear-gradient(135deg,#020617,#0c1a35)",
    }}>
      {!loaded && !err && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <motion.div
            style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #06b6d4", borderTopColor: "transparent" }}
            animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}
      {!err && (
        <img src={url} alt={npc.name}
          onLoad={() => setLoaded(true)}
          onError={() => setErr(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", opacity: loaded ? 1 : 0, transition: "opacity 0.5s ease" }}
        />
      )}
      {err && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#1e293b", fontSize: "20px" }}>人</span>
        </div>
      )}
    </div>
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
            <div key={npc.name} style={{ display: "flex", gap: "12px", padding: "12px 14px", backgroundColor: "#0f1929", borderRadius: "10px", border: "1px solid #1e293b", alignItems: "flex-start" }}>
              <NpcPortrait npc={npc} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <Tooltip text={[
                    `${npc.relation}`,
                    npc.alias ? `前稱：${npc.alias}` : "",
                    `好感：${npc.favor > 0 ? "+" : ""}${npc.favor}（${npc.favor >= 80 ? "摯友" : npc.favor >= 40 ? "友善" : npc.favor >= -10 ? "中立" : npc.favor >= -50 ? "警惕" : "敵意"}）`,
                  ].filter(Boolean).join("　")}>
                    <span style={{ color: "#f1f5f9", fontSize: "13px", fontWeight: 700 }}>{npc.name}</span>
                  </Tooltip>
                  <span style={{ color: "#64748b", fontSize: "11px", backgroundColor: "#1e293b", padding: "2px 8px", borderRadius: "4px", flexShrink: 0 }}>
                    {npc.relation}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "#475569", fontSize: "10px", flexShrink: 0 }}>好感</span>
                  <FavorBar favor={npc.favor} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

// ─── LandscapePanel ───────────────────────────────────────────────────────────

function LandscapePanel({ imagePrompt, onClose }: {
  imagePrompt: string; onClose: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const imageUrl = imagePrompt
    ? `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt + ", wuxia cultivation fantasy, cinematic lighting, painterly")}?width=768&height=432&nologo=true&model=flux`
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

    </Modal>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const KARMA_TOOLTIPS: Partial<Record<KarmaTag, string>> = {
  "修煉": "長期靜心修煉，積累修為根基，道心漸固",
  "吐納": "調息吐納，引天地靈氣入體，滋養丹田",
  "淬體": "以苦難淬煉肉身，體魄強健，抗擊打能力提升",
  "悟道": "於天地萬物中有所頓悟，道心精進，境界有望突破",
  "遊歷": "行走四方，見識廣博，奇緣機遇自然而至",
  "問道": "向高人求教，拓展見識格局，少走彎路",
  "採集": "採集靈材，積累煉丹與修煉所需資源",
  "煉丹": "嘗試煉製丹藥，熟悉藥性配方之道",
  "殺業": "手沾鮮血，殺念凝聚心頭，業力漸重",
  "御器": "以神識駕馭法器，飛劍聽令，指揮如意",
  "神通": "領悟並施展神通，威能驚人，令人側目",
  "逃遁": "危急時刻施展遁術，保全性命，留待日後",
  "血債": "業力深重，血債纏身，難以輕易消除",
  "天道感應": "行為感動天道，受冥冥之力庇護眷顧",
  "業火": "罪業積累如山，業火焚身，因果難逃",
  "渡劫": "面對天劫考驗，生死一線之間，磨礪心志",
};

const ITEM_TOOLTIP_MAP: [RegExp, string][] = [
  [/劍|刀|斬/, "兵刃之器，可用於斬妖除魔，煉體強身"],
  [/丹|藥|膏/, "丹藥之物，服用後可恢復氣血或增進修為"],
  [/訣|功法|心法|秘籍|經/, "修煉典籍，記載道法精髓，習練可增強靈力"],
  [/符籙|護符|靈符|符/, "符文之器，蘊含靈力，可護身辟邪或攻伐敵人"],
  [/道袍|白袍|青袍|玄袍|袍/, "修士服飾，輕便靈動，利於施法行走"],
  [/弓|箭/, "遠程兵器，以靈力驅動，可遠距精準攻擊"],
  [/鎧甲|甲冑|護甲/, "防護之具，可減少傷害，護衛周身要害"],
  [/玉佩|玉石|靈玉|玉/, "靈玉之物，蘊含天地靈氣，佩戴可穩固根基"],
  [/杖|拂塵/, "法器之器，可聚集靈力，增強神通威力"],
  [/扇/, "奇門法器，輕揮之間蘊藏莫測之力"],
];

function getItemTooltip(item: string): string {
  for (const [regex, desc] of ITEM_TOOLTIP_MAP) {
    if (regex.test(item)) return desc;
  }
  return "未知之物，其妙用尚待探索";
}

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [tipRect, setTipRect] = useState<DOMRect | null>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (spanRef.current) setTipRect(spanRef.current.getBoundingClientRect());
  };
  const hide = () => {
    if (hideRef.current) clearTimeout(hideRef.current);
    setTipRect(null);
  };

  return (
    <span
      ref={spanRef}
      style={{ display: "inline", cursor: "help" }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onTouchStart={() => { longPressRef.current = setTimeout(show, 480); }}
      onTouchEnd={() => {
        if (longPressRef.current) clearTimeout(longPressRef.current);
        if (tipRect) hideRef.current = setTimeout(hide, 2200);
      }}
      onTouchCancel={() => { if (longPressRef.current) clearTimeout(longPressRef.current); }}
    >
      {children}
      <AnimatePresence>
        {tipRect && (
          <motion.div
            key="tip"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.13 }}
            style={{
              position: "fixed",
              left: tipRect.left + tipRect.width / 2,
              top: tipRect.top - 8,
              transform: "translate(-50%, -100%)",
              backgroundColor: "rgba(2,6,23,0.96)",
              backdropFilter: "blur(14px)",
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "8px 12px",
              fontSize: "11px",
              color: "#94a3b8",
              zIndex: 300,
              pointerEvents: "none",
              letterSpacing: "0.06em",
              lineHeight: 1.75,
              maxWidth: "190px",
              whiteSpace: "normal",
              boxShadow: "0 8px 24px rgba(0,0,0,0.65)",
            }}
          >
            {text}
            <div style={{
              position: "absolute", top: "100%", left: "50%",
              transform: "translateX(-50%)",
              width: 0, height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "5px solid #334155",
            }} />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
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
                  <Tooltip key={item} text={getItemTooltip(item)}>
                    <span style={{
                      padding: "6px 14px", fontSize: "12px", borderRadius: "8px",
                      backgroundColor: "#0f172a", color: "#7dd3fc",
                      border: "1px solid #1e3a5f", letterSpacing: "0.05em",
                      display: "inline-block",
                    }}>
                      {item}
                    </span>
                  </Tooltip>
                ))}
              </div>
            </div>
          )}
          {hasKarma && (
            <div>
              <p style={{ color: "#334155", fontSize: "10px", letterSpacing: "0.18em", marginBottom: "12px", fontWeight: 700 }}>[ 因果印記 ]</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {state.karmaHistory.map(tag => (
                  <Tooltip key={tag} text={KARMA_TOOLTIPS[tag] ?? "修煉過程中留下的因果印記"}>
                    <span style={{
                      padding: "6px 14px", fontSize: "12px", borderRadius: "8px",
                      backgroundColor: "#1e293b", color: "#94a3b8",
                      border: "1px solid #334155", display: "inline-block",
                    }}>
                      {tag}
                    </span>
                  </Tooltip>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// ─── CavePanel ────────────────────────────────────────────────────────────────

function CavePanel({ state, onClose }: { state: GameState; onClose: () => void }) {
  return (
    <Modal onClose={onClose} title="⟨ 洞 府 ⟩">
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", backgroundColor: "#0f172a", borderRadius: "8px", border: "1px solid #1e293b" }}>
          <span style={{ color: "#94a3b8", fontSize: "12px" }}>靈氣濃度</span>
          <span style={{ color: "#fbbf24", fontFamily: "monospace", fontSize: "13px", fontWeight: 700 }}>Lv.{state.cave.lingQiLevel}</span>
        </div>
        <div>
          <p style={{ color: "#334155", fontSize: "10px", letterSpacing: "0.18em", marginBottom: "10px", fontWeight: 700 }}>[ 洞府設施 ]</p>
          {state.cave.facilities.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {state.cave.facilities.map(f => (
                <span key={f} style={{ padding: "4px 12px", fontSize: "11px", borderRadius: "6px", backgroundColor: "#1e293b", color: "#94a3b8", border: "1px solid #334155" }}>{f}</span>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "center", padding: "20px 0", color: "#334155", fontSize: "11px", letterSpacing: "0.15em" }}>
              〔 尚未開拓任何設施 〕
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─── SystemPanel ──────────────────────────────────────────────────────────────

function SystemPanel({ onClose, onReincarnate }: { onClose: () => void; onReincarnate: () => void }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <Modal onClose={onClose} title="⟨ 系 統 ⟩">
      {!confirming ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button
            onClick={() => setConfirming(true)}
            style={{
              width: "100%", padding: "14px", borderRadius: "10px",
              border: "1px solid #7f1d1d", backgroundColor: "#1a0505",
              color: "#fca5a5", fontSize: "14px", fontWeight: 700,
              letterSpacing: "0.2em", cursor: "pointer", fontFamily: CJK,
              boxShadow: "0 0 16px rgba(239,68,68,0.18)",
            }}
          >
            ✦ 重新轉世 ✦
          </button>
          <p style={{ color: "#334155", fontSize: "11px", textAlign: "center", letterSpacing: "0.1em", margin: 0 }}>
            放棄此世一切，轉入下一輪迴
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ color: "#f87171", fontSize: "13px", textAlign: "center", letterSpacing: "0.08em", lineHeight: 1.9, margin: 0 }}>
            此世所有記憶、境界、因果<br />將於轉世後盡數消散<br />確認輪迴？
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setConfirming(false)}
              style={{
                flex: 1, padding: "10px", borderRadius: "8px",
                border: "1px solid #334155", backgroundColor: "#0f172a",
                color: "#94a3b8", fontSize: "12px", letterSpacing: "0.1em",
                cursor: "pointer", fontFamily: CJK,
              }}
            >
              取消
            </button>
            <button
              onClick={onReincarnate}
              style={{
                flex: 1, padding: "10px", borderRadius: "8px",
                border: "1px solid #991b1b", backgroundColor: "#7f1d1d",
                color: "#fecaca", fontSize: "12px", fontWeight: 700,
                letterSpacing: "0.12em", cursor: "pointer", fontFamily: CJK,
                boxShadow: "0 0 12px rgba(239,68,68,0.3)",
              }}
            >
              ✦ 確認轉世
            </button>
          </div>
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
  const [showCave, setShowCave]         = useState(false);
  const [showSystem, setShowSystem]     = useState(false);
  const [showBreakthrough, setShowBreakthrough] = useState(false);
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

  const fireBreakthrough = () => {
    if (isBusy) return;
    setShowBreakthrough(true);
    setTimeout(() => {
      setShowBreakthrough(false);
      fire("我凝神靜氣，調動全身靈力，試圖衝破當前境界的枷鎖");
    }, 1800);
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

        {/* 突破金光 */}
        <AnimatePresence>
          {showBreakthrough && (
            <motion.div
              key="breakthrough"
              style={{
                position: "absolute", inset: 0, pointerEvents: "none", zIndex: 25,
                background: "radial-gradient(ellipse at center, rgba(251,191,36,0.35) 0%, rgba(245,158,11,0.18) 40%, transparent 72%)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.55, 1, 0.7, 0] }}
              transition={{ duration: 1.8, times: [0, 0.2, 0.4, 0.65, 0.85, 1], ease: "easeInOut" }}
            />
          )}
        </AnimatePresence>

        {/* ── HUD ──────────────────────────────────────────────── */}
        <div style={{
          flexShrink: 0, backgroundColor: "rgba(2,6,23,0.80)",
          backdropFilter: "blur(12px)", padding: "12px 14px 10px",
          borderBottom: "1px solid rgba(30,41,59,0.8)",
        }}>
          {/* Row 1: 玩家名左對齊 + 右側按鈕群 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ color: "#cbd5e1", fontSize: "13px", fontWeight: 700, letterSpacing: "0.15em" }}>
              〔&nbsp;{state.playerName}&nbsp;〕
            </span>
            <div style={{ display: "flex", gap: "5px" }}>
              <button style={{ ...hudBtn, color: "#7dd3fc", borderColor: "#1e3a5f", letterSpacing: "0.15em" }} onClick={() => setShowLandscape(true)}>
                〔 眼前的風景 〕
              </button>
              <button style={hudBtn} onClick={() => setShowSystem(true)}>〔 系統 〕</button>
            </div>
          </div>

          {/* HP / MP */}
          <StatBar label="HP" value={state.qiXue}  maxVal={state.maxQiXue}  from="#dc2626" to="#ef4444" />
          <div style={{ marginTop: "6px" }}>
            <StatBar label="MP" value={state.lingLi} maxVal={state.maxLingLi} from="#0ea5e9" to="#06b6d4" />
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
                flex: 1, height: "42px",
                backgroundColor: isBusy ? "#080e1c" : "#0f172a",
                border: "1px solid #334155", borderRadius: "10px",
                padding: "0 12px", fontSize: "13px", color: "#f1f5f9",
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
                border: "none", borderRadius: "10px",
                color: isBusy ? "#475569" : "#f1f5f9",
                cursor: isBusy || !inputValue.trim() ? "not-allowed" : "pointer",
                flexShrink: 0, width: "56px", transition: "background-color 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center",
                alignSelf: "stretch",
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

            {/* 修煉中心 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "3px", flexShrink: 0, alignSelf: "stretch" }}>
              {([
                { label: "打坐", color: "#94a3b8", border: "#334155", onClick: () => fire("我盤膝打坐，引氣入體，調息吐納，運轉功法修煉") },
                { label: "洞府", color: "#94a3b8", border: "#334155", onClick: () => setShowCave(true) },
                { label: "突破", color: "#fbbf24", border: "#92400e", onClick: fireBreakthrough },
              ] as const).map(btn => (
                <motion.button key={btn.label}
                  onClick={btn.onClick}
                  disabled={isBusy}
                  whileTap={!isBusy ? { scale: 0.88 } : {}}
                  style={{
                    flex: 1,
                    background: "none", border: `1px solid ${isBusy ? "#1e293b" : btn.border}`,
                    borderRadius: "6px", color: isBusy ? "#334155" : btn.color,
                    fontSize: "9px", letterSpacing: "0.08em",
                    cursor: isBusy ? "not-allowed" : "pointer",
                    fontFamily: CJK, lineHeight: 1, width: "34px", textAlign: "center",
                    boxShadow: (!isBusy && btn.label === "突破") ? "0 0 7px rgba(251,191,36,0.22)" : "none",
                    transition: "color 0.2s, border-color 0.2s",
                  }}>
                  {btn.label}
                </motion.button>
              ))}
            </div>
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
          {showLandscape && <LandscapePanel imagePrompt={state.imagePrompt} onClose={() => setShowLandscape(false)} />}
          {showBag       && <BagPanel        state={state} onClose={() => setShowBag(false)} />}
          {showCave      && <CavePanel       state={state} onClose={() => setShowCave(false)} />}
          {showSystem    && <SystemPanel onClose={() => setShowSystem(false)} onReincarnate={() => window.location.reload()} />}
        </AnimatePresence>

      </div>
    </div>
  );
}
