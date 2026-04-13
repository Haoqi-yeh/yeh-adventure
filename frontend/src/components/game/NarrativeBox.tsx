"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import { WORLD_IMAGE_STYLE } from "@/lib/game/prompt";

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
  taiwanese_folk:  "linear-gradient(160deg,#2a0a00,#120300)",
  custom:          "linear-gradient(160deg,#1a0845,#050220)",
};

// ── Image generation ─────────────────────────────────────────────────────────

function hashSeed(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) & 0x7fffffff;
  }
  return h % 99999;
}

function getSceneUrl(imagePrompt: string, worldKey: string, retry = 0): string {
  if (!imagePrompt) return "";
  const seed = (hashSeed(imagePrompt + worldKey) + retry * 17) % 99999;
  const worldStyle = WORLD_IMAGE_STYLE[worldKey] ?? WORLD_IMAGE_STYLE.custom;
  const full = `pixel art, 8-bit retro RPG scene, 16-bit JRPG background, vibrant saturated colors, hard pixel edges, crisp pixel grid, zero blur, ${worldStyle}, ${imagePrompt}`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(full)}?width=480&height=240&nologo=true&seed=${seed}&model=flux-schnell`;
}

// ── Event detection ───────────────────────────────────────────────────────────

function detectEvent(text: string): { type: "npc" | "event" | null; label: string; detail: string } {
  const npcMatch = text.match(/【奇遇NPC[：:]([^】]+)】/);
  if (npcMatch) return { type: "npc", label: "✦ 奇遇 NPC", detail: npcMatch[1] };
  const eventMatch = text.match(/【突發狀況[：:]([^】]+)】/);
  if (eventMatch) return { type: "event", label: "⚡ 突發狀況", detail: eventMatch[1] };
  return { type: null, label: "", detail: "" };
}

// ── Novel-style paragraph split ──────────────────────────────────────────────

function splitIntoParagraphs(text: string): string[] {
  if (!text.trim()) return [];
  const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
  const result: string[] = [];
  for (const line of lines) {
    const sentPattern = /[^。！？…\n]+[。！？…]+/g;
    const sentences: string[] = [];
    let m;
    let lastEnd = 0;
    while ((m = sentPattern.exec(line)) !== null) {
      sentences.push(m[0]);
      lastEnd = m.index + m[0].length;
    }
    const tail = line.slice(lastEnd).trim();
    if (tail) sentences.push(tail);
    for (let i = 0; i < sentences.length; i += 2) {
      const para = sentences.slice(i, i + 2).join("");
      if (para.trim()) result.push(para.trim());
    }
  }
  return result.length ? result : [text];
}

// ── Keyword highlighting ──────────────────────────────────────────────────────

function HighlightedText({ text, npcNames }: { text: string; npcNames: string[] }) {
  const escapedNpcs = npcNames
    .filter(n => n.trim())
    .map(n => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const patternStr = escapedNpcs.length > 0 ? `(【[^】]*】|${escapedNpcs.join("|")})` : "(【[^】]*】)";
  const pattern = new RegExp(patternStr, "g");
  const parts: React.ReactNode[] = [];
  let lastIdx = 0, match, key = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIdx) parts.push(<span key={key++}>{text.slice(lastIdx, match.index)}</span>);
    const matched = match[0];
    const style = matched.startsWith("【") ? { color: "#fbbf24", fontWeight: 600 } : { color: "#22d3ee", fontWeight: 500 };
    parts.push(<span key={key++} style={style}>{matched}</span>);
    lastIdx = match.index + matched.length;
  }
  if (lastIdx < text.length) parts.push(<span key={key++}>{text.slice(lastIdx)}</span>);
  return <>{parts}</>;
}

function FormattedNarrative({ text, npcNames }: { text: string; npcNames: string[] }) {
  const cleaned = text.replace(/【奇遇NPC[：:][^】]*】/g, "").replace(/【突發狀況[：:][^】]*】/g, "").trim();
  if (!cleaned) return null;
  const paragraphs = splitIntoParagraphs(cleaned);
  return (
    <div style={{ fontSize: 14, lineHeight: "1.95", color: "#d1d5db" }}>
      {paragraphs.map((para, pIdx) => (
        <p key={pIdx} style={{ margin: 0, marginBottom: pIdx < paragraphs.length - 1 ? "0.85em" : 0 }}>
          <HighlightedText text={para} npcNames={npcNames} />
        </p>
      ))}
    </div>
  );
}

// ── Character state badges ──────────────────────────────────────────────────

const CLOTHING_BADGES: Record<string, { icon: string; label: string; color: string }> = {
  disheveled: { icon: "👕", label: "衣衫凌亂", color: "#f59e0b" },
  partial:    { icon: "🔴", label: "衣物散亂", color: "#f87171" },
  minimal:    { icon: "🔴", label: "衣不蔽體", color: "#ef4444" },
  bare:       { icon: "⭕", label: "赤裸",     color: "#dc2626" },
};
const BODY_BADGES: Record<string, { icon: string; label: string; color: string }> = {
  flushed:      { icon: "😳", label: "臉紅", color: "#f472b6" },
  sweaty:       { icon: "💦", label: "汗濕", color: "#60a5fa" },
  injured:      { icon: "🩸", label: "受傷", color: "#ef4444" },
  exhausted:    { icon: "😮‍💨", label: "疲憊", color: "#94a3b8" },
  aroused:      { icon: "🔥", label: "亢奮", color: "#fb923c" },
  poisoned:     { icon: "🐍", label: "中毒", color: "#4ade80" },
  inner_injured:{ icon: "💔", label: "內傷", color: "#c084fc" },
};

function CharacterSprite({ worldAttr }: { worldAttr: Record<string, unknown> }) {
  const clothing = (worldAttr.clothing_state as string) ?? "normal";
  const bodyStatus = (worldAttr.body_status as string) ?? "normal";
  const cBadge = CLOTHING_BADGES[clothing], bBadge = BODY_BADGES[bodyStatus];
  if (!cBadge && !bBadge) return null;
  const badgeStyle = (color: string): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: 4, background: "rgba(0,0,0,0.72)",
    borderRadius: 20, padding: "3px 9px", border: `1px solid ${color}50`, backdropFilter: "blur(4px)",
  });
  return (
    <div style={{ position: "absolute", bottom: 48, right: 10, display: "flex", flexDirection: "column", gap: 4, zIndex: 10 }}>
      {bBadge && <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} style={badgeStyle(bBadge.color)}><span style={{ fontSize: 10 }}>{bBadge.icon}</span><span style={{ fontSize: 9, color: bBadge.color }}>{bBadge.label}</span></motion.div>}
      {cBadge && <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} style={badgeStyle(cBadge.color)}><span style={{ fontSize: 10 }}>{cBadge.icon}</span><span style={{ fontSize: 9, color: cBadge.color }}>{cBadge.label}</span></motion.div>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function NarrativeBox({ accent }: { accent: string }) {
  const { narrative, imagePrompt, isLoading, isStreaming, adventure, npcs } = useGameStore();
  const worldAttr = adventure ? (adventure.world_attributes as Record<string, unknown>) : {};
  const worldKey = (worldAttr?.world_flavor as string) ?? adventure?.world_type ?? "custom";
  const fallbackBg = WORLD_FALLBACK_BG[worldKey] ?? WORLD_FALLBACK_BG.custom;
  const npcNames = npcs.map(n => n.name);

  const [sceneUrl, setSceneUrl] = useState("");
  const [prevSceneUrl, setPrevSceneUrl] = useState("");
  const [sceneLoaded, setSceneLoaded] = useState(false);
  const [sceneError, setSceneError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setRetryCount(0);
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
  }, [imagePrompt]);

  useEffect(() => {
    if (!imagePrompt) return;
    const newUrl = getSceneUrl(imagePrompt, worldKey, retryCount);
    if (newUrl === sceneUrl && retryCount === 0) return;
    if (retryCount === 0) setPrevSceneUrl(sceneUrl);
    setSceneLoaded(false);
    setSceneError(false);
    setSceneUrl(newUrl);
  }, [imagePrompt, retryCount]);

  const handleImageLoad = useCallback(() => {
    setSceneLoaded(true);
    setPrevSceneUrl("");
  }, []);

  const handleImageError = useCallback(() => {
    setSceneLoaded(false);
    setRetryCount(prev => {
      if (prev < 2) {
        retryTimerRef.current = setTimeout(() => setRetryCount(r => r + 1), 2500);
      } else {
        setSceneError(true);
      }
      return prev;
    });
  }, []);

  const [displayed, setDisplayed] = useState("");
  const [typing, setTyping] = useState(false);
  const typerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const narrativeRef = useRef(narrative);
  narrativeRef.current = narrative;
  const typedNarrativeRef = useRef("");

  useEffect(() => {
    if (isStreaming) {
      if (typerRef.current) clearInterval(typerRef.current);
      setTyping(false);
      setDisplayed(narrative);
      typedNarrativeRef.current = narrative;
      return;
    }
    if (!narrative || isLoading) {
      setDisplayed("");
      setTyping(false);
      return;
    }
    if (typedNarrativeRef.current === narrative) return;
    typedNarrativeRef.current = narrative;
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
  }, [narrative, isLoading, isStreaming]);

  const skipTypewriter = () => {
    if (!typing) return;
    if (typerRef.current) clearInterval(typerRef.current);
    setDisplayed(narrative);
    setTyping(false);
  };

  const [showEventPopup, setShowEventPopup] = useState(false);
  const eventInfo = detectEvent(narrative);
  useEffect(() => {
    if (!isLoading && eventInfo.type && (adventure?.tick ?? 0) > 3) {
      const t = setTimeout(() => setShowEventPopup(true), 600);
      return () => clearTimeout(t);
    } else setShowEventPopup(false);
  }, [narrative, isLoading, eventInfo.type, adventure?.tick]);

  return (
    <div style={{ position: "relative" }}>
      {/* ── 場景圖：穩定容器 ── */}
      <div style={{
        position: "relative", overflow: "hidden", background: fallbackBg,
        borderBottom: `1px solid ${accent}25`, height: 240, width: "100%"
      }}>
        <AnimatePresence mode="popLayout">
          {prevSceneUrl && (
            <img key="prev" src={prevSceneUrl} alt="" style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "center top", opacity: 0.3, filter: "blur(2px)"
            }} />
          )}
          {sceneUrl && !sceneError && (
            <motion.img
              key={sceneUrl}
              src={sceneUrl}
              onLoad={handleImageLoad}
              onError={handleImageError}
              initial={{ opacity: 0 }}
              animate={{ opacity: sceneLoaded ? 1 : 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              style={{
                position: "absolute", inset: 0, width: "100%", height: "100%",
                objectFit: "cover", objectPosition: "center top", zIndex: 2
              }}
            />
          )}
        </AnimatePresence>

        {!sceneLoaded && !sceneError && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 12, zIndex: 3, background: "rgba(0,0,0,0.2)"
          }}>
            <div style={{ display: "flex", gap: 6 }}>
              {[0, 1, 2].map(i => (
                <motion.div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: accent }}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} />
              ))}
            </div>
            <span style={{ fontSize: 10, color: accent, opacity: 0.6, fontFamily: "monospace", letterSpacing: "0.2em" }}>
              RENDERING WORLD...
            </span>
          </div>
        )}

        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "60%",
          background: "linear-gradient(to top, #050a15 0%, transparent 100%)", zIndex: 4, pointerEvents: "none"
        }} />
        <CharacterSprite worldAttr={worldAttr} />
        {imagePrompt && (
          <div style={{
            position: "absolute", bottom: 10, left: 16, zIndex: 6, fontSize: 9,
            color: "rgba(255,255,255,0.2)", fontFamily: "monospace"
          }}>
            <span style={{ color: accent }}>◈</span> {imagePrompt.slice(0, 50)}...
          </div>
        )}
      </div>

      <AnimatePresence>
        {showEventPopup && eventInfo.type && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowEventPopup(false)}
              style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }} />
            <motion.div initial={{ opacity: 0, scale: 0.82, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.82, y: 24 }}
              style={{
                position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                width: "min(340px, 88vw)", zIndex: 50, background: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(24px)", borderRadius: 20, border: "2px solid rgba(251,191,36,0.5)",
                padding: "28px 22px 22px", textAlign: "center"
              }}>
              <div style={{ fontSize: 44, marginBottom: 8 }}>⭐</div>
              <div style={{ fontSize: 12, color: "#fbbf24", fontWeight: 700, marginBottom: 14 }}>{eventInfo.label}</div>
              {eventInfo.detail && <div style={{ fontSize: 14, color: "#fde68a", fontWeight: 700, marginBottom: 12 }}>「{eventInfo.detail}」</div>}
              <button onClick={() => setShowEventPopup(false)} style={{
                marginTop: 18, padding: "9px 32px", borderRadius: 12, background: "rgba(251,191,36,0.14)",
                border: "1px solid rgba(251,191,36,0.5)", color: "#fbbf24", fontSize: 12, fontWeight: 600
              }}>繼續冒險</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div onClick={isStreaming ? undefined : skipTypewriter} style={{
        padding: "18px 16px", background: "rgba(0,0,0,0.15)", borderBottom: "1px solid rgba(255,255,255,0.04)",
        minHeight: 140, cursor: typing && !isStreaming ? "pointer" : "default"
      }}>
        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(148,163,184,0.4)", fontSize: 12 }}>
            <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>▌</motion.span>
            故事展開中...
          </div>
        ) : displayed ? (
          <div style={{ minHeight: 80 }}>
            <FormattedNarrative text={displayed} npcNames={npcNames} />
            {(typing || isStreaming) && <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}
              style={{ display: "inline-block", color: accent, fontSize: 14, marginLeft: 2 }}>▌</motion.span>}
          </div>
        ) : (
          <span style={{ color: "rgba(100,116,139,0.5)", fontSize: 12, fontStyle: "italic" }}>選擇世界，踏出第一步…</span>
        )}
      </div>
    </div>
  );
}
