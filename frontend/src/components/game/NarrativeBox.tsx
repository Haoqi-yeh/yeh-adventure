"use client";
import { useState, useEffect, useRef } from "react";
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

function getSceneUrl(imagePrompt: string, seed: number) {
  if (!imagePrompt) return "";
  const full = `16-bit pixel art style, retro gaming aesthetic, vibrant colors, ${imagePrompt}`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(full)}?width=512&height=256&nologo=true&seed=${seed}`;
}

function detectEvent(text: string): { type: "npc" | "event" | null; label: string; detail: string } {
  // Match 【奇遇NPC：名字】 or plain 【奇遇NPC】
  const npcMatch = text.match(/【奇遇NPC[：:]([^】]+)】/);
  if (npcMatch) return { type: "npc", label: "✦ 奇遇 NPC", detail: npcMatch[1] };
  if (text.includes("【奇遇NPC】")) return { type: "npc", label: "✦ 奇遇 NPC", detail: "" };

  // Match 【突發狀況：摘要】 or plain 【突發狀況】
  const eventMatch = text.match(/【突發狀況[：:]([^】]+)】/);
  if (eventMatch) return { type: "event", label: "⚡ 突發狀況", detail: eventMatch[1] };
  if (text.includes("【突發狀況】")) return { type: "event", label: "⚡ 突發狀況", detail: "" };

  return { type: null, label: "", detail: "" };
}

export default function NarrativeBox({ accent }: { accent: string }) {
  const { narrative, imagePrompt, isLoading, adventure } = useGameStore();

  const worldAttr = adventure ? (adventure.world_attributes as Record<string, unknown>) : {};
  const worldKey = (worldAttr?.world_flavor as string) ?? adventure?.world_type ?? "custom";
  const fallbackBg = WORLD_FALLBACK_BG[worldKey] ?? WORLD_FALLBACK_BG.custom;

  // Scene image
  const [sceneUrl, setSceneUrl] = useState("");
  const [sceneLoaded, setSceneLoaded] = useState(false);
  const seedRef = useRef(Math.floor(Math.random() * 99999));

  useEffect(() => {
    if (!imagePrompt) return;
    setSceneLoaded(false);
    seedRef.current = Math.floor(Math.random() * 99999);
    setSceneUrl(getSceneUrl(imagePrompt, seedRef.current));
  }, [imagePrompt]);

  // Typewriter effect
  const [displayed, setDisplayed] = useState("");
  const [typing, setTyping] = useState(false);
  const typerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!narrative || isLoading) { setDisplayed(""); return; }
    setDisplayed("");
    setTyping(true);
    let i = 0;
    if (typerRef.current) clearInterval(typerRef.current);
    typerRef.current = setInterval(() => {
      i++;
      setDisplayed(narrative.slice(0, i));
      if (i >= narrative.length) {
        clearInterval(typerRef.current!);
        setTyping(false);
      }
    }, 22);
    return () => { if (typerRef.current) clearInterval(typerRef.current); };
  }, [narrative, isLoading]);

  // Event popup
  const [showEventPopup, setShowEventPopup] = useState(false);
  const eventInfo = detectEvent(narrative);

  useEffect(() => {
    if (!isLoading && eventInfo.type) {
      const t = setTimeout(() => setShowEventPopup(true), 500);
      return () => clearTimeout(t);
    } else {
      setShowEventPopup(false);
    }
  }, [narrative, isLoading, eventInfo.type]);

  return (
    <div style={{ position: "relative" }}>
      {/* ── 場景圖 ── */}
      <div style={{
        position: "relative", overflow: "hidden",
        background: fallbackBg,
        borderBottom: `1px solid ${accent}25`,
        height: 200,
      }}>
        {sceneUrl && (
          <motion.img
            key={sceneUrl}
            src={sceneUrl}
            alt=""
            onLoad={() => setSceneLoaded(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: sceneLoaded ? 1 : 0 }}
            transition={{ duration: 1 }}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover",
              imageRendering: "pixelated",
            }}
          />
        )}

        {(!sceneLoaded || isLoading) && (
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
              <span style={{ fontSize: 11, color: "rgba(148,163,184,0.2)", fontFamily: "monospace", letterSpacing: "0.12em" }}>
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

        {imagePrompt && sceneLoaded && (
          <div style={{
            position: "absolute", bottom: 8, left: 12, right: 12,
            fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: "monospace",
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
              {/* Gold flashing border */}
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
              <div style={{
                fontSize: 12, fontFamily: "monospace", letterSpacing: "0.2em",
                color: "#fbbf24", fontWeight: 700, marginBottom: 14,
                textTransform: "uppercase",
              }}>
                {eventInfo.label}
              </div>
              {eventInfo.detail && (
                <div style={{
                  fontSize: 13, color: "#fbbf24", fontWeight: 700,
                  marginBottom: 10, letterSpacing: "0.05em",
                }}>
                  「{eventInfo.detail}」
                </div>
              )}
              <div style={{
                fontSize: 12, color: "rgba(203,213,225,0.75)", lineHeight: "1.75",
                maxHeight: 160, overflowY: "auto",
                textAlign: "left",
              }}>
                {narrative
                  .replace(/【奇遇NPC[：:]?[^】]*】/g, "")
                  .replace(/【突發狀況[：:]?[^】]*】/g, "")
                  .trim()
                  .slice(0, 220)}
                {narrative.length > 220 ? "…" : ""}
              </div>
              <button
                onClick={() => setShowEventPopup(false)}
                style={{
                  marginTop: 18, padding: "8px 30px", borderRadius: 10,
                  background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.4)",
                  color: "#fbbf24", fontSize: 12, cursor: "pointer",
                  fontFamily: "monospace", letterSpacing: "0.12em",
                }}
              >
                繼續
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── 敘事文字 ── */}
      <div style={{
        padding: "16px",
        background: "rgba(0,0,0,0.15)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        minHeight: 140,
      }}>
        {isLoading ? (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            color: "rgba(148,163,184,0.4)", padding: "20px 0",
            fontFamily: "monospace", fontSize: 12, letterSpacing: "0.1em",
          }}>
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
            >▌</motion.span>
            故事展開中...
          </div>
        ) : (
          <div style={{
            fontSize: 14, lineHeight: "1.9",
            color: "#d1d5db",
            whiteSpace: "pre-wrap",
            minHeight: 80,
          }}>
            {displayed || (
              <span style={{ color: "rgba(100,116,139,0.5)", fontFamily: "monospace", fontSize: 12, fontStyle: "italic" }}>
                選擇世界，踏出第一步…
              </span>
            )}
            {typing && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                style={{ color: accent, marginLeft: 1 }}
              >▌</motion.span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
