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
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(full)}?width=800&height=400&nologo=true&seed=${seed}`;
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

  return (
    <div>
      {/* ── 場景圖 ── */}
      <div style={{
        position: "relative", aspectRatio: "2/1", overflow: "hidden",
        background: fallbackBg,
        borderBottom: `1px solid ${accent}25`,
      }}>
        {/* 生成圖片 */}
        {sceneUrl && (
          <motion.img
            key={sceneUrl}
            src={sceneUrl}
            alt=""
            onLoad={() => setSceneLoaded(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: sceneLoaded ? 1 : 0 }}
            transition={{ duration: 1 }}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}

        {/* 載入中 overlay */}
        {(!sceneLoaded || isLoading) && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 12,
          }}>
            {isLoading ? (
              <>
                <div style={{ display: "flex", gap: 6 }}>
                  {[0,1,2].map(i => (
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

        {/* 底部漸層遮罩 */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "40%",
          background: "linear-gradient(to top, #0a0e1e, transparent)",
          pointerEvents: "none",
        }} />

        {/* imagePrompt 標籤 */}
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
            fontSize: 14, lineHeight: "1.85",
            color: "#d1d5db",
            whiteSpace: "pre-wrap",
            fontFamily: "Georgia, 'Times New Roman', serif",
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
