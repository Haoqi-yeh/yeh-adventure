"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/game-store";

const WORLD_BG: Record<string, string> = {
  xian_xia:        "linear-gradient(180deg, #1a0a4a 0%, #0a0520 100%)",
  campus:          "linear-gradient(180deg, #2a0a1a 0%, #150510 100%)",
  apocalypse:      "linear-gradient(180deg, #2a0800 0%, #150400 100%)",
  adult:           "linear-gradient(180deg, #001a3a 0%, #000a20 100%)",
  wuxia:           "linear-gradient(180deg, #2a0505 0%, #150202 100%)",
  western_fantasy: "linear-gradient(180deg, #062a16 0%, #021508 100%)",
  cyberpunk:       "linear-gradient(180deg, #002030 0%, #001018 100%)",
  horror:          "linear-gradient(180deg, #0a1205 0%, #050900 100%)",
  palace_intrigue: "linear-gradient(180deg, #2a1200 0%, #150900 100%)",
  wasteland:       "linear-gradient(180deg, #2a1800 0%, #150c00 100%)",
  custom:          "linear-gradient(180deg, #1a0a4a 0%, #0a0520 100%)",
};

const WORLD_EMOJI: Record<string, string> = {
  xian_xia: "⚔️", campus: "🏫", apocalypse: "☣️", adult: "🌃",
  wuxia: "🏮", western_fantasy: "🧙", cyberpunk: "🤖",
  horror: "👻", palace_intrigue: "👑", wasteland: "🏜️", custom: "✨",
};

function getSceneUrl(imagePrompt: string, seed: number) {
  if (!imagePrompt) return "";
  const prompt = encodeURIComponent(`${imagePrompt}, pixel art style, 16-bit retro game, vivid colors, detailed`);
  return `https://image.pollinations.ai/prompt/${prompt}?width=800&height=400&nologo=true&seed=${seed}`;
}

export default function NarrativeBox() {
  const { narrative, imagePrompt, isLoading, adventure } = useGameStore();
  const [sceneUrl, setSceneUrl] = useState("");
  const [sceneLoaded, setSceneLoaded] = useState(false);
  const [sceneSeed] = useState(() => Math.floor(Math.random() * 99999));

  const worldAttr = adventure ? (adventure.world_attributes as Record<string, unknown>) : {};
  const worldKey = (worldAttr?.world_flavor as string) ?? adventure?.world_type ?? "custom";
  const bg = WORLD_BG[worldKey] ?? WORLD_BG.custom;
  const emoji = WORLD_EMOJI[worldKey] ?? "✨";

  // Generate scene image when imagePrompt changes
  useEffect(() => {
    if (!imagePrompt) return;
    setSceneLoaded(false);
    setSceneUrl(getSceneUrl(imagePrompt, sceneSeed));
  }, [imagePrompt, sceneSeed]);

  return (
    <div>
      {/* 場景圖區 */}
      <div style={{
        position: "relative", height: 180,
        background: bg, overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {/* 生成的場景圖 */}
        {sceneUrl && (
          <motion.img
            key={sceneUrl}
            src={sceneUrl}
            alt="scene"
            onLoad={() => setSceneLoaded(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: sceneLoaded ? 1 : 0 }}
            transition={{ duration: 0.8 }}
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "cover",
            }}
          />
        )}

        {/* 場景未載入時的 emoji 佔位 */}
        {!sceneLoaded && (
          <div style={{ position: "relative", textAlign: "center" }}>
            {isLoading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 40 }} className="animate-pulse">{emoji}</span>
                <div style={{ display: "flex", gap: 5 }}>
                  {[0,1,2].map(i => (
                    <motion.span key={i}
                      style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.4)", display: "block" }}
                      animate={{ y: [0, -7, 0] }}
                      transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <span style={{ fontSize: 48 }}>{emoji}</span>
            )}
          </div>
        )}

        {/* 底部遮罩 */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 60,
          background: "linear-gradient(to top, #080c1a, transparent)",
          pointerEvents: "none",
        }} />
      </div>

      {/* 敘事文字 */}
      <div style={{ padding: "16px", minHeight: 160 }}>
        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(148,163,184,0.5)", paddingTop: 16 }}>
            <span style={{ fontSize: 13 }}>故事展開中...</span>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={narrative?.slice(0, 30) ?? "empty"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                fontSize: 14, lineHeight: "1.8",
                color: "#e2e8f0",
                whiteSpace: "pre-wrap",
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              {narrative || (
                <span style={{ color: "rgba(100,116,139,0.6)", fontStyle: "italic", fontFamily: "sans-serif" }}>
                  故事即將開始…
                </span>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
