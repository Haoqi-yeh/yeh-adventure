"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// --- Types & Constants ---
type KarmaTag = "修煉" | "吐納" | "淬體" | "悟道" | "遊歷" | "問道" | "採集" | "煉丹" | "殺業" | "御器" | "神通" | "逃遁" | "血債" | "天道感應" | "業火" | "渡劫";

const CULTIVATION_STAGES = ["煉氣一層", "煉氣五層", "煉氣九層", "築基初期", "築基中期", "築基圓滿", "金丹初期", "金丹後期", "元嬰初期", "化神境"];

const DEJA_VU_TRIGGERS: Record<string, { label: string; narrative: string; karmaGain: KarmaTag }> = {
  殺業: { label: "【血債血還·隱現】", narrative: "殺念凝結成形，一道暗紅色劍氣自掌心浮現——這是你以血鑄就的獨門神通。", karmaGain: "血債" },
  悟道: { label: "【大道至簡·隱現】", narrative: "無數次感悟的碎片驟然匯聚，某種難以言說的至理在你心中炸開。", karmaGain: "天道感應" }
};

const ACTION_GRID = [
  { label: "打坐修煉", icon: "🧘", tag: "修煉", effect: { lingLi: 10, shouYuan: -2 } },
  { label: "吐納靈氣", icon: "💨", tag: "吐納", effect: { qiXue: 5, lingLi: 6, shouYuan: -1 } },
  { label: "淬煉肉身", icon: "🔥", tag: "淬體", effect: { qiXue: 12, lingLi: -6, shouYuan: -3 } },
  { label: "感悟天道", icon: "✨", tag: "悟道", effect: { lingLi: 18, shouYuan: -6 } },
  { label: "遊歷四方", icon: "🗺", tag: "遊歷", effect: { mingSheng: 6, shouYuan: -5 } },
  { label: "交涉問道", icon: "💬", tag: "問道", effect: { mingSheng: 8, lingLi: 3, shouYuan: -3 } },
  { label: "採集靈材", icon: "🌿", tag: "採集", effect: { qiXue: 4, shouYuan: -2 } },
  { label: "煉製丹藥", icon: "⚗", tag: "煉丹", effect: { qiXue: 22, lingLi: -12, shouYuan: -8 } },
  { label: "出劍斬敵", icon: "⚔", tag: "殺業", effect: { zuiE: 10, qiXue: -6, mingSheng: 4, shouYuan: -5 } },
  { label: "御器飛行", icon: "🗡", tag: "御器", effect: { lingLi: -10, shouYuan: -3 } },
  { label: "施展神通", icon: "🌀", tag: "神通", effect: { lingLi: -22, qiXue: -5, shouYuan: -5 } },
  { label: "逃之夭夭", icon: "🌪", tag: "逃遁", effect: { mingSheng: -5, shouYuan: -2 } },
];

// --- Page Component ---
export default function Page() {
  // 1. State Management
  const [state, setState] = useState({
    qiXue: 80, lingLi: 60, shouYuan: 500, mingSheng: 10, zuiE: 0,
    karmaHistory: [] as KarmaTag[],
    cultivation: CULTIVATION_STAGES[0],
    cultivationLevel: 0,
    displayedNarrative: "",
    isTyping: false,
    turn: 0
  });

  const [rippleKey, setRippleKey] = useState<number | null>(null);
  const intervalRef = useRef<any>(null);

  const runTypewriter = useCallback((text: string) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    let i = 0;
    setState(s => ({ ...s, displayedNarrative: "", isTyping: true }));
    intervalRef.current = setInterval(() => {
      i++;
      const done = i >= text.length;
      setState(s => ({ ...s, displayedNarrative: text.slice(0, i), isTyping: !done }));
      if (done) clearInterval(intervalRef.current);
    }, 30);
  }, []);

  useEffect(() => {
    runTypewriter("你睜開雙眼，發現自己身處一片翠竹深林之中。晨霧瀰漫，靈氣充沛。一段嶄新的修仙之路，正在你腳下展開……");
    return () => clearInterval(intervalRef.current);
  }, [runTypewriter]);

  const makeAction = (i: number) => {
    if (state.isTyping) return;
    setRippleKey(Date.now());
    const action = ACTION_GRID[i];
    const newQiXue = Math.max(0, Math.min(100, state.qiXue + (action.effect.qiXue || 0)));
    const newLingLi = Math.max(0, Math.min(100, state.lingLi + (action.effect.lingLi || 0)));
    
    setState(s => ({
      ...s,
      qiXue: newQiXue,
      lingLi: newLingLi,
      shouYuan: Math.max(0, s.shouYuan + action.effect.shouYuan),
      turn: s.turn + 1,
      karmaHistory: s.karmaHistory.includes(action.tag as KarmaTag) ? s.karmaHistory : [...s.karmaHistory, action.tag as KarmaTag]
    }));
    runTypewriter(`你執行了${action.label}，靈氣在體內震盪，你感到自身的力量正在發生細微的變化。`);
  };

  const activeDejaVuKeys = Object.keys(DEJA_VU_TRIGGERS).filter(k => state.karmaHistory.includes(k as KarmaTag));

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'fixed', top: 0, left: 0 }}>
      <div style={{ width: '100%', maxWidth: '430px', height: '100vh', backgroundColor: '#020617', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 0 100px rgba(0,0,0,0.5)', color: 'white' }}>
        
        {/* Ripple Effect */}
        <AnimatePresence>
          {rippleKey && (
            <motion.div key={rippleKey} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 50 }}>
              <motion.div style={{ width: 100, height: 100, borderRadius: '50%', border: '2px solid rgba(34,211,238,0.4)', backgroundColor: 'rgba(34,211,238,0.1)' }} initial={{ scale: 0, opacity: 1 }} animate={{ scale: 8, opacity: 0 }} transition={{ duration: 0.6 }} onAnimationComplete={() => setRippleKey(null)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <header style={{ padding: '24px 20px', backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: '#fbbf24', fontSize: '20px', fontWeight: 'bold' }}>{state.cultivation}</span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>壽元 {state.shouYuan} 年</span>
          </div>
          <div style={{ height: '6px', width: '100%', backgroundColor: '#1e293b', borderRadius: '3px', marginBottom: '8px' }}>
            <div style={{ height: '100%', width: `${state.qiXue}%`, backgroundColor: '#ef4444', borderRadius: '3px', transition: '0.3s' }} />
          </div>
          <div style={{ height: '6px', width: '100%', backgroundColor: '#1e293b', borderRadius: '3px' }}>
            <div style={{ height: '100%', width: `${state.lingLi}%`, backgroundColor: '#06b6d4', borderRadius: '3px', transition: '0.3s' }} />
          </div>
        </header>

        {/* Narrative */}
        <div style={{ flex: 1, padding: '30px 24px', overflowY: 'auto', backgroundColor: '#020617' }}>
          <p style={{ fontSize: '18px', lineHeight: '1.8', color: '#e2e8f0' }}>{state.displayedNarrative}</p>
          {!state.isTyping && activeDejaVuKeys.map(k => (
            <button key={k} style={{ width: '100%', marginTop: '20px', padding: '15px', backgroundColor: '#451a03', border: '1px solid #78350f', color: '#fcd34d', borderRadius: '12px' }}>
              {DEJA_VU_TRIGGERS[k].label}
            </button>
          ))}
        </div>

        {/* Buttons */}
        <footer style={{ padding: '20px', backgroundColor: '#0f172a', borderTop: '1px solid #1e293b' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {ACTION_GRID.map((action, i) => (
              <button key={i} onClick={() => makeAction(i)} disabled={state.isTyping} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: 'white', opacity: state.isTyping ? 0.3 : 1 }}>
                <span style={{ fontSize: '20px' }}>{action.icon}</span>
                <span style={{ fontSize: '10px', marginTop: '4px' }}>{action.label.slice(0, 2)}</span>
              </button>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}
