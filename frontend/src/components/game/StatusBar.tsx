"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useGameStore } from "@/store/game-store";
import type { NPCStateRow } from "@/lib/game/types";

// ── Mobile detection ──────────────────────────────────────────────────────────
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 480);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

// ── World-specific popup background patterns ─────────────────────────────────
const WORLD_BG_PATTERN: Record<string, string> = {
  xian_xia: [
    "radial-gradient(ellipse 80% 50% at 25% 10%, rgba(167,139,250,0.09) 0%, transparent 60%)",
    "radial-gradient(ellipse 60% 40% at 75% 90%, rgba(139,92,246,0.06) 0%, transparent 60%)",
  ].join(","),
  campus: [
    "repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(244,114,182,0.045) 39px,rgba(244,114,182,0.045) 40px)",
    "repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(244,114,182,0.045) 39px,rgba(244,114,182,0.045) 40px)",
  ].join(","),
  cyberpunk: "repeating-linear-gradient(90deg,transparent 0px,transparent 40px,rgba(6,182,212,0.05) 40px,rgba(6,182,212,0.05) 41px)",
  horror: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(74,222,128,0.04) 0%, transparent 70%)",
  palace_intrigue: "radial-gradient(ellipse 100% 30% at 50% 0%, rgba(251,191,36,0.06) 0%, transparent 70%)",
  wasteland: "radial-gradient(ellipse 90% 40% at 50% 0%, rgba(217,119,6,0.05) 0%, transparent 70%)",
};

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
  normal:       { label: "正常",   color: "rgba(148,163,184,0.5)" },
  flushed:      { label: "臉紅耳熱", color: "#f472b6" },
  sweaty:       { label: "汗如雨下", color: "#60a5fa" },
  injured:      { label: "帶傷",   color: "#ef4444" },
  exhausted:    { label: "精疲力竭", color: "#94a3b8" },
  aroused:      { label: "慾火中燒", color: "#fb923c" },
  poisoned:     { label: "中毒",   color: "#4ade80" },
  inner_injured:{ label: "內傷",   color: "#c084fc" },
  bleeding:     { label: "失血",   color: "#dc2626" },
  fever:        { label: "發燒",   color: "#f97316" },
  starving:     { label: "飢餓",   color: "#d97706" },
  possessed:    { label: "附身",   color: "#818cf8" },
  cursed:       { label: "詛咒",   color: "#6366f1" },
  drunk:        { label: "醉酒",   color: "#a78bfa" },
  medicated:    { label: "藥效中", color: "#34d399" },
  paralyzed:    { label: "麻痺",   color: "#67e8f9" },
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
  taiwanese_folk:  "taiwanese folk religion practitioner, red vest, deity medium, temple",
  custom:          "adventurer",
};

function hashStr(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) & 0x7fffffff;
  }
  return h % 99999;
}

// 8-bit pixel art character sprites — flux-schnell for speed
function getCharPortraitUrl(playerName: string, worldKey: string, gender?: string): string {
  const desc = WORLD_CHAR_DESC[worldKey] ?? WORLD_CHAR_DESC.custom;
  const seed = hashStr(playerName + worldKey + "char" + (gender ?? ""));
  const genderToken = gender === "男性" ? "1boy, male, " : gender === "女性" ? "1girl, female, " : "";
  const prompt = `${genderToken}pixel art, 8-bit RPG character sprite, full body standing pose, 16-bit JRPG style, thick black pixel outlines, limited color palette, vibrant colors, simple background, retro game character, ${desc}, visible pixel grid, crisp hard edges`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=128&height=192&nologo=true&seed=${seed}&model=flux-schnell`;
}

function getNPCPortraitUrl(npcName: string, worldKey: string): string {
  const seed = hashStr(npcName + worldKey + "npc");
  const prompt = `pixel art, 8-bit RPG character sprite, full body standing pose, 16-bit JRPG style, thick black pixel outlines, limited color palette, vibrant colors, simple background, retro game character, ${npcName}, visible pixel grid, crisp hard edges`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=96&height=128&nologo=true&seed=${seed}&model=flux-schnell`;
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
            objectPosition: "top center",
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

// ── NPC Card (trading-card style) ─────────────────────────────────────────────
function NpcCard({ npc, worldKey, index }: { npc: NPCStateRow; worldKey: string; index: number }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const aff = npc.affection;
  const relColor = aff > 60 ? "#f472b6" : aff > 20 ? "#22c55e" : aff > -20 ? "#94a3b8" : aff > -60 ? "#f59e0b" : "#ef4444";
  const relLabel = aff > 60 ? "摯友" : aff > 20 ? "友好" : aff > -20 ? "中立" : aff > -60 ? "警惕" : "仇恨";
  const src = getNPCPortraitUrl(npc.name, worldKey);

  return (
    <div style={{
      width: 88, flexShrink: 0,
      background: "linear-gradient(180deg, #1c2437 0%, #0d1221 100%)",
      border: "2px solid rgba(160,130,80,0.55)",
      borderRadius: 10,
      overflow: "hidden",
      boxShadow: "0 6px 20px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.06)",
    }}>
      {/* Card header — ID number */}
      <div style={{
        padding: "3px 7px",
        background: "rgba(0,0,0,0.35)",
        borderBottom: "1px solid rgba(160,130,80,0.28)",
      }}>
        <span style={{ fontSize: 8, color: "rgba(210,185,130,0.9)", fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.06em" }}>
          #{String(index + 1).padStart(4, "0")}
        </span>
      </div>

      {/* Portrait area */}
      <div style={{ width: 88, height: 108, position: "relative", background: "rgba(18,26,48,0.9)" }}>
        {!imgLoaded && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <motion.span
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              style={{ fontSize: 20 }}
            >👤</motion.span>
          </div>
        )}
        <img
          src={src}
          alt={npc.name}
          onLoad={() => setImgLoaded(true)}
          style={{
            width: "100%", height: "100%",
            objectFit: "contain", objectPosition: "bottom center",
            imageRendering: "pixelated",
            opacity: imgLoaded ? 1 : 0,
            transition: "opacity 0.35s",
          }}
        />
      </div>

      {/* Footer — name + relation tag */}
      <div style={{
        padding: "5px 6px 6px",
        background: "rgba(0,0,0,0.42)",
        borderTop: "1px solid rgba(160,130,80,0.2)",
      }}>
        <div style={{
          fontSize: 9, color: "#e8e8f0", fontFamily: "monospace", fontWeight: 700,
          letterSpacing: "0.04em", marginBottom: 4,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          textAlign: "center",
        }}>{npc.name}</div>
        <div style={{ display: "flex", gap: 3, justifyContent: "center" }}>
          <span style={{
            padding: "1px 5px", borderRadius: 3, fontSize: 8,
            background: `${relColor}28`, border: `1px solid ${relColor}65`,
            color: relColor, fontFamily: "monospace", fontWeight: 700,
          }}>{relLabel}</span>
          <span style={{
            padding: "1px 5px", borderRadius: 3, fontSize: 8,
            background: "rgba(100,116,139,0.18)", border: "1px solid rgba(100,116,139,0.35)",
            color: "rgba(148,163,184,0.8)", fontFamily: "monospace",
          }}>{aff > 0 ? "+" : ""}{aff}</span>
        </div>
      </div>
    </div>
  );
}

export default function StatusBar({ accent }: { accent: string }) {
  const { adventure, npcs, playerName } = useGameStore();
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  // Scale helper — apply 36% reduction on mobile (0.8 × 0.8 = 0.64)
  const s = (n: number) => isMobile ? Math.round(n * 0.64) : n;

  if (!adventure) return null;

  const hpPct = Math.round((adventure.hp / adventure.hp_max) * 100);
  const mpPct = Math.round((adventure.mp / adventure.mp_max) * 100);
  const hpColor = hpPct < 20 ? "#ef4444" : hpPct < 50 ? "#f59e0b" : "#22c55e";

  const worldAttr = (adventure.world_attributes ?? {}) as Record<string, unknown>;
  const worldKey = (worldAttr?.world_flavor as string) ?? adventure.world_type;
  const gender = (worldAttr.gender as string) ?? undefined;
  const charPortraitUrl = getCharPortraitUrl(playerName, worldKey, gender);

  const lust = (worldAttr.lust as number) ?? null;
  const willpower = (worldAttr.willpower as number) ?? null;
  const clothingState = (worldAttr.clothing_state as string) ?? "normal";
  const bodyStatus = (worldAttr.body_status as string) ?? "normal";
  const showImmersive = lust !== null || clothingState !== "normal" || bodyStatus !== "normal";

  // World background pattern for popup
  const worldBgPattern = WORLD_BG_PATTERN[worldKey] ?? "";

  return (
    <>
      {/* ── Compact HUD bar ── */}
      <button
        onClick={() => setOpen(true)}
        style={{
          width: "100%", padding: "9px 12px",
          background: "rgba(0,0,0,0.25)",
          borderBottom: `1px solid ${accent}25`,
          display: "flex", alignItems: "center", gap: isMobile ? 6 : 8,
          cursor: "pointer", border: "none", textAlign: "left",
        }}
      >
        <MiniBar value={hpPct} color={hpColor} icon="❤️" />
        <MiniBar value={mpPct} color="#3b82f6" icon="💧" />
        <MiniBar value={adventure.stress} color={adventure.stress > 70 ? "#f43f5e" : "#a855f7"} icon="🧠" />
        {lust !== null && <MiniBar value={lust} color="#f472b6" icon="🔥" />}
        {isMobile ? (
          /* Mobile: icon-only summary */
          <span style={{ marginLeft: "auto", fontSize: 11, color: `${accent}70`, flexShrink: 0 }}>
            {TIME_LABEL[adventure.time_of_day]?.slice(0, 2)} ▸
          </span>
        ) : (
          /* Desktop: full location + time */
          <span style={{ marginLeft: "auto", fontSize: 10, color: accent, fontFamily: "monospace", opacity: 0.7, flexShrink: 0 }}>
            📍{adventure.location?.slice(0, 8)} · {TIME_LABEL[adventure.time_of_day]?.slice(0, 2)}
            <span style={{ opacity: 0.5 }}> · 詳細 ▸</span>
          </span>
        )}
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
                position: "fixed", bottom: 0,
                left: isMobile ? 0 : "50%",
                transform: isMobile ? "none" : "translateX(-50%)",
                width: "100%", maxWidth: isMobile ? "100%" : 480,
                zIndex: 50,
                background: "#0a0e1e",
                backgroundImage: worldBgPattern || undefined,
                borderTop: `2px solid ${accent}60`,
                borderRadius: isMobile ? `${s(16)}px ${s(16)}px 0 0` : "20px 20px 0 0",
                padding: isMobile ? `${s(20)}px ${s(16)}px ${s(32)}px` : "20px 16px 32px",
                maxHeight: isMobile ? "78vh" : "82vh",
                overflowY: "auto",
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
              <div style={{ display: "flex", alignItems: "flex-start", gap: s(14), marginBottom: s(24) }}>
                <PixelPortrait
                  src={charPortraitUrl}
                  thumbW={s(72)}
                  thumbH={s(108)}
                  accent={accent}
                  label={playerName}
                />
                <div style={{ flex: 1, paddingTop: s(4) }}>
                  <div style={{ fontSize: s(18), fontWeight: 700, color: accent }}>{playerName}</div>
                  <div style={{ fontSize: s(11), color: "rgba(148,163,184,0.5)", fontFamily: "monospace", marginTop: s(3) }}>
                    第 {adventure.generation} 世 · Tick {adventure.tick}
                  </div>
                  <div style={{ fontSize: s(10), color: "rgba(148,163,184,0.35)", marginTop: s(4), fontFamily: "monospace" }}>
                    {TIME_LABEL[adventure.time_of_day]} · {WEATHER_LABEL[adventure.weather]}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: s(4), marginTop: s(8) }}>
                    {(adventure.personality_tags ?? []).slice(0, 4).map((tag: string) => (
                      <span key={tag} style={{
                        padding: `2px ${s(8)}px`, borderRadius: 20, fontSize: s(10),
                        background: `${accent}18`, border: `1px solid ${accent}40`, color: accent,
                      }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Core Stats */}
              <Section title="基本屬性" small={isMobile}>
                <StatRow icon="❤️" label="HP" value={adventure.hp} max={adventure.hp_max} color={hpColor} accent={accent} small={isMobile} />
                <StatRow icon="💧" label="MP" value={adventure.mp} max={adventure.mp_max} color="#3b82f6" accent={accent} small={isMobile} />
                <StatRow icon="🧠" label="壓力" value={adventure.stress} max={100} color={adventure.stress > 70 ? "#f43f5e" : "#a855f7"} accent={accent} small={isMobile} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: s(12), color: "rgba(203,213,225,0.8)", padding: `${s(4)}px 0` }}>
                  <span>✨ 魅力</span>
                  <span style={{ color: accent, fontWeight: 700 }}>{adventure.charisma}</span>
                </div>
              </Section>

              {/* Lust / Willpower / Body State */}
              {showImmersive && (
                <Section title="身體狀況" small={isMobile}>
                  {lust !== null && (
                    <StatRow icon="🔥" label="慾望" value={lust} max={100} color={lust >= 70 ? "#f472b6" : lust >= 40 ? "#fb923c" : "#94a3b8"} accent={accent} small={isMobile} />
                  )}
                  {willpower !== null && (
                    <StatRow icon="⚡" label="意志" value={willpower} max={100} color={willpower >= 60 ? "#60a5fa" : willpower >= 30 ? "#f59e0b" : "#ef4444"} accent={accent} small={isMobile} />
                  )}
                  {(clothingState !== "normal" || bodyStatus !== "normal") && (
                    <div style={{ display: "flex", gap: s(6), flexWrap: "wrap", marginTop: s(4) }}>
                      {bodyStatus !== "normal" && (() => {
                        const bd = BODY_DISPLAY[bodyStatus] ?? { label: bodyStatus, color: "#94a3b8" };
                        return (
                          <span style={{ padding: `2px ${s(9)}px`, borderRadius: 20, fontSize: s(10), background: `${bd.color}18`, border: `1px solid ${bd.color}50`, color: bd.color }}>
                            🫀 {bd.label}
                          </span>
                        );
                      })()}
                      {clothingState !== "normal" && (() => {
                        const cd = CLOTHING_DISPLAY[clothingState] ?? { label: clothingState, color: "#94a3b8" };
                        return (
                          <span style={{ padding: `2px ${s(9)}px`, borderRadius: 20, fontSize: s(10), background: `${cd.color}18`, border: `1px solid ${cd.color}50`, color: cd.color }}>
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
                <Section title="世界屬性" small={isMobile}>
                  {(WORLD_ATTRS[worldKey] ?? []).map(attr => {
                    const val = worldAttr?.[attr.key];
                    return (
                      <div key={attr.key} style={{ display: "flex", justifyContent: "space-between", fontSize: s(12), color: "rgba(203,213,225,0.8)", padding: `${s(4)}px 0` }}>
                        <span>{attr.emoji} {attr.label}</span>
                        <span style={{ color: accent, fontWeight: 700 }}>{val !== undefined ? String(val) : "—"}</span>
                      </div>
                    );
                  })}
                </Section>
              )}

              {/* NPC cards — horizontal scroll row */}
              {npcs.length > 0 && (
                <Section title="人際關係" small={isMobile}>
                  <div style={{
                    display: "flex", gap: 10, overflowX: "auto",
                    paddingBottom: 8,
                    scrollbarWidth: "none",
                  }}>
                    {npcs.map((npc, idx) => (
                      <NpcCard key={npc.id} npc={npc} worldKey={worldKey} index={idx} />
                    ))}
                  </div>
                </Section>
              )}

              {/* Location */}
              <Section title="當前位置" small={isMobile}>
                <div style={{ fontSize: s(11), color: "rgba(148,163,184,0.6)", fontFamily: "monospace", lineHeight: 2 }}>
                  <div>📍 {adventure.location || "未知位置"}</div>
                  {isMobile && (
                    <div style={{ marginTop: 2 }}>
                      {TIME_LABEL[adventure.time_of_day]} · {WEATHER_LABEL[adventure.weather]}
                    </div>
                  )}
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

function Section({ title, children, small }: { title: string; children: React.ReactNode; small?: boolean }) {
  return (
    <div style={{ marginBottom: small ? 16 : 20 }}>
      <div style={{ fontSize: small ? 8 : 10, color: "rgba(148,163,184,0.4)", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "monospace", marginBottom: small ? 6 : 8 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function StatRow({ icon, label, value, max, color, accent, small }: { icon: string; label: string; value: number; max: number; color: string; accent: string; small?: boolean }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ marginBottom: small ? 6 : 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: small ? 9 : 11, color: "rgba(203,213,225,0.7)", marginBottom: small ? 3 : 4 }}>
        <span>{icon} {label}</span>
        <span style={{ color, fontWeight: 700 }}>{value}<span style={{ color: "rgba(148,163,184,0.3)", fontWeight: 400 }}>/{max}</span></span>
      </div>
      <div style={{ height: small ? 4 : 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }}
          style={{ height: "100%", background: color, borderRadius: 3, boxShadow: `0 0 8px ${color}70` }}
        />
      </div>
    </div>
  );
}
