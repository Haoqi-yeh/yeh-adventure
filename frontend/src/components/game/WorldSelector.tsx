"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Play } from "lucide-react";
import { useGameStore } from "@/store/game-store";
import type { WorldType } from "@/lib/game/types";

const WORLDS: { type: WorldType; emoji: string; name: string; desc: string }[] = [
  { type: "xian_xia",         emoji: "⚔️",  name: "仙俠",   desc: "修仙、靈力、宗門恩怨" },
  { type: "campus",           emoji: "🏫",  name: "校園",   desc: "青春、壓力、那個你喜歡的人" },
  { type: "apocalypse",       emoji: "☣️",  name: "末日",   desc: "活下去才是唯一的目標" },
  { type: "adult",            emoji: "🌃",  name: "成人",   desc: "慾望、選擇、無解的現實" },
  { type: "wuxia",            emoji: "🏮",  name: "武俠",   desc: "刀光劍影、快意恩仇、江湖路遠" },
  { type: "western_fantasy",  emoji: "🧙",  name: "西幻",   desc: "巨龍、魔法、被遺忘的遺蹟" },
  { type: "cyberpunk",        emoji: "🤖",  name: "賽博",   desc: "義體、黑客、霓虹燈下的罪惡" },
  { type: "horror",           emoji: "👻",  name: "怪談",   desc: "規則、禁忌、深夜的恐懼" },
  { type: "palace_intrigue",  emoji: "👑",  name: "宮鬥",   desc: "權謀、位階、步步驚心的後宮" },
  { type: "wasteland",        emoji: "🏜️",  name: "廢土",   desc: "拾荒、變異、文明的殘骸" },
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
  const selectedWorld = WORLDS.find((w) => w.type === selected)!;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
         style={{ background: "linear-gradient(135deg, #0f172a 0%, #1a1040 50%, #0f172a 100%)" }}>
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: "easeOut" }}
        className="w-full max-w-lg space-y-5"
      >
        {/* Logo + 標題 */}
        <div className="flex flex-col items-center gap-3 mb-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700
                          flex items-center justify-center shadow-lg shadow-violet-900/50">
            <Sparkles size={28} className="text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-wide text-center"
              style={{ textShadow: "0 0 20px rgba(139,92,246,0.7), 0 0 50px rgba(139,92,246,0.3)" }}>
            做個白日夢冒險
          </h1>
          <p className="text-slate-400 text-sm tracking-widest">
            ── 沉浸式文字冒險引擎 ──
          </p>
        </div>

        {/* 名字輸入 */}
        <div className="space-y-1.5">
          <label className="text-slate-300 text-xs font-semibold tracking-widest uppercase">
            Your Name
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && playerName.trim() && startAdventure(selected)}
            placeholder="輸入你的名字..."
            className="w-full rounded-2xl px-4 py-3 text-sm
              bg-slate-800/60 border border-slate-600/40 text-slate-100
              placeholder:text-slate-500
              focus:outline-none focus:border-violet-500/60 focus:bg-slate-800/80
              transition-all duration-200"
          />
        </div>

        {/* 世界選擇 */}
        <div className="space-y-1.5">
          <label className="text-slate-300 text-xs font-semibold tracking-widest uppercase">
            Choose Your World
          </label>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value as WorldType)}
            className="w-full rounded-2xl px-4 py-3 text-sm
              bg-slate-800/60 border border-slate-600/40 text-slate-100
              focus:outline-none focus:border-violet-500/60
              transition-all duration-200 cursor-pointer"
          >
            {WORLDS.map((w) => (
              <option key={w.type} value={w.type} className="bg-slate-900 text-slate-100">
                {w.emoji}  {w.name} — {w.desc}
              </option>
            ))}
          </select>
          <p className="text-slate-500 text-xs px-1">
            {selectedWorld.emoji} {selectedWorld.desc}
          </p>
        </div>

        {/* 角色設定 */}
        <div className="space-y-1.5">
          <label className="text-slate-300 text-xs font-semibold tracking-widest uppercase">
            Character Bio
            <span className="ml-2 text-slate-500 normal-case font-normal">（選填）</span>
          </label>
          <textarea
            value={characterBio}
            onChange={(e) => setCharacterBio(e.target.value)}
            placeholder={"你是誰？你有什麼過去？\n（例如：一個躲避追殺的真龍後裔，三年前從宗門出走，帶著師父留下的殘卷流亡至今...）"}
            rows={4}
            className="w-full rounded-2xl px-4 py-3 text-sm resize-none
              bg-slate-800/60 border border-slate-600/40 text-slate-100
              placeholder:text-slate-500 leading-relaxed
              focus:outline-none focus:border-violet-500/60 focus:bg-slate-800/80
              transition-all duration-200"
          />
        </div>

        {/* 錯誤訊息 */}
        <AnimatePresence>
          {error && (() => {
            const { label, detail } = friendlyError(error);
            return (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl px-4 py-3 border border-red-500/40 bg-red-950/40 text-red-300 text-sm space-y-1"
              >
                <div>⚠ {label}</div>
                {detail && detail !== label && (
                  <div className="text-red-500/60 text-xs break-all">{detail}</div>
                )}
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* 開始按鈕 */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => startAdventure(selected)}
          disabled={isLoading || !playerName.trim()}
          className="w-full py-4 rounded-2xl font-bold tracking-wider text-base
            flex items-center justify-center gap-3
            bg-gradient-to-r from-cyan-600 to-blue-600
            hover:from-cyan-500 hover:to-blue-500
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-all duration-200 text-white
            shadow-lg shadow-cyan-900/40"
        >
          {isLoading ? (
            <>
              <span className="animate-spin inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
              展開故事中...
            </>
          ) : (
            <>
              <Play size={20} className="fill-white" />
              開始冒險
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
}
