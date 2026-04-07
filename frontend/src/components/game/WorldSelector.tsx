"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import type { WorldType } from "@/lib/game/types";

const WORLDS: { type: WorldType; emoji: string; name: string; desc: string }[] = [
  { type: "xian_xia",   emoji: "⚔️",  name: "仙俠",  desc: "修仙、靈力、宗門恩怨" },
  { type: "campus",     emoji: "🏫", name: "校園",  desc: "青春、壓力、那個你喜歡的人" },
  { type: "apocalypse", emoji: "☣️",  name: "末日",  desc: "活下去才是唯一的目標" },
  { type: "adult",      emoji: "🏙️", name: "成人",  desc: "慾望、選擇、無解的現實" },
];

export default function WorldSelector() {
  const { playerName, setPlayerName, startAdventure, isLoading, error } = useGameStore();
  const [selected, setSelected] = useState<WorldType>("campus");

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-cyan-400 font-mono tracking-widest">PADNE</h1>
        <p className="text-gray-500 text-sm">像素藝術動態敘事引擎</p>
      </div>

      {/* 名字輸入 */}
      <div>
        <label className="block text-gray-400 text-sm mb-1">你的名字</label>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="輸入角色名稱..."
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-gray-200 focus:outline-none focus:border-cyan-500 font-mono"
        />
      </div>

      {/* 世界選擇 */}
      <div className="grid grid-cols-2 gap-3">
        {WORLDS.map((world) => (
          <motion.button
            key={world.type}
            whileTap={{ scale: 0.96 }}
            onClick={() => setSelected(world.type)}
            className={`p-4 rounded-xl border text-left transition-all duration-200 ${
              selected === world.type
                ? "border-cyan-500 bg-cyan-900/30 text-cyan-100"
                : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500"
            }`}
          >
            <div className="text-2xl mb-1">{world.emoji}</div>
            <div className="font-bold text-sm">{world.name}</div>
            <div className="text-xs opacity-70 mt-0.5">{world.desc}</div>
          </motion.button>
        ))}
      </div>

      {error && (
        <div className="text-red-400 text-sm text-center">{error}</div>
      )}

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => startAdventure(selected)}
        disabled={isLoading || !playerName.trim()}
        className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors font-mono tracking-widest"
      >
        {isLoading ? "載入中..." : "▶ 開始冒險"}
      </motion.button>
    </div>
  );
}
