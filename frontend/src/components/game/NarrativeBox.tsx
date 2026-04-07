"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/game-store";

export default function NarrativeBox() {
  const { narrative, isLoading } = useGameStore();

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 min-h-[200px] font-serif text-gray-100 leading-relaxed">
      {isLoading ? (
        <div className="flex items-center gap-2 text-cyan-400 animate-pulse">
          <span className="text-xl">▋</span>
          <span className="text-sm">故事展開中...</span>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={narrative.slice(0, 20)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="whitespace-pre-wrap text-base"
          >
            {narrative || "故事尚未開始。選擇一個世界，踏出第一步。"}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
