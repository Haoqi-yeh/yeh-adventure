"use client";
import { useState } from "react";
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

export default function WorldSelector() {
  const { playerName, setPlayerName, characterBio, setCharacterBio, startAdventure, isLoading, error } = useGameStore();
  const [selected, setSelected] = useState<WorldType>("campus");

  return (
    <div style={{
      minHeight: "100vh", width: "100%",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "3rem 1rem",
    }}>
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: "1.5rem" }}
      >
        {/* Logo + 標題 */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600
                          flex items-center justify-center shadow-xl shadow-purple-900/50">
            <Sparkles size={26} className="text-white" />
          </div>
          <h1 style={{
            fontSize: "2.5rem", fontWeight: 700, letterSpacing: "-0.02em",
            background: "linear-gradient(135deg, #c084fc 0%, #f472b6 50%, #818cf8 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            做個白日夢冒險
          </h1>
          <p className="text-slate-500 text-xs tracking-widest">
            ── 沉浸式文字冒險引擎 ──
          </p>
        </div>

        {/* 名字 */}
        <div className="space-y-1.5">
          <label className="text-slate-400 text-xs uppercase tracking-widest block">Your Name</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && playerName.trim() && startAdventure(selected)}
            placeholder="輸入你的名字..."
            className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm
                       focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50
                       transition-all"
          />
        </div>

        {/* 世界 */}
        <div className="space-y-1.5">
          <label className="text-slate-400 text-xs uppercase tracking-widest block">Choose Your World</label>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value as WorldType)}
            className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm
                       focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50
                       transition-all cursor-pointer"
          >
            {WORLDS.map((w) => (
              <option key={w.type} value={w.type}>
                {w.emoji}  {w.name} — {w.desc}
              </option>
            ))}
          </select>
        </div>

        {/* 角色設定 */}
        <div className="space-y-1.5">
          <label className="text-slate-400 text-xs uppercase tracking-widest block">
            Character Bio
            <span className="ml-2 text-slate-600 normal-case font-normal">（選填）</span>
          </label>
          <textarea
            value={characterBio}
            onChange={(e) => setCharacterBio(e.target.value)}
            placeholder={"你是誰？你有什麼過去？\n（例如：一個躲避追殺的真龍後裔，三年前從宗門出走...）"}
            rows={3}
            className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm
                       leading-relaxed resize-none
                       focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50
                       transition-all"
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
                className="rounded-xl px-4 py-3 border border-red-500/30 bg-red-950/40 text-red-300 text-sm space-y-1"
              >
                <div>⚠ {label}</div>
                {detail && detail !== label && (
                  <div className="text-red-500/50 text-xs break-all">{detail}</div>
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
          className="w-full py-4 rounded-xl font-bold text-base tracking-wide
                     bg-gradient-to-r from-indigo-600 to-purple-600
                     hover:from-indigo-500 hover:to-purple-500
                     shadow-lg shadow-purple-900/40
                     disabled:opacity-30 disabled:cursor-not-allowed
                     transition-all text-white flex items-center justify-center gap-3"
        >
          {isLoading ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              展開故事中...
            </>
          ) : (
            <>
              <Play size={18} className="fill-white" />
              開始冒險
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
}
