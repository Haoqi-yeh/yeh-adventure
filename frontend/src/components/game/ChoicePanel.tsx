"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send } from "lucide-react";
import { useGameStore } from "@/store/game-store";

function friendlyError(msg: string): string {
  if (msg.includes("Quota") || msg.includes("quota") || msg.includes("429"))
    return "AI 額度暫時用完，請稍等幾分鐘再試";
  if (msg.includes("API key") || msg.includes("401"))
    return "API Key 設定有誤";
  if (msg.includes("404") || msg.includes("not found") || msg.includes("available"))
    return "AI 模型暫時不可用，請稍後再試";
  return "發生錯誤，請稍後再試";
}

// Pick a contextual pixel icon for each choice slot
const SLOT_ICONS = ["⚔️", "🏃", "💬", "🔍", "🛡️", "✨", "🎲", "👁️"];

export default function ChoicePanel({ accent }: { accent: string }) {
  const { choices, makeChoice, freeAction, isLoading, adventure, error } = useGameStore();
  const [freeText, setFreeText] = useState("");
  const [showFree, setShowFree] = useState(false);

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
      <div style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
      }}>
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
          {/* 選項按鈕 — 2 欄 grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: choices.length === 1 ? "1fr" : "1fr 1fr",
            gap: 8,
          }}>
            {choices.map((choice, i) => (
              <motion.button
                key={`${i}-${choice.slice(0, 12)}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => makeChoice(i)}
                disabled={isLoading}
                style={{
                  padding: "12px 10px",
                  borderRadius: 12,
                  border: `1px solid ${accent}35`,
                  background: "rgba(255,255,255,0.04)",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.4 : 1,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 6,
                  textAlign: "center",
                  transition: "background 0.15s, border-color 0.15s, transform 0.1s",
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
                <span style={{ fontSize: 22 }}>{SLOT_ICONS[i % SLOT_ICONS.length]}</span>
                <span style={{
                  fontSize: 12, color: "#e2e8f0", lineHeight: "1.4",
                  display: "-webkit-box", WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>
                  {choice}
                </span>
              </motion.button>
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
