"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send } from "lucide-react";
import { useGameStore } from "@/store/game-store";

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

function friendlyError(msg: string): string {
  if (msg.includes("Quota") || msg.includes("quota") || msg.includes("429"))
    return "AI 額度暫時用完，請稍等幾分鐘再試";
  if (msg.includes("API key") || msg.includes("401"))
    return "API Key 設定有誤";
  if (msg.includes("404") || msg.includes("not found") || msg.includes("available"))
    return "AI 模型暫時不可用，請稍後再試";
  return "發生錯誤，請稍後再試";
}

function parseChoice(text: string): { title: string; detail: string; risk: string } {
  const titleMatch = text.match(/^【(.{1,10})】(.*)$/);
  if (titleMatch) {
    const rest = titleMatch[2].trim();
    const pipeIdx = rest.lastIndexOf("| ⚠");
    if (pipeIdx !== -1) {
      return {
        title: titleMatch[1].trim(),
        detail: rest.slice(0, pipeIdx).trim(),
        risk: rest.slice(pipeIdx + 3).trim(),
      };
    }
    return { title: titleMatch[1].trim(), detail: rest, risk: "" };
  }
  // No 【】 bracket — check for pipe separator
  const pipeIdx = text.lastIndexOf("| ⚠");
  if (pipeIdx !== -1) {
    return { title: text.slice(0, pipeIdx).trim(), detail: "", risk: text.slice(pipeIdx + 3).trim() };
  }
  return { title: text, detail: "", risk: "" };
}

function ChoiceButton({ choice, index, accent, isLoading, isMobile, onChoose }: {
  choice: string; index: number; accent: string; isLoading: boolean; isMobile: boolean; onChoose: () => void;
}) {
  const { title, detail, risk } = parseChoice(choice);
  const hasTooltip = !!(detail || risk);
  const [showTooltip, setShowTooltip] = useState(false);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = () => {
    longPressRef.current = setTimeout(() => setShowTooltip(true), 500);
  };
  const handleTouchEnd = () => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
    setTimeout(() => setShowTooltip(false), 2000);
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Hover / long-press tooltip */}
      <AnimatePresence>
        {showTooltip && hasTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.14 }}
            style={{
              position: "absolute", bottom: "calc(100% + 10px)", left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(8,12,28,0.95)",
              border: `1px solid ${accent}45`,
              borderRadius: 10,
              padding: "9px 13px",
              fontSize: 11, color: "rgba(203,213,225,0.9)",
              whiteSpace: "normal",
              lineHeight: "1.6",
              zIndex: 30,
              pointerEvents: "none",
              backdropFilter: "blur(10px)",
              boxShadow: `0 6px 24px rgba(0,0,0,0.6), 0 0 14px ${accent}18`,
              minWidth: 140, maxWidth: 210,
              textAlign: "left",
            }}
          >
            {detail && (
              <>
                <div style={{
                  fontSize: 9, color: `${accent}90`, fontFamily: "monospace",
                  marginBottom: 4, letterSpacing: "0.12em", textTransform: "uppercase",
                }}>
                  行動詳情
                </div>
                <div>{detail}</div>
              </>
            )}
            {risk && (
              <div style={{
                marginTop: detail ? 7 : 0,
                paddingTop: detail ? 6 : 0,
                borderTop: detail ? "1px solid rgba(255,255,255,0.06)" : "none",
                fontSize: 10, color: "#fb923c",
                fontFamily: "monospace", letterSpacing: "0.04em",
              }}>
                ⚠ {risk}
              </div>
            )}
            {/* Down arrow */}
            <div style={{
              position: "absolute", bottom: -6, left: "50%",
              transform: "translateX(-50%) rotate(45deg)",
              width: 10, height: 10,
              background: "rgba(8,12,28,0.95)",
              borderRight: `1px solid ${accent}45`,
              borderBottom: `1px solid ${accent}45`,
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06 }}
        whileTap={{ scale: 0.95 }}
        onClick={onChoose}
        disabled={isLoading}
        onMouseEnter={() => hasTooltip && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          width: "100%",
          padding: isMobile ? "20px 8px" : "18px 10px",
          borderRadius: 12,
          border: `1px solid ${accent}35`,
          background: "rgba(255,255,255,0.04)",
          cursor: isLoading ? "not-allowed" : "pointer",
          opacity: isLoading ? 0.4 : 1,
          display: "flex", flexDirection: "column",
          alignItems: "center", gap: 6,
          textAlign: "center",
          transition: "background 0.15s, border-color 0.15s",
          minHeight: isMobile ? 72 : 0,
        }}
        onMouseOver={e => {
          if (!isLoading) {
            (e.currentTarget as HTMLButtonElement).style.background = `${accent}18`;
            (e.currentTarget as HTMLButtonElement).style.borderColor = `${accent}70`;
          }
        }}
        onMouseOut={e => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = `${accent}35`;
        }}
      >
        <span style={{
          fontSize: 15, color: accent, fontWeight: 700,
          fontFamily: "monospace", letterSpacing: "0.06em",
          lineHeight: "1.3", textAlign: "center",
        }}>
          {title}
        </span>
        {hasTooltip && (
          <span style={{ fontSize: 9, color: risk ? "rgba(251,146,60,0.45)" : "rgba(148,163,184,0.28)", fontFamily: "monospace", letterSpacing: "0.05em" }}>
            {risk ? "⚠ 風險" : "▲ 詳情"}
          </span>
        )}
      </motion.button>
    </div>
  );
}

export default function ChoicePanel({ accent }: { accent: string }) {
  const { choices, makeChoice, freeAction, isLoading, adventure, error } = useGameStore();
  const [freeText, setFreeText] = useState("");
  const [showFree, setShowFree] = useState(false);
  const isMobile = useIsMobile();

  if (!adventure) return null;
  const isDead = adventure.status === "dead";

  const handleFreeSubmit = () => {
    if (!freeText.trim()) return;
    freeAction(freeText.trim());
    setFreeText("");
    setShowFree(false);
  };

  return (
    <div style={{ padding: "14px 12px 20px" }}>
      {/* 分隔線 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, height: 1, background: `${accent}25` }} />
        <span style={{ fontSize: 9, color: `${accent}80`, fontFamily: "monospace", letterSpacing: "0.2em" }}>
          CHOOSE ACTION
        </span>
        <div style={{ flex: 1, height: 1, background: `${accent}25` }} />
      </div>

      {/* 錯誤訊息 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              marginBottom: 12, padding: "10px 14px", borderRadius: 10,
              border: "1px solid rgba(239,68,68,0.3)",
              background: "rgba(127,29,29,0.4)",
              fontSize: 12, color: "#fca5a5",
            }}
          >
            <div>⚠ {friendlyError(error)}</div>
            <div style={{ fontSize: 10, color: "rgba(252,165,165,0.4)", marginTop: 3, wordBreak: "break-all" }}>{error}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {isDead ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            padding: "28px 20px", textAlign: "center", borderRadius: 14,
            border: "1px solid rgba(239,68,68,0.3)",
            background: "rgba(60,10,10,0.6)",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 10 }}>⚰️</div>
          <p style={{ color: "#f87171", fontWeight: 700, fontSize: 16, margin: 0 }}>你死了</p>
          <p style={{ color: "rgba(148,163,184,0.5)", fontSize: 12, marginTop: 6, fontFamily: "monospace" }}>
            這一世的故事到此結束
          </p>
        </motion.div>
      ) : (
        <>
          {/* 選項按鈕 — 2×2 矩陣佈局（手機/桌面皆適用） */}
          <div style={{
            display: "grid",
            gridTemplateColumns: choices.length === 1 ? "1fr" : "1fr 1fr",
            gap: isMobile ? 6 : 8,
          }}>
            {choices.map((choice, i) => (
              <ChoiceButton
                key={`${i}-${choice.slice(0, 12)}`}
                choice={choice}
                index={i}
                accent={accent}
                isLoading={isLoading}
                isMobile={isMobile}
                onChoose={() => makeChoice(i)}
              />
            ))}
          </div>

          {/* 自由輸入 */}
          <div style={{ marginTop: 12 }}>
            <button
              onClick={() => setShowFree(!showFree)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 11, color: "rgba(148,163,184,0.35)",
                fontFamily: "monospace", letterSpacing: "0.08em",
                padding: "4px 0",
              }}
              onMouseOver={e => (e.currentTarget.style.color = "rgba(148,163,184,0.7)")}
              onMouseOut={e => (e.currentTarget.style.color = "rgba(148,163,184,0.35)")}
            >
              {showFree ? "▼ 收起" : "✏ 自由輸入行動"}
            </button>
            <AnimatePresence>
              {showFree && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: "hidden", marginTop: 8, display: "flex", gap: 8 }}
                >
                  <input
                    type="text"
                    value={freeText}
                    onChange={e => setFreeText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleFreeSubmit()}
                    placeholder="輸入你想做的事..."
                    style={{
                      flex: 1, padding: "10px 12px", borderRadius: 10, fontSize: 13,
                      background: "rgba(15,23,42,0.7)",
                      border: `1px solid ${accent}30`,
                      color: "#f1f5f9", outline: "none",
                    }}
                  />
                  <button
                    onClick={handleFreeSubmit}
                    disabled={isLoading || !freeText.trim()}
                    style={{
                      padding: "10px 14px", borderRadius: 10,
                      background: `${accent}30`,
                      border: `1px solid ${accent}50`,
                      color: "white", cursor: "pointer",
                      display: "flex", alignItems: "center",
                      opacity: isLoading || !freeText.trim() ? 0.4 : 1,
                    }}
                  >
                    <Send size={14} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
