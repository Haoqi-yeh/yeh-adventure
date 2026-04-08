"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/game-store";

// World-themed scene gradient
const WORLD_SCENE: Record<string, { from: string; to: string; emoji: string }> = {
  xian_xia:        { from: "#1a0a4a", to: "#0d0a2a", emoji: "⚔️" },
  campus:          { from: "#3a0a2a", to: "#1a0a20", emoji: "🏫" },
  apocalypse:      { from: "#3a0a00", to: "#1a0800", emoji: "☣️" },
  adult:           { from: "#001a3a", to: "#000a20", emoji: "🌃" },
  wuxia:           { from: "#3a0a0a", to: "#1a0505", emoji: "🏮" },
  western_fantasy: { from: "#0a2a1a", to: "#051a0a", emoji: "🧙" },
  cyberpunk:       { from: "#002a3a", to: "#001520", emoji: "🤖" },
  horror:          { from: "#0a1a0a", to: "#050f05", emoji: "👻" },
  palace_intrigue: { from: "#2a1a00", to: "#150d00", emoji: "👑" },
  wasteland:       { from: "#2a1500", to: "#150a00", emoji: "🏜️" },
  custom:          { from: "#1a0a4a", to: "#0d0a2a", emoji: "✨" },
};

export default function NarrativeBox() {
  const { narrative, imagePrompt, isLoading, adventure } = useGameStore();

  const worldAttr = adventure ? (adventure.world_attributes as Record<string, unknown>) : {};
  const worldKey = (worldAttr?.world_flavor as string) ?? adventure?.world_type ?? "custom";
  const scene = WORLD_SCENE[worldKey] ?? WORLD_SCENE.custom;

  return (
    <div className="flex flex-col">
      {/* 場景橫幅 */}
      <div
        className="relative h-36 flex flex-col items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(180deg, ${scene.from} 0%, ${scene.to} 100%)` }}
      >
        {/* 裝飾光暈 */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <div className="w-48 h-48 rounded-full blur-3xl"
               style={{ background: scene.from }} />
        </div>

        {isLoading ? (
          <div className="relative flex flex-col items-center gap-3">
            <div className="text-4xl animate-pulse">{scene.emoji}</div>
            <div className="flex gap-1.5">
              {[0,1,2].map(i => (
                <motion.span key={i}
                  className="w-1.5 h-1.5 rounded-full bg-white/50 block"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }}
                />
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={imagePrompt?.slice(0, 20) ?? "idle"}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="relative flex flex-col items-center gap-2 px-6 text-center"
            >
              <div className="text-5xl drop-shadow-lg">{scene.emoji}</div>
              {imagePrompt && (
                <p className="text-[10px] text-white/35 max-w-[280px] line-clamp-2 leading-relaxed">
                  {imagePrompt}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* 底部漸層遮罩 */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#080c1a] to-transparent" />
      </div>

      {/* 敘事文字 */}
      <div className="px-4 py-4 min-h-[180px]">
        {isLoading ? (
          <div className="flex items-center gap-3 text-slate-500 py-8 justify-center">
            <span className="text-sm">故事展開中...</span>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={narrative?.slice(0, 30) ?? "empty"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="text-[14px] leading-7 text-slate-200 whitespace-pre-wrap"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
            >
              {narrative || (
                <span className="text-slate-600 text-sm italic">
                  故事即將開始…
                </span>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
