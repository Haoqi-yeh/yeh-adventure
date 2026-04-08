"use client";
import { useGameStore } from "@/store/game-store";
import WorldSelector from "@/components/game/WorldSelector";
import NarrativeBox from "@/components/game/NarrativeBox";
import ChoicePanel from "@/components/game/ChoicePanel";
import StatusBar from "@/components/game/StatusBar";
import { motion } from "framer-motion";

// World-specific atmospheric colors for the side panels and bg
const WORLD_GLOW: Record<string, string> = {
  xian_xia:        "radial-gradient(ellipse 60% 80% at 50% 0%, rgba(99,60,220,0.25) 0%, transparent 70%)",
  campus:          "radial-gradient(ellipse 60% 80% at 50% 0%, rgba(236,72,153,0.20) 0%, transparent 70%)",
  apocalypse:      "radial-gradient(ellipse 60% 80% at 50% 0%, rgba(234,88,12,0.25) 0%, transparent 70%)",
  adult:           "radial-gradient(ellipse 60% 80% at 50% 0%, rgba(6,182,212,0.18) 0%, transparent 70%)",
  wuxia:           "radial-gradient(ellipse 60% 80% at 50% 0%, rgba(220,38,38,0.22) 0%, transparent 70%)",
  western_fantasy: "radial-gradient(ellipse 60% 80% at 50% 0%, rgba(16,185,129,0.20) 0%, transparent 70%)",
  cyberpunk:       "radial-gradient(ellipse 60% 80% at 50% 0%, rgba(6,182,212,0.25) 0%, transparent 70%)",
  horror:          "radial-gradient(ellipse 60% 80% at 50% 0%, rgba(20,83,45,0.30) 0%, transparent 70%)",
  palace_intrigue: "radial-gradient(ellipse 60% 80% at 50% 0%, rgba(180,83,9,0.22) 0%, transparent 70%)",
  wasteland:       "radial-gradient(ellipse 60% 80% at 50% 0%, rgba(161,98,7,0.22) 0%, transparent 70%)",
  custom:          "radial-gradient(ellipse 60% 80% at 50% 0%, rgba(99,60,220,0.18) 0%, transparent 70%)",
};

export default function Home() {
  const { adventure, reset } = useGameStore();

  if (!adventure) return <WorldSelector />;

  const worldAttr = adventure.world_attributes as Record<string, unknown>;
  const worldKey = (worldAttr?.world_flavor as string) ?? adventure.world_type;
  const glow = WORLD_GLOW[worldKey] ?? WORLD_GLOW.custom;

  return (
    <div
      className="min-h-screen w-full flex items-start justify-center"
      style={{ backgroundImage: glow }}
    >
      {/* ── 中央手機欄 ── */}
      <div className="w-full max-w-[480px] min-h-screen flex flex-col bg-[#080c1a]/90 border-x border-white/5">
        {/* 頂部標題列 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <span className="text-sm font-bold text-purple-300 tracking-wider">
            做個白日夢冒險
          </span>
          <button
            onClick={reset}
            className="text-xs text-white/25 hover:text-white/60 transition-colors"
          >
            ← 重新開始
          </button>
        </div>

        {/* 遊戲主體 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col gap-0 overflow-y-auto"
        >
          <StatusBar />
          <NarrativeBox />
          <div className="px-4 pb-6 pt-2">
            <ChoicePanel />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
