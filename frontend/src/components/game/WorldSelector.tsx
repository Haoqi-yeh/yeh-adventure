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
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-12 bg-[#050a15]">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-2xl w-full space-y-8"
      >
        {/* Logo + 標題 */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600
                          flex items-center justify-center shadow-lg shadow-purple-900/60">
            <Sparkles size={30} className="text-white" />
          </div>
          <h1 className="text-5xl font-bold tracking-tighter text-transparent bg-clip-text
                         bg-gradient-to-r from-purple-400 to-pink-600">
            做個白日夢冒險
          </h1>
          <p className="text-slate-400 text-sm tracking-widest">
            ── 沉浸式文字冒險引擎 ──
          </p>
        </div>

        {/* 名字輸入 */}
        <div>
          <label className="text-slate-400 text-sm uppercase tracking-widest mb-2 block">
            Your Name
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && playerName.trim() && startAdventure(selected)}
            placeholder="輸入你的名字..."
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3
                       text-white placeholder:text-slate-500
                       focus:ring-2 focus:ring-purple-500 outline-none transition-all"
          />
        </div>

        {/* 世界選擇 */}
        <div>
          <label className="text-slate-400 text-sm uppercase tracking-widest mb-2 block">
            Choose Your World
          </label>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value as WorldType)}
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3
                       text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all cursor-pointer"
          >
            {WORLDS.map((w) => (
              <option key={w.type} value={w.type}>
                {w.emoji}  {w.name} — {w.desc}
              </option>
            ))}
          </select>
        </div>

        {/* 角色設定 */}
        <div>
          <label className="text-slate-400 text-sm uppercase tracking-widest mb-2 block">
            Character Bio
            <span className="ml-2 text-slate-600 normal-case font-normal">（選填）</span>
          </label>
          <textarea
            value={characterBio}
            onChange={(e) => setCharacterBio(e.target.value)}
            placeholder={"你是誰？你有什麼過去？\n（例如：一個躲避追殺的真龍後裔，三年前從宗門出走，帶著師父留下的殘卷流亡至今...）"}
            rows={4}
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3
                       text-white placeholder:text-slate-500 leading-relaxed resize-none
                       focus:ring-2 focus:ring-purple-500 outline-none transition-all"
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
                className="rounded-xl px-4 py-3 border border-red-500/40 bg-red-950/40 text-red-300 text-sm space-y-1"
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
          whileTap={{ scale: 0.97 }}
          onClick={() => startAdventure(selected)}
          disabled={isLoading || !playerName.trim()}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600
                     hover:from-indigo-500 hover:to-purple-500
                     text-white font-bold rounded-xl
                     shadow-lg shadow-purple-500/20
                     transition-all active:scale-95
                     disabled:opacity-30 disabled:cursor-not-allowed
                     flex items-center justify-center gap-3 text-base tracking-wide"
        >
          {isLoading ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
