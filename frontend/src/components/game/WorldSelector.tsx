"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import type { WorldType } from "@/lib/game/types";

const WORLDS: { type: WorldType; emoji: string; name: string; desc: string; color: string }[] = [
  { type: "xian_xia",    emoji: "⚔️",  name: "仙俠",  desc: "修仙、靈力、宗門恩怨",       color: "from-cyan-900/40 to-blue-900/40 border-cyan-700/50 hover:border-cyan-400" },
  { type: "campus",      emoji: "🏫", name: "校園",  desc: "青春、壓力、那個你喜歡的人", color: "from-pink-900/40 to-purple-900/40 border-pink-700/50 hover:border-pink-400" },
  { type: "apocalypse",  emoji: "☣️",  name: "末日",  desc: "活下去才是唯一的目標",       color: "from-orange-900/40 to-red-900/40 border-orange-700/50 hover:border-orange-400" },
  { type: "adult",       emoji: "🏙️", name: "成人",  desc: "慾望、選擇、無解的現實",     color: "from-violet-900/40 to-indigo-900/40 border-violet-700/50 hover:border-violet-400" },
];

export default function WorldSelector() {
  const { playerName, setPlayerName, startAdventure, isLoading, error } = useGameStore();
  const [selected, setSelected] = useState<WorldType>("campus");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-xl space-y-8"
      >
        {/* 標題 */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
          >
            <h1 className="text-4xl md:text-5xl font-bold tracking-widest neon-text text-white font-pixel">
              做個白日夢冒險
            </h1>
          </motion.div>
          <p className="text-purple-400/70 text-sm tracking-widest font-pixel">
            ── 沉浸式文字冒險引擎 ──
          </p>
        </div>

        {/* 名字輸入 */}
        <div className="space-y-2">
          <label className="text-purple-300/80 text-xs tracking-widest font-pixel">YOUR NAME</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && playerName.trim() && startAdventure(selected)}
            placeholder="輸入你的名字..."
            className="w-full glass rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-purple-500/80 font-pixel text-sm transition-all duration-200"
          />
        </div>

        {/* 世界選擇 */}
        <div className="space-y-2">
          <label className="text-purple-300/80 text-xs tracking-widest font-pixel">CHOOSE YOUR WORLD</label>
          <div className="grid grid-cols-2 gap-3">
            {WORLDS.map((world) => (
              <motion.button
                key={world.type}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelected(world.type)}
                className={`relative p-4 rounded-xl border bg-gradient-to-br text-left transition-all duration-200 scanline overflow-hidden
                  ${world.color}
                  ${selected === world.type
                    ? "ring-2 ring-white/30 shadow-lg shadow-purple-900/30"
                    : "opacity-70 hover:opacity-100"
                  }`}
              >
                {selected === world.type && (
                  <motion.div
                    layoutId="worldSelected"
                    className="absolute inset-0 bg-white/5 rounded-xl"
                  />
                )}
                <div className="text-2xl mb-2">{world.emoji}</div>
                <div className="font-bold text-sm text-white font-pixel">{world.name}</div>
                <div className="text-xs text-white/50 mt-1 leading-relaxed">{world.desc}</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* 錯誤訊息 */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass rounded-xl px-4 py-3 border border-red-500/40 text-red-300 text-sm font-pixel"
            >
              ⚠ {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 開始按鈕 */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => startAdventure(selected)}
          disabled={isLoading || !playerName.trim()}
          className="w-full py-4 rounded-xl font-bold font-pixel tracking-widest text-base
            bg-gradient-to-r from-purple-700 to-indigo-700
            hover:from-purple-600 hover:to-indigo-600
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-all duration-200 shadow-lg shadow-purple-900/40
            border border-purple-500/30 text-white"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">◌</span> 展開故事中...
            </span>
          ) : "▶  開始冒險"}
        </motion.button>
      </motion.div>
    </div>
  );
}
