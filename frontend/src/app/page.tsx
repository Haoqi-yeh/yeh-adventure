"use client";
import { useGameStore } from "@/store/game-store";
import WorldSelector from "@/components/game/WorldSelector";
import NarrativeBox from "@/components/game/NarrativeBox";
import ChoicePanel from "@/components/game/ChoicePanel";
import StatusBar from "@/components/game/StatusBar";
import { motion } from "framer-motion";

export default function Home() {
  const { adventure, reset } = useGameStore();

  return (
    <main className="min-h-screen">
      {!adventure ? (
        <WorldSelector />
      ) : (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
          {/* 頂部標題列 */}
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold font-pixel text-purple-300/80 neon-text">
              做個白日夢冒險
            </h1>
            <button
              onClick={reset}
              className="text-[11px] text-white/20 hover:text-white/50 font-pixel transition-colors"
            >
              ← 重新開始
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <StatusBar />
            <NarrativeBox />
            <ChoicePanel />
          </motion.div>
        </div>
      )}
    </main>
  );
}
