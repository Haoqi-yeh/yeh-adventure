"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Play } from "lucide-react";
import { useGameStore } from "@/store/game-store";
import type { WorldType } from "@/lib/game/types";

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
];

const WORLD_PROMPTS: Record<string, string> = {
  xian_xia:        "ancient chinese immortal cultivation realm, mystical floating mountains, glowing energy, sword spirit",
  campus:          "japanese school campus, cherry blossom trees, anime students, warm spring afternoon",
  apocalypse:      "post-apocalyptic ruined city, dark sky, survivors, debris and dust",
  adult:           "neon-lit night city street, urban nightlife, rain reflections, cinematic atmosphere",
  wuxia:           "ancient chinese martial arts, misty mountains, pagoda temples, waterfall, warriors",
  western_fantasy: "magical fantasy kingdom, dragon flying, enchanted forest, medieval castle",
  cyberpunk:       "cyberpunk city at night, neon signs, flying cars, holographic ads, rainy streets",
  horror:          "haunted dark forest, full moon, fog, abandoned building, eerie atmosphere",
  palace_intrigue: "ancient chinese imperial palace, red lanterns, beautiful courtyard, imperial guard",
  wasteland:       "desert wasteland, ruined civilization, mutant creatures, sandstorm, bones",
  custom:          "magical adventure landscape, mysterious portal, fantasy world",
};

function getBgUrl(worldType: string, seed: number) {
  const base = WORLD_PROMPTS[worldType] ?? WORLD_PROMPTS.custom;
  const prompt = encodeURIComponent(`${base}, pixel art style, 16-bit retro game, vibrant colors, detailed scene`);
  return `https://image.pollinations.ai/prompt/${prompt}?width=1920&height=1080&nologo=true&seed=${seed}`;
}

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
  background: "rgba(15, 23, 42, 0.75)",
  border: "1px solid rgba(148, 163, 184, 0.2)",
  borderRadius: "12px",
  padding: "10px 14px",
  fontSize: "14px",
  color: "#f1f5f9",
  outline: "none",
  boxSizing: "border-box",
};

export default function WorldSelector() {
  const { playerName, setPlayerName, characterBio, setCharacterBio, startAdventure, isLoading, error } = useGameStore();
  const [selected, setSelected] = useState<WorldType>("campus");
  const [bgUrl, setBgUrl] = useState("");
  const [bgLoaded, setBgLoaded] = useState(false);

  // Generate random background when world changes
  useEffect(() => {
    setBgLoaded(false);
    const seed = Math.floor(Math.random() * 99999);
    setBgUrl(getBgUrl(selected, seed));
  }, [selected]);

  return (
    <div style={{
      minHeight: "100vh", width: "100%", overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative",
    }}>
      {/* 背景色底層 */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(135deg, #0a0520 0%, #050a15 50%, #0a0520 100%)",
      }} />

      {/* Pollinations.ai 生成背景圖 */}
      {bgUrl && (
        <motion.img
          key={bgUrl}
          src={bgUrl}
          alt=""
          onLoad={() => setBgLoaded(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: bgLoaded ? 0.35 : 0 }}
          transition={{ duration: 1.2 }}
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover",
            pointerEvents: "none",
          }}
        />
      )}

      {/* 深色漸層遮罩（確保文字可讀） */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 70% 70% at 50% 50%, rgba(5,10,21,0.6) 0%, rgba(5,10,21,0.85) 100%)",
        pointerEvents: "none",
      }} />

      {/* 表單卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        style={{
          position: "relative", zIndex: 10,
          width: "100%", maxWidth: "420px",
          padding: "2rem 1.5rem",
          background: "rgba(8, 12, 26, 0.70)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(148, 163, 184, 0.12)",
          borderRadius: "20px",
          display: "flex", flexDirection: "column", gap: "1.1rem",
          margin: "1rem",
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
          <p style={{ color: "rgba(148,163,184,0.6)", fontSize: "11px", letterSpacing: "0.2em", margin: 0 }}>
            ── 沉浸式文字冒險引擎 ──
          </p>
        </div>

        {/* 名字 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ color: "rgba(148,163,184,0.7)", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Your Name
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && playerName.trim() && startAdventure(selected)}
            placeholder="輸入你的名字..."
            style={inputStyle}
          />
        </div>

        {/* 世界 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ color: "rgba(148,163,184,0.7)", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Choose Your World
          </label>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value as WorldType)}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            {WORLDS.map((w) => (
              <option key={w.type} value={w.type} style={{ background: "#0f172a", color: "#f1f5f9" }}>
                {w.emoji}  {w.name} — {w.desc}
              </option>
            ))}
          </select>
        </div>

        {/* 角色設定 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ color: "rgba(148,163,184,0.7)", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Character Bio <span style={{ textTransform: "none", color: "rgba(100,116,139,0.7)", fontWeight: 400 }}>（選填）</span>
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

        {/* 按鈕 */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => startAdventure(selected)}
          disabled={isLoading || !playerName.trim()}
          style={{
            width: "100%", padding: "13px",
            borderRadius: 12, border: "none", cursor: isLoading || !playerName.trim() ? "not-allowed" : "pointer",
            background: isLoading || !playerName.trim()
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
              開始冒險
            </>
          )}
        </motion.button>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
