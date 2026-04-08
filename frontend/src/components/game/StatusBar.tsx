"use client";
import { useGameStore } from "@/store/game-store";

const WEATHER_LABEL: Record<string, string> = { clear: "☀️ 晴", rain: "🌧️ 雨", fog: "🌫️ 霧", thunder: "⛈️ 雷" };
const TIME_LABEL: Record<string, string> = { dawn: "🌅 黎明", morning: "🌤️ 早晨", noon: "☀️ 正午", dusk: "🌆 黃昏", night: "🌙 深夜" };

export default function StatusBar({ accent }: { accent: string }) {
  const { adventure } = useGameStore();
  if (!adventure) return null;

  const hpPct  = Math.round((adventure.hp / adventure.hp_max) * 100);
  const mpPct  = Math.round((adventure.mp / adventure.mp_max) * 100);
  const stPct  = adventure.stress;

  const hpColor  = hpPct < 20 ? "#ef4444" : hpPct < 50 ? "#f59e0b" : "#22c55e";
  const mpColor  = "#3b82f6";
  const stColor  = stPct > 70 ? "#f43f5e" : "#a855f7";

  return (
    <div style={{
      padding: "10px 12px 8px",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
      background: "rgba(0,0,0,0.2)",
    }}>
      {/* 屬性列 */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <StatBar icon="❤️" label="HP" value={adventure.hp} max={adventure.hp_max} pct={hpPct} color={hpColor} />
        <StatBar icon="💧" label="MP" value={adventure.mp} max={adventure.mp_max} pct={mpPct} color={mpColor} />
        <StatBar icon="🧠" label="壓力" value={adventure.stress} max={100} pct={stPct} color={stColor} />
        <div style={{
          display: "flex", flexDirection: "column", gap: 2, justifyContent: "center",
          padding: "4px 10px",
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${accent}30`,
          borderRadius: 8, minWidth: 52, textAlign: "center",
        }}>
          <span style={{ fontSize: 10, color: "rgba(148,163,184,0.5)", fontFamily: "monospace" }}>✨魅力</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: accent, fontFamily: "monospace" }}>{adventure.charisma}</span>
        </div>
      </div>

      {/* 位置 & 時間 */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginTop: 7, fontSize: 10, color: "rgba(148,163,184,0.4)", fontFamily: "monospace",
      }}>
        <span style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          📍 {adventure.location || "未知位置"}
        </span>
        <span style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <span>{TIME_LABEL[adventure.time_of_day]}</span>
          <span>{WEATHER_LABEL[adventure.weather]}</span>
          <span style={{ color: "rgba(148,163,184,0.25)" }}>#{adventure.tick}</span>
        </span>
      </div>

      {/* 個性標籤 */}
      {(adventure.personality_tags ?? []).length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
          {adventure.personality_tags.map((tag: string) => (
            <span key={tag} style={{
              padding: "1px 7px", borderRadius: 5, fontSize: 9,
              background: `${accent}18`,
              border: `1px solid ${accent}35`,
              color: accent, fontFamily: "monospace",
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function StatBar({ icon, label, value, max, pct, color }: {
  icon: string; label: string; value: number; max: number; pct: number; color: string;
}) {
  return (
    <div style={{
      flex: "1 1 80px", minWidth: 80,
      padding: "5px 8px",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
        <span style={{ fontSize: 12 }}>{icon}</span>
        <span style={{ fontSize: 10, color: "rgba(148,163,184,0.6)", fontFamily: "monospace" }}>{label}</span>
        <span style={{ marginLeft: "auto", fontSize: 10, color, fontFamily: "monospace", fontWeight: 700 }}>
          {value}<span style={{ color: "rgba(148,163,184,0.3)", fontWeight: 400 }}>/{max}</span>
        </span>
      </div>
      <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: color,
          borderRadius: 2,
          boxShadow: `0 0 6px ${color}80`,
          transition: "width 0.6s ease",
        }} />
      </div>
    </div>
  );
}
