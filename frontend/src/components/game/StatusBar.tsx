"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useGameStore } from "@/store/game-store";

const WEATHER_LABEL: Record<string, string> = { clear: "☀️ 晴", rain: "🌧️ 雨", fog: "🌫️ 霧", thunder: "⛈️ 雷" };
const TIME_LABEL: Record<string, string> = { dawn: "🌅 黎明", morning: "🌤️ 早晨", noon: "☀️ 正午", dusk: "🌆 黃昏", night: "🌙 深夜" };

const CLOTHING_DISPLAY: Record<string, { label: string; color: string }> = {
  normal:     { label: "衣著整齊", color: "rgba(148,163,184,0.5)" },
  disheveled: { label: "衣衫凌亂", color: "#f59e0b" },
  partial:    { label: "衣物散亂", color: "#f87171" },
  minimal:    { label: "衣不蔽體", color: "#ef4444" },
  bare:       { label: "赤裸", color: "#dc2626" },
};

const BODY_DISPLAY: Record<string, { label: string; color: string }> = {
  normal:    { label: "正常", color: "rgba(148,163,184,0.5)" },
  flushed:   { label: "臉紅耳熱", color: "#f472b6" },
  sweaty:    { label: "汗如雨下", color: "#60a5fa" },
  injured:   { label: "帶傷", color: "#ef4444" },
  exhausted: { label: "精疲力竭", color: "#94a3b8" },
  aroused:   { label: "慾火中燒", color: "#fb923c" },
};

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

// World-specific half-body portrait descriptions
const WORLD_CHAR_DESC: Record<string, string> = {
  xian_xia:        "xianxia cultivator, white flowing robes, glowing eyes, sword on back",
  campus:          "japanese school student, uniform, young",
  apocalypse:      "post-apocalyptic survivor, tactical vest, determined",
  adult:           "young adult, modern stylish clothes, attractive",
  wuxia:           "chinese martial artist, traditional hanfu, warrior",
  western_fantasy: "medieval fantasy adventurer, cloak, warrior",
  cyberpunk:       "cyberpunk character, neon lights, mechanical arm",
  horror:          "pale mysterious figure, dark coat",
  palace_intrigue: "ancient chinese noble, elaborate silk robes, headdress",
  wasteland:       "wasteland scavenger, patchwork armor, rugged",
  custom:          "adventurer",
};

function hashStr(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) & 0x7fffffff;
  }
  return h % 99999;
}

// Half-body portrait: tall portrait ratio (width:height = 2:3), shows head+upper body
function getCharPortraitUrl(playerName: string, worldKey: string): string {
  const desc = WORLD_CHAR_DESC[worldKey] ?? WORLD_CHAR_DESC.custom;
  const seed = hashStr(playerName + worldKey + "char");
  const prompt = `16-bit pixel art, game character, ${desc}, half body portrait, head and upper torso, facing forward, plain dark background, detailed pixel art sprite, game rpg character`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=128&height=192&nologo=true&seed=${seed}`;
}

function getNPCPortraitUrl(npcName: string, worldKey: string): string {
  const seed = hashStr(npcName + worldKey + "npc");
  const prompt = `16-bit pixel art, game NPC, ${npcName}, half body portrait, head and upper torso, plain dark background, pixel art sprite`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=96&height=128&nologo=true&seed=${seed}`;
}

// Portrait card — small thumbnail, hover/tap expands to reveal full half-body
function PixelPortrait({
  src, thumbW, thumbH, accent, label,
}: {
  src: string; thumbW: number; thumbH: number; accent: string; label?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const expandedW = thumbW * 2.4;
  const expandedH = thumbH * 2.4;

  const handleTouchStart = () => {
    longPressRef.current = setTimeout(() => setExpanded(true), 300);
  };
  const handleTouchEnd = () => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
    setTimeout(() => setExpanded(false), 2200);
  };

  return (
    <div style={{ position: "relative", width: thumbW, height: thumbH, flexShrink: 0 }}>
      <motion.div
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        animate={{
          width: expanded ? expandedW : thumbW,
          height: expanded ? expandedH : thumbH,
          zIndex: expanded ? 200 : 1,
        }}
        transition={{ type: "spring", damping: 22, stiffness: 300 }}
        style={{
          position: "absolute", top: 0, left: 0,
          borderRadius: 10,
          border: `2px solid ${expanded ? accent : accent + "50"}`,
          background: "rgba(10,14,30,0.9)",
          overflow: "hidden",
          boxShadow: expanded ? `0 12px 40px rgba(0,0,0,0.7), 0 0 24px ${accent}40` : "none",
          cursor: "pointer",
        }}
      >
        {/* Placeholder / emoji fallback while loading */}
        {(!loaded || errored) && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 4, background: "rgba(255,255,255,0.03)",
          }}>
            <span style={{ fontSize: thumbW > 60 ? 28 : 16 }}>
              {errored ? "🖼️" : "👤"}
            </span>
            {!errored && (
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                style={{ width: thumbW * 0.6, height: 2, background: `${accent}40`, borderRadius: 1 }}
              />
            )}
          </div>
        )}
        <img
          src={src}
          alt={label ?? ""}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "top center",  // always shows face first
            imageRendering: "pixelated",
            opacity: loaded && !errored ? 1 : 0,
            transition: "opacity 0.35s",
          }}
        />
        {/* Name label on expand */}
        {expanded && label && (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: "4px 6px",
            background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
            fontSize: 10, color: accent, fontFamily: "monospace", textAlign: "center",
          }}>
            {label}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function StatusBar({ accent }: { accent: string }) {
  const { adventure, npcs, playerName } = useGameStore();
  const [open, setOpen] = useState(false);

  if (!adventure) return null;

  const hpPct = Math.round((adventure.hp / adventure.hp_max) * 100);
  const mpPct = Math.round((adventure.mp / adventure.mp_max) * 100);
  const hpColor = hpPct < 20 ? "#ef4444" : hpPct < 50 ? "#f59e0b" : "#22c55e";

  const worldAttr = (adventure.world_attributes ?? {}) as Record<string, unknown>;
  const worldKey = (worldAttr?.world_flavor as string) ?? adventure.world_type;
  const charPortraitUrl = getCharPortraitUrl(playerName, worldKey);

  const lust = (worldAttr.lust as number) ?? null;
  const willpower = (worldAttr.willpower as number) ?? null;
  const clothingState = (worldAttr.clothing_state as string) ?? "normal";
  const bodyStatus = (worldAttr.body_status as string) ?? "normal";
  const showImmersive = lust !== null || clothingState !== "normal" || bodyStatus !== "normal";

  return (
    <>
      {/* ── Compact HUD bar ── */}
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
        {lust !== null && <MiniBar value={lust} color="#f472b6" icon="🔥" />}
        <span style={{ marginLeft: "auto", fontSize: 10, color: accent, fontFamily: "monospace", opacity: 0.7 }}>
          📍{adventure.location?.slice(0, 8)} · {TIME_LABEL[adventure.time_of_day]?.slice(0, 2)} ·
          <span style={{ opacity: 0.5 }}> 詳細 ▸</span>
        </span>
      </button>

      {/* ── Detail popup ── */}
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

              {/* ── Character portrait + identity ── */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 24 }}>
                {/* Portrait: 72×108 thumbnail, hover reveals full half-body */}
                <PixelPortrait
                  src={charPortraitUrl}
                  thumbW={72}
                  thumbH={108}
                  accent={accent}
                  label={playerName}
                />
                <div style={{ flex: 1, paddingTop: 4 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: accent }}>{playerName}</div>
                  <div style={{ fontSize: 11, color: "rgba(148,163,184,0.5)", fontFamily: "monospace", marginTop: 3 }}>
                    第 {adventure.generation} 世 · Tick {adventure.tick}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(148,163,184,0.35)", marginTop: 4, fontFamily: "monospace" }}>
                    {TIME_LABEL[adventure.time_of_day]} · {WEATHER_LABEL[adventure.weather]}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                    {(adventure.personality_tags ?? []).slice(0, 4).map((tag: string) => (
                      <span key={tag} style={{
                        padding: "2px 8px", borderRadius: 20, fontSize: 10,
                        background: `${accent}18`, border: `1px solid ${accent}40`, color: accent,
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

              {/* Lust / Willpower / Body State */}
              {showImmersive && (
                <Section title="慾望與身體">
                  {lust !== null && (
                    <StatRow icon="🔥" label="慾望" value={lust} max={100} color={lust >= 70 ? "#f472b6" : lust >= 40 ? "#fb923c" : "#94a3b8"} accent={accent} />
                  )}
                  {willpower !== null && (
                    <StatRow icon="⚡" label="意志" value={willpower} max={100} color={willpower >= 60 ? "#60a5fa" : willpower >= 30 ? "#f59e0b" : "#ef4444"} accent={accent} />
                  )}
                  {(clothingState !== "normal" || bodyStatus !== "normal") && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                      {bodyStatus !== "normal" && (() => {
                        const bd = BODY_DISPLAY[bodyStatus] ?? { label: bodyStatus, color: "#94a3b8" };
                        return (
                          <span style={{ padding: "2px 9px", borderRadius: 20, fontSize: 10, background: `${bd.color}18`, border: `1px solid ${bd.color}50`, color: bd.color }}>
                            🫀 {bd.label}
                          </span>
                        );
                      })()}
                      {clothingState !== "normal" && (() => {
                        const cd = CLOTHING_DISPLAY[clothingState] ?? { label: clothingState, color: "#94a3b8" };
                        return (
                          <span style={{ padding: "2px 9px", borderRadius: 20, fontSize: 10, background: `${cd.color}18`, border: `1px solid ${cd.color}50`, color: cd.color }}>
                            👗 {cd.label}
                          </span>
                        );
                      })()}
                    </div>
                  )}
                </Section>
              )}

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

              {/* NPC list with portraits */}
              {npcs.length > 0 && (
                <Section title="人際關係">
                  {npcs.map(npc => {
                    const aff = npc.affection;
                    const pct = Math.abs(aff);
                    const color = aff > 60 ? "#f472b6" : aff > 20 ? "#22c55e" : aff > -20 ? "#94a3b8" : aff > -60 ? "#f59e0b" : "#ef4444";
                    const label = aff > 60 ? "摯友" : aff > 20 ? "友好" : aff > -20 ? "中立" : aff > -60 ? "警惕" : "仇恨";
                    const npcPortrait = getNPCPortraitUrl(npc.name, worldKey);
                    return (
                      <div key={npc.id} style={{ marginBottom: 14, display: "flex", alignItems: "flex-start", gap: 10 }}>
                        {/* NPC portrait: 44×60 thumbnail, hover expands */}
                        <PixelPortrait src={npcPortrait} thumbW={44} thumbH={60} accent={color} label={npc.name} />
                        <div style={{ flex: 1, paddingTop: 2 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                            <span style={{ color: "#cbd5e1", fontFamily: "monospace" }}>{npc.name}</span>
                            <span style={{ color, fontWeight: 700, fontSize: 10 }}>{label} {aff > 0 ? "+" : ""}{aff}</span>
                          </div>
                          <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6 }}
                              style={{ height: "100%", background: color, borderRadius: 2, boxShadow: `0 0 6px ${color}80` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </Section>
              )}

              {/* Location */}
              <Section title="當前位置">
                <div style={{ fontSize: 11, color: "rgba(148,163,184,0.6)", fontFamily: "monospace", lineHeight: 2 }}>
                  <div>📍 {adventure.location || "未知位置"}</div>
                </div>
              </Section>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function MiniBar({ value, color, icon }: { value: number; color: string; icon: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: 11, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 2, boxShadow: `0 0 4px ${color}60`, transition: "width 0.5s" }} />
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
