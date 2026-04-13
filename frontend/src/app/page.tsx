"use client";
import { useGameStore } from "@/store/game-store";
import WorldSelector from "@/components/game/WorldSelector";
import NarrativeBox from "@/components/game/NarrativeBox";
import ChoicePanel from "@/components/game/ChoicePanel";
import StatusBar from "@/components/game/StatusBar";
import { motion } from "framer-motion";

export default function Home() {
  const { adventure, reset } = useGameStore();

  if (!adventure) return <WorldSelector />;

  const worldAttr = adventure.world_attributes as Record<string, unknown>;
  const worldKey = (worldAttr?.world_flavor as string) ?? adventure.world_type;

  const WORLD_ACCENT: Record<string, string> = {
    xian_xia: "#a78bfa", campus: "#f472b6", apocalypse: "#fb923c",
    adult: "#22d3ee", wuxia: "#f87171", western_fantasy: "#34d399",
    cyberpunk: "#06b6d4", horror: "#4ade80", palace_intrigue: "#fbbf24",
    wasteland: "#d97706", taiwanese_folk: "#f97316", custom: "#a78bfa",
  };
  const accent = WORLD_ACCENT[worldKey] ?? "#a78bfa";

  return (
    <div style={{
      minHeight: "100vh", width: "100%",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
    }}>
      {/* 世界色光暈 */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `radial-gradient(ellipse 50% 40% at 50% 0%, ${accent}22 0%, transparent 70%)`,
      }} />

      {/* 中央遊戲欄 */}
      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: 480,
        minHeight: "100vh",
        display: "flex", flexDirection: "column",
        background: "rgba(5, 10, 21, 0.92)",
        borderLeft: "1px solid rgba(255,255,255,0.06)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}>
        {/* 頂部 Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 16px",
          borderBottom: `1px solid ${accent}33`,
          background: "rgba(0,0,0,0.3)",
        }}>
          <span style={{
            fontSize: 13, fontWeight: 700, letterSpacing: "0.12em",
            color: accent, fontFamily: "monospace",
          }}>
            ◈ 做個白日夢冒險
          </span>
          <button
            onClick={reset}
            style={{
              fontSize: 11, color: "rgba(148,163,184,0.4)",
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "monospace", letterSpacing: "0.05em",
            }}
            onMouseOver={e => (e.currentTarget.style.color = "rgba(148,163,184,0.8)")}
            onMouseOut={e => (e.currentTarget.style.color = "rgba(148,163,184,0.4)")}
          >
            ← 重新開始
          </button>
        </div>

        {/* 遊戲主體 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}
        >
          <StatusBar accent={accent} />
          <NarrativeBox accent={accent} />
          <ChoicePanel accent={accent} />
        </motion.div>
      </div>
    </div>
  );
}
