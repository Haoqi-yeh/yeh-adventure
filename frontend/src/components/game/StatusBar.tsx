"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useGameStore } from "@/store/game-store";

const WEATHER_LABEL: Record<string, string> = { clear: "☀️ 晴", rain: "🌧️ 雨", fog: "🌫️ 霧", thunder: "⛈️ 雷" };
const TIME_LABEL: Record<string, string> = { dawn: "🌅 黎明", morning: "🌤️ 早晨", noon: "☀️ 正午", dusk: "🌆 黃昏", night: "🌙 深夜" };

// World-specific attribute definitions
const WORLD_ATTRS: Record<string, { key: string; label: string; emoji: string; max?: number }[]> = {
  xian_xia:        [{ key: "cultivation_level", label: "修為境界", emoji: "🧘" }, { key: "spirit_root", label: "靈根品質", emoji: "🌱" }, { key: "spirit_power", label: "靈力值", emoji: "💜", max: 1000 }],
  campus:          [{ key: "study_score", label: "學業成績", emoji: "📚", max: 100 }, { key: "popularity", label: "人氣指數", emoji: "⭐", max: 100 }, { key: "romance_points", label: "桃花指數", emoji: "💕", max: 100 }],
  apocalypse:      [{ key: "survival_score", label: "生存評分", emoji: "🪓", max: 100 }, { key: "supplies", label: "物資儲量", emoji: "🎒" }, { key: "trust_level", label: "信任指數", emoji: "🤝", max: 100 }],
  adult:           [{ key: "money", label: "存款", emoji: "💰" }, { key: "social_status", label: "社會地位", emoji: "👔", max: 100 }, { key: "mental_health", label: "心理狀態", emoji: "🧘", max: 100 }],
  wuxia:           [{ key: "martial_level", label: "武功境界", emoji: "🥋" }, { key: "reputation", label: "江湖名聲", emoji: "🏆", max: 100 }, { key: "internal_power", label: "內力", emoji: "🌀", max: 1000 }],
  western_fantasy: [{ key: "magic_level", label: "魔法等級", emoji: "✨" }, { key: "gold_coins", label: "金幣", emoji: "🪙" }, { key: "fame", label: "聲望", emoji: "🌟", max: 100 }],
  cyberpunk:       [{ key: "cyberware_level", label: "義體化程度", emoji: "🤖", max: 100 }, { key: "credit_points", label: "信用點", emoji: "💳" }, { key: "heat_level", label: "危險熱度", emoji: "🔥", max: 100 }],
  horror:          [{ key: "sanity", label: "理智值", emoji: "🧠", max: 100 }, { key: "clues", label: "線索數", emoji: "🔍" }, { key: "fear_level", label: "恐懼指數", emoji: "👁️", max: 100 }],
  palace_intrigue: [{ key: "power_level", label: "權勢", emoji: "👑", max: 100 }, { key: "favor_points", label: "聖眷", emoji: "🌸", max: 100 }, { key: "schemes", label: "謀略值", emoji: "🎭", max: 100 }],
  wasteland:       [{ key: "scrap_metal", label: "廢鐵", emoji: "⚙️" }, { key: "radiation", label: "輻射值", emoji: "☢️", max: 100 }, { key: "faction_rep", label: "勢力聲望", emoji: "🚩", max: 100 }],
  custom:          [],
};

export default function StatusBar({ accent }: { accent: string }) {
  const { adventure, npcs } = useGameStore();
  const [open, setOpen] = useState(false);

  if (!adventure) return null;

  const hpPct = Math.round((adventure.hp / adventure.hp_max) * 100);
  const mpPct = Math.round((adventure.mp / adventure.mp_max) * 100);
  const hpColor = hpPct < 20 ? "#ef4444" : hpPct < 50 ? "#f59e0b" : "#22c55e";

  const worldAttr = adventure.world_attributes as Record<string, unknown>;
  const worldKey = (worldAttr?.world_flavor as string) ?? adventure.world_type;

  return (
    <>
      {/* ── Compact HUD bar (clickable) ── */}
      <button
        onClick={() => setOpen(true)}
        style={{
          width: "100%", padding: "9px 12px",
          background: "rgba(0,0,0,0.25)",
          borderBottom: `1px solid ${accent}25`,
          display: "flex", alignItems: "center", gap: 8,
          cursor: "pointer", border: "none", textAlign: "left",
        }}
      >
        {/* HP bar */}
        <MiniBar value={hpPct} color={hpColor} icon="❤️" />
        <MiniBar value={mpPct} color="#3b82f6" icon="💧" />
        <MiniBar value={adventure.stress} color={adventure.stress > 70 ? "#f43f5e" : "#a855f7"} icon="🧠" invert />
        <span style={{ marginLeft: "auto", fontSize: 10, color: accent, fontFamily: "monospace", opacity: 0.7 }}>
          📍{adventure.location?.slice(0, 8)} ·{TIME_LABEL[adventure.time_of_day]?.slice(0, 2)} ·
          <span style={{ opacity: 0.5 }}> 詳細 ▸</span>
        </span>
      </button>

      {/* ── Detail popup modal ── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 40, backdropFilter: "blur(4px)" }}
            />
            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              style={{
                position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
                width: "100%", maxWidth: 480, zIndex: 50,
                background: "#0a0e1e",
                borderTop: `2px solid ${accent}60`,
                borderRadius: "20px 20px 0 0",
                padding: "20px 16px 32px",
                maxHeight: "80vh", overflowY: "auto",
              }}
            >
              {/* Close */}
              <button onClick={() => setOpen(false)} style={{
                position: "absolute", top: 14, right: 14,
                background: "rgba(255,255,255,0.08)", border: "none",
                borderRadius: 8, padding: "4px 8px", cursor: "pointer",
              }}>
                <X size={14} color="rgba(148,163,184,0.7)" />
              </button>

              <h3 style={{ margin: "0 0 16px", fontSize: 13, color: accent, fontFamily: "monospace", letterSpacing: "0.12em" }}>
                ◈ 角色詳情
              </h3>

              {/* Core Stats */}
              <Section title="基本屬性">
                <StatRow icon="❤️" label="HP" value={adventure.hp} max={adventure.hp_max} color={hpColor} accent={accent} />
                <StatRow icon="💧" label="MP" value={adventure.mp} max={adventure.mp_max} color="#3b82f6" accent={accent} />
                <StatRow icon="🧠" label="壓力" value={adventure.stress} max={100} color={adventure.stress > 70 ? "#f43f5e" : "#a855f7"} accent={accent} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(203,213,225,0.8)", padding: "4px 0" }}>
                  <span>✨ 魅力</span>
                  <span style={{ color: accent, fontWeight: 700 }}>{adventure.charisma}</span>
                </div>
              </Section>

              {/* World-specific */}
              {(WORLD_ATTRS[worldKey] ?? []).length > 0 && (
                <Section title="世界屬性">
                  {(WORLD_ATTRS[worldKey] ?? []).map(attr => {
                    const val = worldAttr?.[attr.key];
                    return (
                      <div key={attr.key} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(203,213,225,0.8)", padding: "4px 0" }}>
                        <span>{attr.emoji} {attr.label}</span>
                        <span style={{ color: accent, fontWeight: 700 }}>{val !== undefined ? String(val) : "—"}</span>
                      </div>
                    );
                  })}
                </Section>
              )}

              {/* Personality Tags */}
              {(adventure.personality_tags ?? []).length > 0 && (
                <Section title="人格特質">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingTop: 2 }}>
                    {adventure.personality_tags.map((tag: string) => (
                      <span key={tag} style={{
                        padding: "3px 10px", borderRadius: 20, fontSize: 11,
                        background: `${accent}20`, border: `1px solid ${accent}40`, color: accent,
                      }}>{tag}</span>
                    ))}
                  </div>
                </Section>
              )}

              {/* NPC Relationships */}
              {npcs.length > 0 && (
                <Section title="人際關係">
                  {npcs.map(npc => {
                    const aff = npc.affection; // -100 to 100
                    const isPositive = aff >= 0;
                    const pct = Math.abs(aff);
                    const color = aff > 60 ? "#f472b6" : aff > 20 ? "#22c55e" : aff > -20 ? "#94a3b8" : aff > -60 ? "#f59e0b" : "#ef4444";
                    const label = aff > 60 ? "摯友" : aff > 20 ? "友好" : aff > -20 ? "中立" : aff > -60 ? "警惕" : "仇恨";
                    return (
                      <div key={npc.id} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                          <span style={{ color: "#cbd5e1", fontFamily: "monospace" }}>{npc.name}</span>
                          <span style={{ color, fontWeight: 700, fontSize: 10 }}>{label} {isPositive ? "+" : ""}{aff}</span>
                        </div>
                        <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6 }}
                            style={{ height: "100%", background: color, borderRadius: 3, boxShadow: `0 0 6px ${color}80` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </Section>
              )}

              {/* Location & Time */}
              <Section title="當前狀態">
                <div style={{ fontSize: 11, color: "rgba(148,163,184,0.6)", fontFamily: "monospace", lineHeight: 2 }}>
                  <div>📍 {adventure.location || "未知位置"}</div>
                  <div>{TIME_LABEL[adventure.time_of_day]} · {WEATHER_LABEL[adventure.weather]}</div>
                  <div>第 {adventure.generation} 世 · Tick {adventure.tick}</div>
                </div>
              </Section>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function MiniBar({ value, color, icon, invert = false }: { value: number; color: string; icon: string; invert?: boolean }) {
  const pct = invert ? value : value; // value is already 0-100
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: 11, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, background: color,
          borderRadius: 2, boxShadow: `0 0 4px ${color}60`, transition: "width 0.5s",
        }} />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 10, color: "rgba(148,163,184,0.4)", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "monospace", marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function StatRow({ icon, label, value, max, color, accent }: { icon: string; label: string; value: number; max: number; color: string; accent: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(203,213,225,0.7)", marginBottom: 4 }}>
        <span>{icon} {label}</span>
        <span style={{ color, fontWeight: 700 }}>{value}<span style={{ color: "rgba(148,163,184,0.3)", fontWeight: 400 }}>/{max}</span></span>
      </div>
      <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }}
          style={{ height: "100%", background: color, borderRadius: 3, boxShadow: `0 0 8px ${color}70` }}
        />
      </div>
    </div>
  );
}
