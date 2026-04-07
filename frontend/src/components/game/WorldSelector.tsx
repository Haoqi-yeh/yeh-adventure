"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import type { WorldType } from "@/lib/game/types";

const WORLDS: { type: WorldType; emoji: string; name: string; desc: string; border: string; bg: string }[] = [
  { type: "xian_xia",   emoji: "⚔️",  name: "仙俠", desc: "修仙、靈力、宗門恩怨",       border: "border-cyan-600/60",   bg: "bg-cyan-950/60" },
  { type: "campus",     emoji: "🏫", name: "校園", desc: "青春、壓力、那個你喜歡的人", border: "border-pink-600/60",   bg: "bg-pink-950/60" },
  { type: "apocalypse", emoji: "☣️",  name: "末日", desc: "活下去才是唯一的目標",       border: "border-orange-600/60", bg: "bg-orange-950/60" },
  { type: "adult",      emoji: "🏙️", name: "成人", desc: "慾望、選擇、無解的現實",     border: "border-violet-600/60", bg: "bg-violet-950/60" },
];

function friendlyError(msg: string): string {
  if (msg.includes("Quota") || msg.includes("quota") || msg.includes("429"))
    return "AI 額度暫時用完，請稍等幾分鐘再試";
  if (msg.includes("API key") || msg.includes("401"))
    return "API Key 設定有誤，請確認 Vercel 環境變數";
  if (msg.includes("fetch") || msg.includes("network"))
    return "網路連線失敗，請重新整理後再試";
  return "發生錯誤，請稍後再試";
}

export default function WorldSelector() {
  const { playerName, setPlayerName, startAdventure, isLoading, error } = useGameStore();
  const [selected, setSelected] = useState<WorldType>("campus");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-xl space-y-6"
      >
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold tracking-widest neon-text text-white font-pixel">
            做個白日夢冒險
          </h1>
          <p className="text-purple-300/60 text-sm tracking-widest font-pixel">
            ── 沉浸式文字冒險引擎 ──
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-purple-300/80 text-xs tracking-widest font-pixel">YOUR NAME</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && playerName.trim() && startAdventure(selected)}
            placeholder="輸入你的名字..."
            className="w-full rounded-xl px-4 py-3 text-white text-sm font-pixel
              bg-white/5 border border-white/15
              focus:outline-none focus:border-purple-400/70
              placeholder:text-white/30 transition-all duration-200"
          />
        </div>

        <div className="space-y-1">
          <label className="text-purple-300/80 text-xs tracking-widest font-pixel">CHOOSE YOUR WORLD</label>
          <div className="grid grid-cols-2 gap-3">
            {WORLDS.map((world) => (
              <motion.button
                key={world.type}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelected(world.type)}
                className={`p-4 rounded-xl border text-left transition-all duration-200
                  ${world.bg} ${world.border}
                  ${selected === world.type
                    ? "ring-2 ring-white/25 opacity-100"
                    : "opacity-60 hover:opacity-90"
                  }`}
              >
                <div className="text-2xl mb-2">{world.emoji}</div>
                <div className="font-bold text-sm text-white font-pixel">{world.name}</div>
                <div className="text-xs text-white/60 mt-1 leading-relaxed">{world.desc}</div>
              </motion.button>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl px-4 py-3 border border-red-500/50 bg-red-950/60 text-red-200 text-sm font-pixel"
            >
              ⚠ {friendlyError(error)}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => startAdventure(selected)}
          disabled={isLoading || !playerName.trim()}
          className="w-full py-4 rounded-xl font-bold font-pixel tracking-widest text-base
            bg-gradient-to-r from-purple-700 to-indigo-700
            hover:from-purple-600 hover:to-indigo-600
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-all duration-200 text-white
            border border-purple-500/30"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin inline-block">◌</span> 展開故事中...
            </span>
          ) : "▶  開始冒險"}
        </motion.button>
      </motion.div>
    </div>
  );
}
