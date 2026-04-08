"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useGameStore } from "@/store/game-store";

const WEATHER_LABEL: Record<string, string> = { clear: "☀️ 晴", rain: "🌧️ 雨", fog: "🌫️ 霧", thunder: "⛈️ 雷" };
const TIME_LABEL: Record<string, string> = { dawn: "🌅 黎明", morning: "🌤️ 早晨", noon: "☀️ 正午", dusk: "🌆 黃昏", night: "🌙 深夜" };

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

// World-specific character appearance for portrait generation
const WORLD_CHAR_DESC: Record<string, string> = {
  xian_xia:        "xianxia cultivator, ancient chinese flowing white robes, glowing golden eyes",
  campus:          "japanese high school student, school uniform, backpack",
  apocalypse:      "post-apocalyptic survivor, tactical gear, torn clothing",
  adult:           "young adult, modern casual city clothes",
  wuxia:           "chinese martial artist, traditional hanfu, sword on back",
  western_fantasy: "medieval fantasy adventurer, cloak, sword and shield",
  cyberpunk:       "cyberpunk character, mechanical arm, neon glow, dark jacket",
  horror:          "pale mysterious figure, dark coat, unsettling calm",
  palace_intrigue: "ancient chinese court noble, elaborate silk robes, headdress",
  wasteland:       "wasteland scavenger, patchwork armor, gas mask at belt",
  custom:          "adventurer, versatile outfit",
};

// Deterministic hash for stable portrait seeds
function hashStr(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) & 0x7fffffff;
  }
  return h % 99999;
}

function getCharPortraitUrl(playerName: string, worldKey: string): string {
  const desc = WORLD_CHAR_DESC[worldKey] ?? WORLD_CHAR_DESC.custom;
  const seed = hashStr(playerName + worldKey + "char");
  const prompt = `16-bit pixel art, game character portrait, ${desc}, ${playerName}, full body sprite, white background, detailed pixel art`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=120&height=120&nologo=true&seed=${seed}`;
}

function getNPCPortraitUrl(npcName: string, worldKey: string): string {
  const seed = hashStr(npcName + worldKey + "npc");
  const prompt = `16-bit pixel art, game NPC character portrait, ${npcName}, ${WORLD_CHAR_DESC[worldKey] ?? "character"}, face and shoulders, pixel art sprite, game character`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=64&height=64&nologo=true&seed=${seed}`;
}

export default function StatusBar({ accent }: { accent: string }) {
  const { adventure, npcs, playerName } = useGameStore();
  const [open, setOpen] = useState(false);

  if (!adventure) return null;

  const hpPct = Math.round((adventure.hp / adventure.hp_max) * 100);
  const mpPct = Math.round((adventure.mp / adventure.mp_max) * 100);
  const hpColor = hpPct < 20 ? "#ef4444" : hpPct < 50 ? "#f59e0b" : "#22c55e";

  const worldAttr = adventure.world_attributes as Record<string, unknown>;
  const worldKey = (worldAttr?.world_flavor as string) ?? adventure.world_type;

  const charPortraitUrl = getCharPortraitUrl(playerName, worldKey);

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
        <MiniBar value={hpPct} color={hpColor} icon="❤️" />
        <MiniBar value={mpPct} color="#3b82f6" icon="💧" />
        <MiniBar value={adventure.stress} color={adventure.stress > 70 ? "#f43f5e" : "#a855f7"} icon="🧠" />
        <span style={{ marginLeft: "auto", fontSize: 10, color: accent, fontFamily: "monospace", opacity: 0.7 }}>
          📍{adventure.location?.slice(0, 8)} · {TIME_LABEL[adventure.time_of_day]?.slice(0, 2)} ·
          <span style={{ opacity: 0.5 }}> 詳細 ▸</span>
        </span>
      </button>

      {/* ── Detail popup modal ── */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 40, backdropFilter: "blur(4px)" }}
            />
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
                maxHeight: "82vh", overflowY: "auto",
              }}
            >
              <button onClick={() => setOpen(false)} style={{
                position: "absolute", top: 14, right: 14,
                background: "rgba(255,255,255,0.08)", border: "none",
                borderRadius: 8, padding: "4px 8px", cursor: "pointer",
              }}>
                <X size={14} color="rgba(148,163,184,0.7)" />
              </button>

              {/* ── Character portrait + name ── */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                <PixelPortrait src={charPortraitUrl} size={72} accent={accent} />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: accent }}>{playerName}</div>
                  <div style={{ fontSize: 11, color: "rgba(148,163,184,0.5)", fontFamily: "monospace", marginTop: 2 }}>
                    第 {adventure.generation} 世 · Tick {adventure.tick}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                    {(adventure.personality_tags ?? []).slice(0, 3).map((tag: string) => (
                      <span key={tag} style={{
                        padding: "2px 8px", borderRadius: 20, fontSize: 10,
                        background: `${accent}20`, border: `1px solid ${accent}40`, color: accent,
                      }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

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
              {(adventure.personality_tags ?? []).length > 3 && (
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

              {/* NPC Relationships with portraits */}
              {npcs.length > 0 && (
                <Section title="人際關係">
                  {npcs.map(npc => {
                    const aff = npc.affection;
                    const pct = Math.abs(aff);
                    const color = aff > 60 ? "#f472b6" : aff > 20 ? "#22c55e" : aff > -20 ? "#94a3b8" : aff > -60 ? "#f59e0b" : "#ef4444";
                    const label = aff > 60 ? "摯友" : aff > 20 ? "友好" : aff > -20 ? "中立" : aff > -60 ? "警惕" : "仇恨";
                    const npcPortrait = getNPCPortraitUrl(npc.name, worldKey);
                    return (
                      <div key={npc.id} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                          <PixelPortrait src={npcPortrait} size={36} accent={color} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                              <span style={{ color: "#cbd5e1", fontFamily: "monospace" }}>{npc.name}</span>
                              <span style={{ color, fontWeight: 700, fontSize: 10 }}>{label} {aff > 0 ? "+" : ""}{aff}</span>
                            </div>
                            <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginTop: 4 }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.6 }}
                                style={{ height: "100%", background: color, borderRadius: 2, boxShadow: `0 0 6px ${color}80` }}
                              />
                            </div>
                          </div>
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
                </div>
              </Section>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Portrait image component (shows pixel art sprite, stable via deterministic URL) ──
function PixelPortrait({ src, size, accent }: { src: string; size: number; accent: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div style={{
      width: size, height: size, borderRadius: 10, flexShrink: 0,
      border: `1px solid ${accent}40`,
      background: "rgba(255,255,255,0.04)",
      overflow: "hidden", position: "relative",
    }}>
      {!loaded && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: size > 50 ? 20 : 12,
        }}>
          {size > 50 ? "👤" : "·"}
        </div>
      )}
      <img
        src={src}
        alt=""
        onLoad={() => setLoaded(true)}
        style={{
          width: "100%", height: "100%", objectFit: "cover",
          imageRendering: "pixelated",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.4s",
        }}
      />
    </div>
  );
}

function MiniBar({ value, color, icon }: { value: number; color: string; icon: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: 11, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${value}%`, background: color,
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
