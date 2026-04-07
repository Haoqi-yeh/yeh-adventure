"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import type { WorldType } from "@/lib/game/types";

const WORLDS: { type: WorldType; emoji: string; name: string; desc: string }[] = [
  { type: "xian_xia",   emoji: "⚔️",  name: "仙俠", desc: "修仙、靈力、宗門恩怨" },
  { type: "campus",     emoji: "🏫", name: "校園", desc: "青春、壓力、那個你喜歡的人" },
  { type: "apocalypse", emoji: "☣️",  name: "末日", desc: "活下去才是唯一的目標" },
  { type: "adult",      emoji: "🏙️", name: "成人", desc: "慾望、選擇、無解的現實" },
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
  const { playerName, setPlayerName, startAdventure, isLoading, error } = useGameStore();
  const [selected, setSelected] = useState<WorldType>("campus");

  const selectedWorld = WORLDS.find((w) => w.type === selected)!;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md space-y-6"
      >
        {/* 標題 */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold tracking-widest neon-text text-white font-pixel">
            做個白日夢冒險
          </h1>
          <p className="text-purple-300/60 text-sm tracking-widest font-pixel">
            ── 沉浸式文字冒險引擎 ──
          </p>
        </div>

        {/* 名字輸入 */}
        <div className="space-y-1">
          <label className="text-purple-300/80 text-xs tracking-widest font-pixel">YOUR NAME</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && playerName.trim() && startAdventure(selected)}
            placeholder="輸入你的名字..."
            className="w-full rounded-xl px-4 py-3 text-sm font-pixel
              border border-purple-400/40
              focus:outline-none focus:border-purple-500
              transition-all duration-200"
          />
        </div>

        {/* 世界選擇（下拉選單） */}
        <div className="space-y-1">
          <label className="text-purple-300/80 text-xs tracking-widest font-pixel">CHOOSE YOUR WORLD</label>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value as WorldType)}
            className="w-full rounded-xl px-4 py-3 text-sm font-pixel
              border border-purple-400/40
              focus:outline-none focus:border-purple-500
              transition-all duration-200 cursor-pointer"
          >
            {WORLDS.map((w) => (
              <option key={w.type} value={w.type}>
                {w.emoji}  {w.name} — {w.desc}
              </option>
            ))}
          </select>
          {/* 選中世界的描述提示 */}
          <p className="text-purple-300/50 text-xs font-pixel px-1 pt-1">
            {selectedWorld.emoji} {selectedWorld.desc}
          </p>
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
                className="rounded-xl px-4 py-3 border border-red-500/50 bg-red-950/60 text-red-200 text-sm font-pixel space-y-1"
              >
                <div>⚠ {label}</div>
                {detail && detail !== label && (
                  <div className="text-red-400/60 text-xs break-all">{detail}</div>
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
