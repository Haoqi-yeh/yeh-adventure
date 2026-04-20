"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ───────────────────────────────────────────────────────────────────

type KarmaTag =
  | "修煉" | "吐納" | "淬體" | "悟道"
  | "遊歷" | "問道" | "採集" | "煉丹"
  | "殺業" | "御器" | "神通" | "逃遁"
  | "血債" | "天道感應" | "業火" | "渡劫";

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
  turn: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CULTIVATION_STAGES = [
  "煉氣一層", "煉氣五層", "煉氣九層",
  "築基初期", "築基中期", "築基圓滿",
  "金丹初期", "金丹後期", "元嬰初期",
  "化神境",
];

const DEJA_VU_TRIGGERS: Record<string, { label: string; narrative: string; karmaGain: KarmaTag }> = {
  殺業: {
    label: "【血債血還·隱現】",
    narrative: "殺念凝結成形，一道暗紅色劍氣自掌心浮現——這是你以血鑄就的獨門神通，天道烙印在你靈魂深處的印記。",
    karmaGain: "血債",
  },
  悟道: {
    label: "【大道至簡·隱現】",
    narrative: "無數次感悟的碎片驟然匯聚，某種難以言說的至理在你心中炸開。你的修為境界，悄然跨越了一個門檻。",
    karmaGain: "天道感應",
  },
  渡劫: {
    label: "【逆引天劫·隱現】",
    narrative: "你感應到天穹中積聚的劫雷之力，反其道而行，以己身為引，主動迎上——借力化境，渡劫如飲水。",
    karmaGain: "渡劫",
  },
  血債: {
    label: "【以血祭道·隱現】",
    narrative: "血債層疊，竟反成道基。你以這滿身殺業為引，悟出一門以殺入道的血道神通，業火化為修行之火。",
    karmaGain: "業火",
  },
  天道感應: {
    label: "【天道回響·隱現】",
    narrative: "你曾觸摸過天道的邊緣，此刻天道似乎也在回望你。虛空中傳來一絲難以捕捉的共鳴，指引著下一步的方向。",
    karmaGain: "業火",
  },
};

const ACTION_GRID = [
  { label: "打坐修煉", icon: "🧘", tag: "修煉" as KarmaTag, effect: { lingLi: 10, shouYuan: -2 } },
  { label: "吐納靈氣", icon: "💨", tag: "吐納" as KarmaTag, effect: { qiXue: 5, lingLi: 6, shouYuan: -1 } },
  { label: "淬煉肉身", icon: "🔥", tag: "淬體" as KarmaTag, effect: { qiXue: 12, lingLi: -6, shouYuan: -3 } },
  { label: "感悟天道", icon: "✨", tag: "悟道" as KarmaTag, effect: { lingLi: 18, shouYuan: -6 } },
  { label: "遊歷四方", icon: "🗺", tag: "遊歷" as KarmaTag, effect: { mingSheng: 6, shouYuan: -5 } },
  { label: "交涉問道", icon: "💬", tag: "問道" as KarmaTag, effect: { mingSheng: 8, lingLi: 3, shouYuan: -3 } },
  { label: "採集靈材", icon: "🌿", tag: "採集" as KarmaTag, effect: { qiXue: 4, shouYuan: -2 } },
  { label: "煉製丹藥", icon: "⚗", tag: "煉丹" as KarmaTag, effect: { qiXue: 22, lingLi: -12, shouYuan: -8 } },
  { label: "出劍斬敵", icon: "⚔", tag: "殺業" as KarmaTag, effect: { zuiE: 10, qiXue: -6, mingSheng: 4, shouYuan: -5 } },
  { label: "御器飛行", icon: "🗡", tag: "御器" as KarmaTag, effect: { lingLi: -10, shouYuan: -3 } },
  { label: "施展神通", icon: "🌀", tag: "神通" as KarmaTag, effect: { lingLi: -22, qiXue: -5, shouYuan: -5 } },
  { label: "逃之夭夭", icon: "🌪", tag: "逃遁" as KarmaTag, effect: { mingSheng: -5, shouYuan: -2 } },
];

const NARRATIVES: Record<string, string[]> = {
  修煉: [
    "你盤膝而坐，天地靈氣緩緩匯聚，丹田中的金丹微微震顫，吸納著四周精華。恍惚間，你似乎觸摸到了大道的輪廓。",
    "靈氣在體內流轉，如江河奔騰，每一個周天都讓你感到更加充盈。心念一動，修為又穩固了幾分。",
    "靜坐三日，忘卻時間，待你睜開雙眼，周身靈氣自然凝聚，隱隱有突破之勢。",
  ],
  吐納: [
    "你深吸一口氣，天地間的靈氣隨之湧入，充盈每一個穴竅。靈力如潮，緩緩壯大氣海根基。",
    "靈氣凝練如霧，在肺腑間化為細絲，融入丹田——吐納之道，看似平凡，卻是修行的根本。",
  ],
  淬體: [
    "你運轉《玄鐵體》，以靈力淬煉肉身，每一塊骨骼都在烈火中嘶鳴，痛苦與蛻變同在。",
    "血肉之軀在淬煉中愈發強悍，你感到筋骨如同精鐵，雙拳揮出，隱隱帶動空氣震盪。",
  ],
  悟道: [
    "你閉上雙眼，意識飄向虛空。天道的脈絡如星河般在心中展開，某種本質的道理悄然降臨。",
    "一剎那間的空白，比千言萬語更真實。悟道之後，你看山還是山，卻又似乎看穿了山的本質。",
    "天地間某條看不見的線，此刻輕輕震動了一下，似乎在回應你的感悟。",
  ],
  遊歷: [
    "你踏上遠途，江湖之大，藏龍臥虎。行走間，你目睹了形形色色的命運，心有所感。",
    "山川萬里，風霜雨雪，都是修行的一部分。行路即問道，這一趟遊歷，讓你更加沉穩。",
  ],
  問道: [
    "你向一位鶴髮老者求教，對方沉吟片刻，說出一句令你醍醐灌頂的話，話音未落你已若有所思。",
    "交涉之間，你從對方隻言片語中悟出了一絲修行的真諦——有時候，問道不在山巔，而在人心。",
  ],
  採集: [
    "在深山之中，你發現了一株散發著淡淡靈光的藥草，氣息古老而醇厚，乃是難得的靈材。",
    "你循著靈氣波動，找到一處隱秘礦脈，從中採出幾塊品質不俗的靈石，收入儲物袋。",
  ],
  煉丹: [
    "鼎爐之中靈火跳動，藥香四溢。你小心翼翼地控制火候，歷經九個時辰，一爐丹藥告成。",
    "丹成時，淡金色光芒一閃而逝，丹藥滾入掌心，溫熱圓潤，靈氣充沛，堪稱上品。",
  ],
  殺業: [
    "劍光如電，一閃而過。那人連慘叫都來不及，已倒在你腳下。殺業的業力悄然附著於神魂之上。",
    "你手刃強敵，心中空蕩蕩的。鮮血的氣息瀰漫，你知道，每一次出手都在改變自己的命運軌跡。",
    "血光迸發，你的劍道更進一步——但業力，也深了幾分。天道無情，記錄著一切。",
  ],
  御器: [
    "靈劍嗡鳴，你踏劍御空，俯瞰大地。萬物在腳下渺若螻蟻，而你只是風中一個自由的影子。",
    "你御器掠過群山，雲霧在身旁翻湧。那種凌虛御風的自由，讓人短暫忘卻了一切執念。",
  ],
  神通: [
    "你祭出壓箱底的神通，天地為之色變，威能震懾四方。靈力急劇耗盡，但那一刻的爆發令人心驚。",
    "神通展開如星河鋪張，對手瞠目結舌。這一手，讓你對自身實力的邊界有了新的認識。",
  ],
  逃遁: [
    "你施展輕身術，轉眼遁入林間，那些追兵氣急敗壞地搜尋著你的蹤跡，卻再也找不到分毫線索。",
    "逃遁雖非英雄所為，但留得青山在，不怕沒柴燒。你心中暗自盤算著下一步的應對。",
  ],
};

const INITIAL_NARRATIVE =
  "你睜開雙眼，發現自己身處一片翠竹深林之中。晨霧彌漫，靈氣充沛，遠處隱約傳來水流聲。" +
  "你不知道自己是誰，也不記得過去——但你清楚地感受到，丹田之中有一縷微弱的靈氣在流動。" +
  "一段嶄新的修仙之路，正在你腳下展開……";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, v));
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
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
    turn: 0,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runTypewriter = useCallback((text: string) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    let i = 0;
    setState((s) => ({ ...s, displayedNarrative: "", isTyping: true }));
    intervalRef.current = setInterval(() => {
      i++;
      const done = i >= text.length;
      setState((s) => ({ ...s, displayedNarrative: text.slice(0, i), isTyping: !done }));
      if (done) clearInterval(intervalRef.current!);
    }, 40);
  }, []);

  useEffect(() => {
    runTypewriter(INITIAL_NARRATIVE);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const makeAction = useCallback((index: number) => {
    const action = ACTION_GRID[index];
    if (!action) return;
    const text = pick(NARRATIVES[action.tag] ?? ["你沉默地行動著。"]);

    setState((prev) => {
      const rawLingLi = prev.lingLi + (action.effect.lingLi ?? 0);
      let newLevel = prev.cultivationLevel;
      if (rawLingLi >= 100 && prev.cultivationLevel < CULTIVATION_STAGES.length - 1) {
        newLevel = prev.cultivationLevel + 1;
      }
      return {
        ...prev,
        qiXue: clamp(prev.qiXue + (action.effect.qiXue ?? 0)),
        lingLi: newLevel > prev.cultivationLevel ? 20 : clamp(rawLingLi),
        shouYuan: Math.max(0, prev.shouYuan + (action.effect.shouYuan ?? 0)),
        mingSheng: clamp(prev.mingSheng + (action.effect.mingSheng ?? 0)),
        zuiE: clamp(prev.zuiE + (action.effect.zuiE ?? 0)),
        karmaHistory: prev.karmaHistory.includes(action.tag)
          ? prev.karmaHistory
          : ([...prev.karmaHistory, action.tag] as KarmaTag[]),
        cultivation: CULTIVATION_STAGES[newLevel],
        cultivationLevel: newLevel,
        turn: prev.turn + 1,
      };
    });

    runTypewriter(text);
  }, [runTypewriter]);

  const triggerDejaVu = useCallback((key: string) => {
    const trigger = DEJA_VU_TRIGGERS[key];
    if (!trigger) return;
    setState((prev) => ({
      ...prev,
      karmaHistory: prev.karmaHistory.includes(trigger.karmaGain)
        ? prev.karmaHistory
        : ([...prev.karmaHistory, trigger.karmaGain] as KarmaTag[]),
      lingLi: clamp(prev.lingLi + 20),
      turn: prev.turn + 1,
    }));
    runTypewriter(trigger.narrative);
  }, [runTypewriter]);

  return { state, makeAction, triggerDejaVu };
}

// ─── BreathBar ────────────────────────────────────────────────────────────────

function BreathBar({ label, value, barColor }: { label: string; value: number; barColor: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-400 text-xs w-7 shrink-0">{label}</span>
      <div className="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          animate={{
            width: `${Math.max(0, value)}%`,
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            width: { duration: 0.5, ease: "easeOut" },
            opacity: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      </div>
      <span className="text-slate-300 font-mono text-xs w-7 text-right shrink-0">{value}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Page() {
  const { state, makeAction, triggerDejaVu } = useGameState();
  const [rippleKey, setRippleKey] = useState<number | null>(null);

  const activeDejaVuKeys = Object.keys(DEJA_VU_TRIGGERS).filter((key) =>
    state.karmaHistory.includes(key as KarmaTag)
  );

  const handleAction = (i: number) => {
    setRippleKey(Date.now());
    makeAction(i);
  };

  const handleDejaVu = (key: string) => {
    setRippleKey(Date.now());
    triggerDejaVu(key);
  };

  return (
    /* 最外層：強制全螢幕灰色背景並置中 */
    <div 
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#cbd5e1', // slate-300
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 0,
        padding: '20px',
        overflow: 'hidden'
      }}
    >
      {/* 遊戲主面板：強制深黑背景、白色文字 */}
      <div 
        style={{
          width: '100%',
          maxWidth: '400px',
          height: '90vh',
          backgroundColor: '#020617', // slate-950
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '4px solid #1e293b', // slate-800
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          color: '#f8fafc' // 強制文字白色
        }}
      >
        {/* 靈氣漣漪特效 */}
        <AnimatePresence>
          {rippleKey !== null && (
            <motion.div
              key={rippleKey}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 20
              }}
              initial={false}
            >
              <motion.div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '9999px',
                  border: '1px solid rgba(34, 211, 238, 0.3)',
                  backgroundColor: 'rgba(34, 211, 238, 0.05)'
                }}
                initial={{ scale: 0.3, opacity: 0.6 }}
                animate={{ scale: 6, opacity: 0 }}
                transition={{ duration: 0.65, ease: "easeOut" }}
                onAnimationComplete={() => setRippleKey(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── HEADER：修為與狀態列 ───────────────────────── */}
        <header style={{ 
          flexShrink: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.9)', 
          padding: '20px 16px 12px 16px', 
          borderBottom: '1px solid #334155' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: '#fbbf24', fontSize: '18px', fontWeight: 'bold', letterSpacing: '0.1em' }}>
              {state.cultivation}
            </span>
            <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', gap: '8px' }}>
              {state.turn > 0 && <span>第 {state.turn} 回</span>}
              <span>·</span>
              <span>壽元 <span style={{ color: '#34d399' }}>{state.shouYuan}</span> 年</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <BreathBar label="氣血" value={state.qiXue}  barColor="bg-red-600" />
            <BreathBar label="靈力" value={state.lingLi} barColor="bg-cyan-500" />
          </div>

          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#94a3b8', marginTop: '12px' }}>
            <span>名聲 <span style={{ color: '#fbbf24' }}>{state.mingSheng}</span></span>
            <span>罪惡 <span style={{ color: '#fb7185' }}>{state.zuiE}</span></span>
          </div>
        </header>

        {/* ── CONTENT：劇情敘事區 ────────────────────────── */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '24px', 
          minHeight: 0 
        }}>
          <p style={{ color: '#f1f5f9', fontSize: '16px', lineHeight: '1.8', letterSpacing: '0.025em' }}>
            {state.displayedNarrative}
            {state.isTyping && (
              <span style={{ 
                display: 'inline-block', 
                width: '2px', 
                height: '1em', 
                backgroundColor: '#fbbf24', 
                marginLeft: '4px', 
                verticalAlign: 'middle' 
              }} />
            )}
          </p>

          {!state.isTyping && activeDejaVuKeys.length > 0 && (
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(51, 65, 85, 0.5)' }}>
              <p style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', marginBottom: '8px' }}>〔因果共鳴·既視感〕</p>
              {activeDejaVuKeys.map((key) => (
                <motion.button
                  key={key}
                  onClick={() => handleDejaVu(key)}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    width: '100%', textAlign: 'left', fontSize: '14px', color: '#fcd34d',
                    border: '1px solid rgba(120, 53, 15, 0.4)', borderRadius: '12px',
                    padding: '12px 16px', backgroundColor: 'rgba(69, 26, 3, 0.3)',
                    marginBottom: '8px', cursor: 'pointer'
                  }}
                >
                  {DEJA_VU_TRIGGERS[key].label}
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* ── FOOTER：按鈕區 ────────────────────────────── */}
        <footer style={{ 
          flexShrink: 0, 
          padding: '16px', 
          backgroundColor: 'rgba(15, 23, 42, 0.5)', 
          borderTop: '1px solid #334155' 
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {ACTION_GRID.map((action, i) => (
              <motion.button
                key={action.label}
                onClick={() => handleAction(i)}
                disabled={state.isTyping}
                whileTap={{ scale: 0.93 }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: '4px', borderRadius: '12px', padding: '12px 4px',
                  backgroundColor: '#1e293b', border: '1px solid #334155',
                  color: 'white', cursor: state.isTyping ? 'not-allowed' : 'pointer',
                  opacity: state.isTyping ? 0.3 : 1
                }}
              >
                <span style={{ fontSize: '20px' }}>{action.icon}</span>
                <span style={{ fontSize: '10px', color: '#f8fafc', textAlign: 'center' }}>
                  {action.label}
                </span>
              </motion.button>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}
