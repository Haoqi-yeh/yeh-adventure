"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/game-store";

export default function NarrativeBox() {
  const { narrative, isLoading } = useGameStore();

  return (
    <motion.div
      className="glass scanline rounded-2xl p-6 min-h-[200px] relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* 左側裝飾線 */}
      <div className="absolute left-0 top-6 bottom-6 w-0.5 bg-gradient-to-b from-transparent via-purple-500/50 to-transparent rounded-full" />

      {isLoading ? (
        <div className="flex items-center gap-3 text-purple-400 h-full min-h-[160px]">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-2 h-2 bg-purple-500 rounded-full block"
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
              />
            ))}
          </div>
          <span className="text-sm font-pixel text-purple-400/70">故事展開中...</span>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={narrative.slice(0, 30)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[15px] leading-8 text-white/85 pl-4 whitespace-pre-wrap"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            {narrative || (
              <span className="text-white/30 font-pixel text-sm">
                選擇一個世界，踏出第一步。
              </span>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
}
