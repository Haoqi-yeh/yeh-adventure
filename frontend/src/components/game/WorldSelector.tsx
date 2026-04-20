"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Play, Dices, ChevronRight } from "lucide-react";
import { useGameStore } from "@/store/game-store";
import type { WorldType } from "@/lib/game/types";
import { rollThreeTraits, RARITY_CONFIG, getTraitName } from "@/lib/game/traits";
import type { Trait } from "@/lib/game/traits";

const WORLDS: { type: WorldType; emoji: string; name: string; desc: string }[] = [
  { type: "xian_xia",        emoji: "⚔️",  name: "仙俠",   desc: "修仙、靈力、宗門恩怨" },
  { type: "campus",          emoji: "🏫",  name: "校園",   desc: "青春、壓力、那個你喜歡的人" },
  { type: "apocalypse",      emoji: "☣️",  name: "末日",   desc: "活下去才是唯一的目標" },
  { type: "adult",           emoji: "🌃",  name: "成人",   desc: "慾望、選擇、無解的現實" },
  { type: "wuxia",           emoji: "🏮",  name: "武俠",   desc: "刀光劍影、快意恩仇、江湖路遠" },
  { type: "western_fantasy", emoji: "🧙",  name: "西幻",   desc: "巨龍、魔法、被遺忘的遺蹟" },
  { type: "cyberpunk",       emoji: "🤖",  name: "賽博",   desc: "義體、黑客、霓虹燈下的罪惡" },
  { type: "horror",          emoji: "👻",  name: "怪談",   desc: "規則、禁忌、深夜的恐懼" },
  { type: "palace_intrigue", emoji: "👑",  name: "宮鬥",   desc: "權謀、位階、步步驚心的後宮" },
  { type: "wasteland",       emoji: "🏜️",  name: "廢土",   desc: "拾荒、變異、文明的殘骸" },
  { type: "taiwanese_folk",  emoji: "🧧",  name: "宮廟",   desc: "乩身、符咒、草根超自然" },
];

const WRITING_STYLES = [
  { value: "九把刀風格",    desc: "節奏明快、少年熱血、短句衝擊" },
  { value: "言情小說風格",  desc: "眼神交會、心跳加速、細膩情感張力" },
  { value: "龍傲天爽文風格", desc: "天之驕子、打臉反殺、無敵主宰暢快感" },
  { value: "日常直白風格",  desc: "親切接地氣、輕鬆無壓力、像在聊天" },
  { value: "情色成人風格",  desc: "🔞 筆觸大膽、慾望流動、感官張力深度刻畫" },
];

function friendlyError(msg: string): { label: string; detail: string } {
  if (msg.includes("Quota") || msg.includes("quota") || msg.includes("429"))
    return { label: "AI 額度暫時用完，請稍等幾分鐘再試", detail: msg };
  if (msg.includes("API key") || msg.includes("401"))
    return { label: "API Key 設定有誤，請確認 Vercel 環境變數", detail: msg };
  if (msg.includes("fetch") || msg.includes("network") || msg.includes("Failed"))
    return { label: "無法連接伺服器，請稍後再試", detail: msg };
  if (msg.includes("Supabase") || msg.includes("supabase") || msg.includes("環境變數"))
    return { label: "資料庫設定有誤，請確認 Supabase 環境變數", detail: msg };
  return { label: "發生錯誤，請稍後再試", detail: msg };
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#ffffff",
  border: "1px solid rgba(100, 116, 139, 0.25)",
  borderRadius: "12px",
  padding: "10px 14px",
  fontSize: "14px",
  color: "#000000",
  outline: "none",
  boxSizing: "border-box",
};

const pixelPanelStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 10,
  width: "100%",
  background: "rgba(255, 252, 245, 0.92)",
  border: "3px solid rgba(37, 99, 235, 0.2)",
  borderRadius: "18px",
  display: "flex",
  flexDirection: "column",
  margin: "1rem",
  boxShadow: "0 18px 0 rgba(15, 23, 42, 0.12), 0 24px 40px rgba(15, 23, 42, 0.18)",
};

const GENDERS = [
  { value: "不指定", icon: "🎭" },
  { value: "男性",   icon: "♂" },
  { value: "女性",   icon: "♀" },
] as const;

// ── Trait Card ────────────────────────────────────────────────────────────────
// Solid header colors derived from rarity (more opaque than the glow border)
const RARITY_HEADER: Record<string, string> = {
  god:    "#dc2626",
  epic:   "#9333ea",
  rare:   "#2563eb",
  common: "#6b7280",
};

function TraitCard({ trait, worldKey, rolling }: { trait: Trait; worldKey: string; rolling: boolean }) {
  const cfg = RARITY_CONFIG[trait.rarity];
  const name = getTraitName(trait, worldKey);
  const headerColor = RARITY_HEADER[trait.rarity] ?? "#6b7280";

  return (
    <motion.div
      key={trait.id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: rolling ? 0.25 : 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        flex: 1,
        minWidth: 0,
        background: cfg.bg,
        border: `2px solid ${cfg.border}`,
        borderRadius: "12px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: `0 2px 16px ${cfg.border}`,
      }}
    >
      {/* Rarity header band */}
      <div style={{
        background: headerColor,
        padding: "5px 8px",
        textAlign: "center",
        fontSize: "11px",
        fontWeight: 800,
        color: "#ffffff",
        letterSpacing: "0.15em",
      }}>
        {cfg.label}
      </div>

      {/* Trait name */}
      <div style={{
        padding: "12px 8px 6px",
        fontWeight: 800,
        fontSize: "15px",
        textAlign: "center",
        color: cfg.color,
        letterSpacing: "0.06em",
        lineHeight: 1.25,
      }}>
        {name}
      </div>

      {/* Effect */}
      <div style={{
        padding: "0 10px 12px",
        fontSize: "11px",
        textAlign: "center",
        lineHeight: 1.55,
        color: "rgba(20,20,40,0.68)",
        flex: 1,
      }}>
        {trait.effect}
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function WorldSelector() {
  const {
    playerName, setPlayerName,
    characterBio, setCharacterBio,
    writingStyle, setWritingStyle,
    gender, setGender,
    setPendingTraits,
    startAdventure, isLoading, error,
  } = useGameStore();
  const [selected, setSelected] = useState<WorldType>("campus");
  const [step, setStep] = useState<1 | 2>(1);
  const [traits, setTraits] = useState<[Trait, Trait, Trait]>(() => rollThreeTraits());
  const [rolling, setRolling] = useState(false);

  const handleReroll = useCallback(() => {
    setRolling(true);
    setTimeout(() => {
      setTraits(rollThreeTraits());
      setRolling(false);
    }, 280);
  }, []);

  const handleProceedToTraits = () => {
    if (!playerName.trim()) return;
    setTraits(rollThreeTraits());
    setStep(2);
  };

  const handleConfirmStart = () => {
    setPendingTraits(traits);
    startAdventure(selected);
  };

  return (
    <div style={{
      minHeight: "100vh", width: "100%", overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative",
    }}>
      <AnimatePresence mode="wait">
        {step === 1 ? (
          /* ── Step 1: Player Info ── */
          <motion.div
            key="step1"
            className="light-form"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4 }}
            style={{
              ...pixelPanelStyle,
              maxWidth: "420px",
              padding: "2rem 1.5rem",
              gap: "1.1rem",
            }}
          >
            {/* Logo + 標題 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", textAlign: "center" }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: "linear-gradient(135deg, #7c3aed, #db2777)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
              }}>
                <Sparkles size={22} color="white" />
              </div>
              <h1 style={{
                fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.02em", margin: 0,
                background: "linear-gradient(135deg, #c084fc 0%, #f472b6 50%, #818cf8 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
                做個白日夢冒險
              </h1>
              <p style={{ color: "rgba(71,85,105,0.7)", fontSize: "11px", letterSpacing: "0.2em", margin: 0 }}>
                ── 點進去，換個世界換一種活法 ──
              </p>
            </div>

            {/* 名字 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ color: "rgba(71,85,105,0.8)", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                你的名字
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && playerName.trim() && handleProceedToTraits()}
                placeholder="輸入你的名字..."
                style={inputStyle}
              />
            </div>

            {/* 性別 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ color: "rgba(71,85,105,0.8)", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                性別
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                {GENDERS.map(({ value, icon }) => {
                  const active = gender === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setGender(value)}
                      style={{
                        flex: 1, padding: "10px 0", borderRadius: "12px",
                        border: `1px solid ${active ? "rgba(124,58,237,0.6)" : "rgba(100,116,139,0.25)"}`,
                        background: active ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.5)",
                        color: active ? "#7c3aed" : "rgba(71,85,105,0.75)",
                        fontSize: "13px", fontWeight: active ? 700 : 400,
                        cursor: "pointer", letterSpacing: "0.04em",
                        transition: "all 0.15s",
                        boxShadow: active ? "0 0 12px rgba(124,58,237,0.25)" : "none",
                      }}
                    >
                      {icon} {value}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 世界 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ color: "rgba(71,85,105,0.8)", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                選擇世界觀
              </label>
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value as WorldType)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {WORLDS.map((w) => (
                  <option key={w.type} value={w.type} style={{ background: "#ffffff", color: "#000000" }}>
                    {w.emoji}  {w.name} — {w.desc}
                  </option>
                ))}
              </select>
            </div>

            {/* 文筆風格 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ color: "rgba(71,85,105,0.8)", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                選擇文筆風格
              </label>
              <select
                value={writingStyle}
                onChange={(e) => setWritingStyle(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {WRITING_STYLES.map((s) => (
                  <option key={s.value} value={s.value} style={{ background: "#ffffff", color: "#000000" }}>
                    {s.desc}
                  </option>
                ))}
              </select>
            </div>

            {/* 角色設定 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ color: "rgba(71,85,105,0.8)", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                角色設定 <span style={{ textTransform: "none", color: "rgba(100,116,139,0.6)", fontWeight: 400 }}>（選填）</span>
              </label>
              <textarea
                value={characterBio}
                onChange={(e) => setCharacterBio(e.target.value)}
                placeholder={"你是誰？你有什麼過去？\n（例如：一個躲避追殺的真龍後裔...）"}
                rows={2}
                style={{ ...inputStyle, resize: "none", lineHeight: "1.6" }}
              />
            </div>

            {/* 錯誤 */}
            <AnimatePresence>
              {error && (() => {
                const { label, detail } = friendlyError(error);
                return (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      borderRadius: 10, padding: "10px 14px",
                      border: "1px solid rgba(239,68,68,0.3)",
                      background: "rgba(127,29,29,0.4)",
                      color: "#fca5a5", fontSize: 13,
                    }}
                  >
                    <div>⚠ {label}</div>
                    {detail && detail !== label && (
                      <div style={{ color: "rgba(252,165,165,0.4)", fontSize: 11, marginTop: 4, wordBreak: "break-all" }}>{detail}</div>
                    )}
                  </motion.div>
                );
              })()}
            </AnimatePresence>

            {/* 下一步按鈕 */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleProceedToTraits}
              disabled={!playerName.trim()}
              style={{
                width: "100%", padding: "13px",
                borderRadius: 12, border: "none", cursor: !playerName.trim() ? "not-allowed" : "pointer",
                background: !playerName.trim()
                  ? "rgba(99,102,241,0.3)"
                  : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                color: "white", fontWeight: 700, fontSize: 15,
                letterSpacing: "0.05em",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
                transition: "opacity 0.2s",
              }}
            >
              <ChevronRight size={17} />
              下一步：抽取天命特質
            </motion.button>
          </motion.div>
        ) : (
          /* ── Step 2: Trait Selection ── */
          <motion.div
            key="step2"
            className="light-form"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.4 }}
            style={{
              ...pixelPanelStyle,
              maxWidth: "480px",
              padding: "2rem 1.5rem",
              gap: "1.2rem",
            }}
          >
            {/* 標題 */}
            <div style={{ textAlign: "center" }}>
              <div style={{
                fontSize: "22px", fontWeight: 700, marginBottom: 4,
                background: "linear-gradient(135deg, #f59e0b, #ef4444, #a855f7)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
                逆天改命
              </div>
              <div style={{ fontSize: "12px", color: "rgba(71,85,105,0.7)", letterSpacing: "0.1em" }}>
                命運為你擲出三枚骰子 — 你將攜帶這些特質踏上旅途
              </div>
            </div>

            {/* 三張特質卡 */}
            <div style={{ display: "flex", gap: "10px" }}>
              {traits.map((t) => (
                <TraitCard key={t.id} trait={t} worldKey={selected} rolling={rolling} />
              ))}
            </div>

            {/* 重擲按鈕 */}
            <motion.button
              whileTap={{ scale: 0.95, rotate: -5 }}
              onClick={handleReroll}
              disabled={rolling}
              style={{
                width: "100%", padding: "11px",
                borderRadius: 12, border: "2px solid rgba(100,116,139,0.3)",
                cursor: rolling ? "not-allowed" : "pointer",
                background: "rgba(255,255,255,0.6)",
                color: "rgba(71,85,105,0.9)", fontWeight: 600, fontSize: 14,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.15s",
              }}
            >
              <Dices size={18} style={{ animation: rolling ? "spin 0.28s linear" : "none" }} />
              重新投擲（不限次數）
            </motion.button>

            {/* 確認開始 */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleConfirmStart}
              disabled={isLoading || rolling}
              style={{
                width: "100%", padding: "13px",
                borderRadius: 12, border: "none",
                cursor: isLoading || rolling ? "not-allowed" : "pointer",
                background: isLoading || rolling
                  ? "rgba(99,102,241,0.3)"
                  : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                color: "white", fontWeight: 700, fontSize: 15,
                letterSpacing: "0.05em",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
                transition: "opacity 0.2s",
              }}
            >
              {isLoading ? (
                <>
                  <span style={{
                    width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "white", borderRadius: "50%",
                    animation: "spin 0.8s linear infinite", display: "inline-block",
                  }} />
                  展開故事中...
                </>
              ) : (
                <>
                  <Play size={17} style={{ fill: "white" }} />
                  就此命運，開始冒險
                </>
              )}
            </motion.button>

            {/* 返回 */}
            <button
              onClick={() => setStep(1)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "rgba(71,85,105,0.55)", fontSize: "12px",
                textAlign: "center", padding: "4px",
              }}
            >
              ← 返回修改角色設定
            </button>

            {/* 錯誤 */}
            <AnimatePresence>
              {error && (() => {
                const { label, detail } = friendlyError(error);
                return (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      borderRadius: 10, padding: "10px 14px",
                      border: "1px solid rgba(239,68,68,0.3)",
                      background: "rgba(127,29,29,0.4)",
                      color: "#fca5a5", fontSize: 13,
                    }}
                  >
                    <div>⚠ {label}</div>
                    {detail && detail !== label && (
                      <div style={{ color: "rgba(252,165,165,0.4)", fontSize: 11, marginTop: 4, wordBreak: "break-all" }}>{detail}</div>
                    )}
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
