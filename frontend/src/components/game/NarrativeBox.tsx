"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/game-store";

const WORLD_FALLBACK_BG: Record<string, string> = {
  xian_xia:        "linear-gradient(160deg,#1a0845,#050220)",
  campus:          "linear-gradient(160deg,#2a0d1c,#100508)",
  apocalypse:      "linear-gradient(160deg,#2a0800,#0a0200)",
  adult:           "linear-gradient(160deg,#001a3a,#000a1a)",
  wuxia:           "linear-gradient(160deg,#280505,#0f0202)",
  western_fantasy: "linear-gradient(160deg,#052a18,#020f08)",
  cyberpunk:       "linear-gradient(160deg,#002030,#000d18)",
  horror:          "linear-gradient(160deg,#0a1205,#030602)",
  palace_intrigue: "linear-gradient(160deg,#281200,#100700)",
  wasteland:       "linear-gradient(160deg,#281500,#100800)",
  custom:          "linear-gradient(160deg,#1a0845,#050220)",
};

// Deterministic seed — same scene always reuses the same cached Pollinations.ai image
function hashSeed(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) & 0x7fffffff;
  }
  return h % 99999;
}

function getSceneUrl(imagePrompt: string, useSafeImage: boolean): string {
  if (!imagePrompt) return "";
  const seed = hashSeed(imagePrompt);

  if (useSafeImage) {
    // Standard pixel-art scene
    const full = `16-bit pixel art style, retro gaming aesthetic, vibrant colors, ${imagePrompt}`;
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(full)}?width=512&height=256&nologo=true&seed=${seed}`;
  } else {
    // Adult/intimate scene — anime illustration style, square aspect for character focus
    const full = `anime art, 2D illustration, adult content, mature, ${imagePrompt}, detailed, high quality`;
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(full)}?width=512&height=512&nologo=true&seed=${seed}&model=flux-anime`;
  }
}

function detectEvent(text: string): { type: "npc" | "event" | null; label: string; detail: string } {
  const npcMatch = text.match(/【奇遇NPC[：:]([^】]+)】/);
  if (npcMatch) return { type: "npc", label: "✦ 奇遇 NPC", detail: npcMatch[1] };
  if (text.includes("【奇遇NPC】")) return { type: "npc", label: "✦ 奇遇 NPC", detail: "" };

  const eventMatch = text.match(/【突發狀況[：:]([^】]+)】/);
  if (eventMatch) return { type: "event", label: "⚡ 突發狀況", detail: eventMatch[1] };
  if (text.includes("【突發狀況】")) return { type: "event", label: "⚡ 突發狀況", detail: "" };

  return { type: null, label: "", detail: "" };
}

// State-reactive character status badges shown in scene area
const CLOTHING_BADGES: Record<string, { icon: string; label: string; color: string }> = {
  disheveled: { icon: "👕", label: "衣衫凌亂", color: "#f59e0b" },
  partial:    { icon: "🔴", label: "衣物散亂", color: "#f87171" },
  minimal:    { icon: "🔴", label: "衣不蔽體", color: "#ef4444" },
  bare:       { icon: "⭕", label: "赤裸",     color: "#dc2626" },
};
const BODY_BADGES: Record<string, { icon: string; label: string; color: string }> = {
  flushed:   { icon: "😳", label: "臉紅",   color: "#f472b6" },
  sweaty:    { icon: "💦", label: "汗濕",   color: "#60a5fa" },
  injured:   { icon: "🩸", label: "受傷",   color: "#ef4444" },
  exhausted: { icon: "😮‍💨", label: "疲憊", color: "#94a3b8" },
  aroused:   { icon: "🔥", label: "亢奮",   color: "#fb923c" },
};

function CharacterSprite({ worldAttr }: { worldAttr: Record<string, unknown> }) {
  const clothing = (worldAttr.clothing_state as string) ?? "normal";
  const bodyStatus = (worldAttr.body_status as string) ?? "normal";
  const clothingBadge = CLOTHING_BADGES[clothing];
  const bodyBadge = BODY_BADGES[bodyStatus];
  if (!clothingBadge && !bodyBadge) return null;
  return (
    <div style={{
      position: "absolute", bottom: 48, right: 10,
      display: "flex", flexDirection: "column", gap: 4, zIndex: 5,
    }}>
      {bodyBadge && (
        <motion.div
          initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            background: "rgba(0,0,0,0.72)", borderRadius: 20,
            padding: "3px 9px",
            border: `1px solid ${bodyBadge.color}50`,
            backdropFilter: "blur(4px)",
          }}
        >
          <span style={{ fontSize: 10 }}>{bodyBadge.icon}</span>
          <span style={{ fontSize: 9, color: bodyBadge.color, fontFamily: "monospace", letterSpacing: "0.05em" }}>{bodyBadge.label}</span>
        </motion.div>
      )}
      {clothingBadge && (
        <motion.div
          initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.08 }}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            background: "rgba(0,0,0,0.72)", borderRadius: 20,
            padding: "3px 9px",
            border: `1px solid ${clothingBadge.color}50`,
            backdropFilter: "blur(4px)",
          }}
        >
          <span style={{ fontSize: 10 }}>{clothingBadge.icon}</span>
          <span style={{ fontSize: 9, color: clothingBadge.color, fontFamily: "monospace", letterSpacing: "0.05em" }}>{clothingBadge.label}</span>
        </motion.div>
      )}
    </div>
  );
}

export default function NarrativeBox({ accent }: { accent: string }) {
  const { narrative, imagePrompt, useSafeImage, isLoading, adventure } = useGameStore();

  const worldAttr = adventure ? (adventure.world_attributes as Record<string, unknown>) : {};
  const worldKey = (worldAttr?.world_flavor as string) ?? adventure?.world_type ?? "custom";
  const fallbackBg = WORLD_FALLBACK_BG[worldKey] ?? WORLD_FALLBACK_BG.custom;

  // ── Scene image with crossfade & error handling ──
  const [sceneUrl, setSceneUrl] = useState("");
  const [prevSceneUrl, setPrevSceneUrl] = useState("");
  const [sceneLoaded, setSceneLoaded] = useState(false);
  const [sceneError, setSceneError] = useState(false);

  useEffect(() => {
    if (!imagePrompt) return;
    const newUrl = getSceneUrl(imagePrompt, useSafeImage);
    if (newUrl === sceneUrl) return;
    setPrevSceneUrl(sceneUrl);
    setSceneLoaded(false);
    setSceneError(false);
    setSceneUrl(newUrl);
  }, [imagePrompt, useSafeImage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImageLoad = useCallback(() => {
    setSceneLoaded(true);
    setPrevSceneUrl("");
  }, []);

  const handleImageError = useCallback(() => {
    // Hide broken image icon; fallback gradient is already showing
    setSceneError(true);
    setSceneLoaded(false);
  }, []);

  // ── Typewriter (click anywhere to skip) ──
  const [displayed, setDisplayed] = useState("");
  const [typing, setTyping] = useState(false);
  const typerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const narrativeRef = useRef(narrative);
  narrativeRef.current = narrative;

  useEffect(() => {
    if (!narrative || isLoading) { setDisplayed(""); setTyping(false); return; }
    setDisplayed("");
    setTyping(true);
    let i = 0;
    if (typerRef.current) clearInterval(typerRef.current);
    typerRef.current = setInterval(() => {
      i++;
      setDisplayed(narrativeRef.current.slice(0, i));
      if (i >= narrativeRef.current.length) {
        clearInterval(typerRef.current!);
        setTyping(false);
      }
    }, 20);
    return () => { if (typerRef.current) clearInterval(typerRef.current); };
  }, [narrative, isLoading]);

  const skipTypewriter = () => {
    if (!typing) return;
    if (typerRef.current) clearInterval(typerRef.current);
    setDisplayed(narrative);
    setTyping(false);
  };

  // ── Event popup ──
  const [showEventPopup, setShowEventPopup] = useState(false);
  const eventInfo = detectEvent(narrative);

  useEffect(() => {
    if (!isLoading && eventInfo.type) {
      const t = setTimeout(() => setShowEventPopup(true), 600);
      return () => clearTimeout(t);
    } else {
      setShowEventPopup(false);
    }
  }, [narrative, isLoading, eventInfo.type]);

  // Aspect ratio: adult scenes are 1:1 square, safe scenes are 2:1 landscape
  const sceneH = useSafeImage ? 200 : 280;

  return (
    <div style={{ position: "relative" }}>
      {/* ── 場景圖 ── */}
      <div style={{
        position: "relative", overflow: "hidden",
        background: fallbackBg,
        borderBottom: `1px solid ${accent}25`,
        height: sceneH,
        transition: "height 0.3s ease",
      }}>
        {/* Previous image stays visible during crossfade */}
        {prevSceneUrl && !sceneLoaded && !sceneError && (
          <img
            src={prevSceneUrl}
            alt=""
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", imageRendering: "pixelated", opacity: 0.5,
            }}
          />
        )}

        {/* Current image — hidden if error, fades in on load */}
        {sceneUrl && !sceneError && (
          <motion.img
            key={sceneUrl}
            src={sceneUrl}
            alt=""
            onLoad={handleImageLoad}
            onError={handleImageError}
            initial={{ opacity: 0 }}
            animate={{ opacity: sceneLoaded ? 1 : 0 }}
            transition={{ duration: 0.9 }}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover",
              imageRendering: useSafeImage ? "pixelated" : "auto",
            }}
          />
        )}

        {/* Loading dots — only when no prev image available */}
        {!sceneLoaded && !sceneError && !prevSceneUrl && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 12,
          }}>
            {isLoading ? (
              <>
                <div style={{ display: "flex", gap: 6 }}>
                  {[0, 1, 2].map(i => (
                    <motion.div key={i}
                      style={{ width: 8, height: 8, borderRadius: "50%", background: accent }}
                      animate={{ y: [0, -10, 0], opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.18 }}
                    />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: "rgba(148,163,184,0.4)", fontFamily: "monospace", letterSpacing: "0.1em" }}>
                  GENERATING...
                </span>
              </>
            ) : (
              <span style={{ fontSize: 11, color: "rgba(148,163,184,0.18)", fontFamily: "monospace" }}>
                SCENE LOADING...
              </span>
            )}
          </div>
        )}

        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "40%",
          background: "linear-gradient(to top, #0a0e1e, transparent)",
          pointerEvents: "none",
        }} />

        <CharacterSprite worldAttr={worldAttr} />

        {imagePrompt && sceneLoaded && (
          <div style={{
            position: "absolute", bottom: 8, left: 12, right: 12,
            fontSize: 9, color: "rgba(255,255,255,0.22)", fontFamily: "monospace",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            🎨 {imagePrompt.slice(0, 80)}
          </div>
        )}
      </div>

      {/* ── 奇遇事件彈窗 ── */}
      <AnimatePresence>
        {showEventPopup && eventInfo.type && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowEventPopup(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 40, backdropFilter: "blur(3px)" }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.82, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.82, y: 24 }}
              transition={{ type: "spring", damping: 22, stiffness: 300 }}
              style={{
                position: "fixed", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                width: "min(340px, 88vw)", zIndex: 50,
                background: "#090c1a",
                borderRadius: 18,
                padding: "28px 22px 22px",
                textAlign: "center",
              }}
            >
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.6 }}
                style={{
                  position: "absolute", inset: 0, borderRadius: 18,
                  border: "2px solid #fbbf24",
                  boxShadow: "0 0 20px #fbbf2450, inset 0 0 20px #fbbf2408",
                  pointerEvents: "none",
                }}
              />
              <div style={{ fontSize: 38, marginBottom: 10 }}>
                {eventInfo.type === "npc" ? "🌟" : "⚡"}
              </div>
              <div style={{ fontSize: 12, fontFamily: "monospace", letterSpacing: "0.2em", color: "#fbbf24", fontWeight: 700, marginBottom: 14, textTransform: "uppercase" }}>
                {eventInfo.label}
              </div>
              {eventInfo.detail && (
                <div style={{ fontSize: 13, color: "#fbbf24", fontWeight: 700, marginBottom: 10 }}>
                  「{eventInfo.detail}」
                </div>
              )}
              <div style={{ fontSize: 12, color: "rgba(203,213,225,0.75)", lineHeight: "1.75", maxHeight: 160, overflowY: "auto", textAlign: "left" }}>
                {narrative.replace(/【奇遇NPC[：:]?[^】]*】/g, "").replace(/【突發狀況[：:]?[^】]*】/g, "").trim().slice(0, 220)}
                {narrative.length > 220 ? "…" : ""}
              </div>
              <button
                onClick={() => setShowEventPopup(false)}
                style={{ marginTop: 18, padding: "8px 30px", borderRadius: 10, background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.4)", color: "#fbbf24", fontSize: 12, cursor: "pointer", fontFamily: "monospace" }}
              >
                繼續
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── 敘事文字（點擊跳過）── */}
      <div
        onClick={skipTypewriter}
        style={{ padding: "16px", background: "rgba(0,0,0,0.15)", borderBottom: "1px solid rgba(255,255,255,0.04)", minHeight: 140, cursor: typing ? "pointer" : "default" }}
      >
        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(148,163,184,0.4)", padding: "20px 0", fontFamily: "monospace", fontSize: 12, letterSpacing: "0.1em" }}>
            <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>▌</motion.span>
            故事展開中...
          </div>
        ) : (
          <div style={{ fontSize: 14, lineHeight: "1.9", color: "#d1d5db", whiteSpace: "pre-wrap", minHeight: 80 }}>
            {displayed || (
              <span style={{ color: "rgba(100,116,139,0.5)", fontFamily: "monospace", fontSize: 12, fontStyle: "italic" }}>
                選擇世界，踏出第一步…
              </span>
            )}
            {typing && (
              <>
                <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.5 }} style={{ color: accent, marginLeft: 1 }}>▌</motion.span>
                <span style={{ display: "block", marginTop: 6, fontSize: 10, color: "rgba(148,163,184,0.22)", fontFamily: "monospace" }}>點擊跳過 →</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
