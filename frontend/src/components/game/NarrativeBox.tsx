"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
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

// ── Image generation ─────────────────────────────────────────────────────────

function hashSeed(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) & 0x7fffffff;
  }
  return h % 99999;
}

function getSceneUrl(imagePrompt: string, useSafeImage: boolean, retry = 0): string {
  if (!imagePrompt) return "";
  // Add retry offset to seed so each retry hits a different cache slot
  const seed = (hashSeed(imagePrompt) + retry * 17) % 99999;
  if (useSafeImage) {
    // flux-schnell: ~2-3s vs ~6-8s for standard flux — big speed win
    const full = `Aesthetic Anime Style, 90s retro anime pixel art, high contrast, cel-shaded, ${imagePrompt}`;
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(full)}?width=256&height=256&nologo=true&seed=${seed}&model=flux-schnell`;
  } else {
    // Adult scenes: keep flux-anime for quality; 384×384 acceptable
    const full = `Aesthetic Anime Style, 90s retro anime illustration, adult content, mature, beautiful detailed, cel-shaded, ${imagePrompt}`;
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(full)}?width=384&height=384&nologo=true&seed=${seed}&model=flux-anime`;
  }
}

// ── Event detection ───────────────────────────────────────────────────────────

function detectEvent(text: string): { type: "npc" | "event" | null; label: string; detail: string } {
  const npcMatch = text.match(/【奇遇NPC[：:]([^】]+)】/);
  if (npcMatch) return { type: "npc", label: "✦ 奇遇 NPC", detail: npcMatch[1] };
  if (text.includes("【奇遇NPC】")) return { type: "npc", label: "✦ 奇遇 NPC", detail: "" };
  const eventMatch = text.match(/【突發狀況[：:]([^】]+)】/);
  if (eventMatch) return { type: "event", label: "⚡ 突發狀況", detail: eventMatch[1] };
  if (text.includes("【突發狀況】")) return { type: "event", label: "⚡ 突發狀況", detail: "" };
  return { type: null, label: "", detail: "" };
}

// ── Novel-style paragraph split (group 2 sentences per paragraph) ────────────

function splitIntoParagraphs(text: string): string[] {
  if (!text.trim()) return [];
  const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
  const result: string[] = [];

  for (const line of lines) {
    const sentPattern = /[^。！？…\n]+[。！？…]+/g;
    const sentences: string[] = [];
    let m: RegExpExecArray | null;
    let lastEnd = 0;

    while ((m = sentPattern.exec(line)) !== null) {
      sentences.push(m[0]);
      lastEnd = m.index + m[0].length;
    }
    const tail = line.slice(lastEnd).trim();
    if (tail) sentences.push(tail);

    if (sentences.length === 0) { result.push(line); continue; }

    // Group every 2 sentences into one paragraph
    for (let i = 0; i < sentences.length; i += 2) {
      const para = sentences.slice(i, i + 2).join("");
      if (para.trim()) result.push(para.trim());
    }
  }

  return result.length ? result : [text];
}

// ── Keyword highlighting ──────────────────────────────────────────────────────
// 【道具/地點】 → gold  |  NPC names → cyan

function HighlightedText({ text, npcNames }: { text: string; npcNames: string[] }) {
  const escapedNpcs = npcNames
    .filter(n => n.trim())
    .map(n => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  const patternStr = escapedNpcs.length > 0
    ? `(【[^】]*】|${escapedNpcs.join("|")})`
    : "(【[^】]*】)";
  const pattern = new RegExp(patternStr, "g");

  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(<span key={key++}>{text.slice(lastIdx, match.index)}</span>);
    }
    const matched = match[0];
    if (matched.startsWith("【")) {
      parts.push(
        <span key={key++} style={{ color: "#fbbf24", fontWeight: 600 }}>{matched}</span>
      );
    } else {
      // NPC name
      parts.push(
        <span key={key++} style={{ color: "#22d3ee", fontWeight: 500 }}>{matched}</span>
      );
    }
    lastIdx = match.index + matched.length;
  }
  if (lastIdx < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIdx)}</span>);
  }
  return <>{parts}</>;
}

// ── Formatted narrative (paragraphs + highlights) ─────────────────────────────

function FormattedNarrative({ text, npcNames }: { text: string; npcNames: string[] }) {
  // Strip event tags — they are handled by the popup
  const cleaned = text
    .replace(/【奇遇NPC[：:][^】]*】/g, "")
    .replace(/【突發狀況[：:][^】]*】/g, "")
    .trim();

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

// ── Character state badges (clothing / body) ──────────────────────────────────

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
  bleeding:     { icon: "🩸", label: "失血", color: "#dc2626" },
  fever:        { icon: "🌡️", label: "發燒", color: "#f97316" },
  starving:     { icon: "🫙", label: "飢餓", color: "#d97706" },
  possessed:    { icon: "👻", label: "附身", color: "#818cf8" },
  cursed:       { icon: "💀", label: "詛咒", color: "#6366f1" },
  drunk:        { icon: "🍶", label: "醉酒", color: "#a78bfa" },
  medicated:    { icon: "💊", label: "藥效中", color: "#34d399" },
  paralyzed:    { icon: "⚡", label: "麻痺", color: "#67e8f9" },
};

function CharacterSprite({ worldAttr }: { worldAttr: Record<string, unknown> }) {
  const clothing   = (worldAttr.clothing_state as string) ?? "normal";
  const bodyStatus = (worldAttr.body_status   as string) ?? "normal";
  const cBadge = CLOTHING_BADGES[clothing];
  const bBadge = BODY_BADGES[bodyStatus];
  if (!cBadge && !bBadge) return null;

  const badgeStyle = (color: string): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: 4,
    background: "rgba(0,0,0,0.72)", borderRadius: 20,
    padding: "3px 9px", border: `1px solid ${color}50`,
    backdropFilter: "blur(4px)",
  });

  return (
    <div style={{ position: "absolute", bottom: 48, right: 10, display: "flex", flexDirection: "column", gap: 4, zIndex: 5 }}>
      {bBadge && (
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} style={badgeStyle(bBadge.color)}>
          <span style={{ fontSize: 10 }}>{bBadge.icon}</span>
          <span style={{ fontSize: 9, color: bBadge.color, fontFamily: "monospace", letterSpacing: "0.05em" }}>{bBadge.label}</span>
        </motion.div>
      )}
      {cBadge && (
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.08 }} style={badgeStyle(cBadge.color)}>
          <span style={{ fontSize: 10 }}>{cBadge.icon}</span>
          <span style={{ fontSize: 9, color: cBadge.color, fontFamily: "monospace", letterSpacing: "0.05em" }}>{cBadge.label}</span>
        </motion.div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function NarrativeBox({ accent }: { accent: string }) {
  const { narrative, imagePrompt, useSafeImage, isLoading, isStreaming, adventure, npcs } = useGameStore();

  const worldAttr = adventure ? (adventure.world_attributes as Record<string, unknown>) : {};
  const worldKey  = (worldAttr?.world_flavor as string) ?? adventure?.world_type ?? "custom";
  const fallbackBg = WORLD_FALLBACK_BG[worldKey] ?? WORLD_FALLBACK_BG.custom;
  const npcNames  = npcs.map(n => n.name);

  // ── Scene image with crossfade + auto-retry ──────────────────────────────────
  const [sceneUrl, setSceneUrl] = useState("");
  const [prevSceneUrl, setPrevSceneUrl] = useState("");
  const [sceneLoaded, setSceneLoaded] = useState(false);
  const [sceneError, setSceneError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset retry when prompt changes (new scene)
  useEffect(() => {
    setRetryCount(0);
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
  }, [imagePrompt]);

  // Update URL whenever prompt or retry count changes
  useEffect(() => {
    if (!imagePrompt) return;
    const newUrl = getSceneUrl(imagePrompt, useSafeImage, retryCount);
    // On retry (retryCount > 0) always refresh; on first load skip if same URL
    if (newUrl === sceneUrl && retryCount === 0) return;
    if (retryCount === 0) {
      // New scene — crossfade from previous
      setPrevSceneUrl(sceneUrl);
    }
    // On retry, keep prevSceneUrl intact (don't flash)
    setSceneLoaded(false);
    setSceneError(false);
    setSceneUrl(newUrl);
  }, [imagePrompt, useSafeImage, retryCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImageLoad = useCallback(() => {
    setSceneLoaded(true);
    setPrevSceneUrl("");
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
  }, []);

  const handleImageError = useCallback(() => {
    setSceneLoaded(false);
    // Auto-retry up to 2 times with 2.5s delay
    setRetryCount(prev => {
      if (prev < 2) {
        retryTimerRef.current = setTimeout(() => {
          setSceneError(false);
          setRetryCount(r => r + 1);
        }, 2500);
        return prev; // don't change yet; the timer will increment
      }
      setSceneError(true); // give up after 2 retries
      return prev;
    });
  }, []);

  // ── Typewriter — only runs after streaming finishes (non-streaming load) ────
  const [displayed, setDisplayed] = useState("");
  const [typing, setTyping] = useState(false);
  const typerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const narrativeRef = useRef(narrative);
  narrativeRef.current = narrative;
  // Track the last narrative that the typewriter was started on
  const typedNarrativeRef = useRef("");

  useEffect(() => {
    if (isStreaming) {
      // During streaming: show text directly — streaming IS the typewriter
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
    // Skip typewriter if this narrative was already revealed via streaming
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

  // ── Encounter popup — only after tick 3 to avoid instant-popup on start ────
  const [showEventPopup, setShowEventPopup] = useState(false);
  const eventInfo    = detectEvent(narrative);
  const adventureTick = adventure?.tick ?? 0;

  useEffect(() => {
    if (!isLoading && eventInfo.type && adventureTick > 3) {
      const t = setTimeout(() => setShowEventPopup(true), 600);
      return () => clearTimeout(t);
    } else {
      setShowEventPopup(false);
    }
  }, [narrative, isLoading, eventInfo.type, adventureTick]);

  return (
    <div style={{ position: "relative" }}>

      {/* ── 場景圖 ── */}
      <div style={{
        position: "relative", overflow: "hidden",
        background: fallbackBg,
        borderBottom: `1px solid ${accent}25`,
        height: 240,
      }}>
        {/* Previous image fades during crossfade */}
        {prevSceneUrl && !sceneLoaded && !sceneError && (
          <img src={prevSceneUrl} alt="" style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center top", opacity: 0.45,
          }} />
        )}

        {/* Current image */}
        {sceneUrl && !sceneError && (
          <motion.img
            key={sceneUrl}
            src={sceneUrl}
            alt=""
            onLoad={handleImageLoad}
            onError={handleImageError}
            initial={{ opacity: 0 }}
            animate={{ opacity: sceneLoaded ? 1 : 0 }}
            transition={{ duration: 0.8 }}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "center top",
            }}
          />
        )}

        {/* Loading indicator */}
        {!sceneLoaded && !sceneError && !prevSceneUrl && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
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

        {/* Bottom fade */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "45%",
          background: "linear-gradient(to top, #0a0e1e, transparent)",
          pointerEvents: "none",
        }} />

        {/* Character state badges */}
        <CharacterSprite worldAttr={worldAttr} />

        {/* Image prompt label */}
        {imagePrompt && sceneLoaded && (
          <div style={{
            position: "absolute", bottom: 8, left: 12, right: 12,
            fontSize: 9, color: "rgba(255,255,255,0.18)", fontFamily: "monospace",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            🎨 {imagePrompt.slice(0, 80)}
          </div>
        )}
      </div>

      {/* ── 奇遇事件彈窗 — glass morphism, tick > 3 only ── */}
      <AnimatePresence>
        {showEventPopup && eventInfo.type && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowEventPopup(false)}
              style={{
                position: "fixed", inset: 0, zIndex: 40,
                background: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
              }}
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
                background: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
                borderRadius: 20,
                border: "2px solid rgba(251,191,36,0.5)",
                padding: "28px 22px 22px",
                textAlign: "center",
                boxShadow: "0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(251,191,36,0.08)",
              }}
            >
              {/* Animated border glow */}
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.8 }}
                style={{
                  position: "absolute", inset: 0, borderRadius: 20,
                  border: "2px solid rgba(251,191,36,0.4)",
                  boxShadow: "0 0 30px rgba(251,191,36,0.15), inset 0 0 30px rgba(251,191,36,0.03)",
                  pointerEvents: "none",
                }}
              />

              <div style={{ fontSize: 44, marginBottom: 8 }}>⭐</div>
              <div style={{
                fontSize: 12, fontFamily: "monospace", letterSpacing: "0.2em",
                color: "#fbbf24", fontWeight: 700, marginBottom: 14, textTransform: "uppercase",
              }}>
                {eventInfo.label}
              </div>
              {eventInfo.detail && (
                <div style={{ fontSize: 14, color: "#fde68a", fontWeight: 700, marginBottom: 12 }}>
                  「{eventInfo.detail}」
                </div>
              )}
              <div style={{
                fontSize: 12, color: "rgba(203,213,225,0.8)", lineHeight: "1.8",
                maxHeight: 130, overflowY: "auto", textAlign: "left",
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
                  marginTop: 18, padding: "9px 32px", borderRadius: 12,
                  background: "rgba(251,191,36,0.14)",
                  border: "1px solid rgba(251,191,36,0.5)",
                  color: "#fbbf24", fontSize: 12, cursor: "pointer",
                  fontFamily: "monospace", fontWeight: 600, letterSpacing: "0.06em",
                }}
              >
                繼續冒險
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── 敘事文字（點擊跳過）── */}
      <div
        onClick={isStreaming ? undefined : skipTypewriter}
        style={{
          padding: "18px 16px",
          background: "rgba(0,0,0,0.15)",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          minHeight: 140,
          cursor: typing && !isStreaming ? "pointer" : "default",
        }}
      >
        {isLoading ? (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            color: "rgba(148,163,184,0.4)", padding: "20px 0",
            fontFamily: "monospace", fontSize: 12, letterSpacing: "0.1em",
          }}>
            <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>▌</motion.span>
            故事展開中...
          </div>
        ) : displayed ? (
          <div style={{ minHeight: 80 }}>
            <FormattedNarrative text={displayed} npcNames={npcNames} />
            {(typing || isStreaming) && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                style={{ display: "inline-block", color: accent, fontSize: 14, marginLeft: 2 }}
              >▌</motion.span>
            )}
            {typing && !isStreaming && (
              <span style={{ marginLeft: 8, fontSize: 10, color: "rgba(148,163,184,0.22)", fontFamily: "monospace" }}>
                點擊跳過 →
              </span>
            )}
          </div>
        ) : (
          <span style={{
            color: "rgba(100,116,139,0.5)", fontFamily: "monospace",
            fontSize: 12, fontStyle: "italic",
          }}>
            選擇世界，踏出第一步…
          </span>
        )}
      </div>
    </div>
  );
}
