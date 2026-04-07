"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/game-store";

function friendlyError(msg: string): string {
  if (msg.includes("Quota") || msg.includes("quota") || msg.includes("429"))
    return "AI 額度暫時用完，請稍等幾分鐘再試";
  if (msg.includes("API key") || msg.includes("401"))
    return "API Key 設定有誤";
  return "發生錯誤，請稍後再試";
}

const ICONS = ["▶", "◆", "●", "★"];

export default function ChoicePanel() {
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
    <div className="space-y-3">
      {/* 行動後錯誤提示 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass rounded-xl px-4 py-3 border border-red-500/40 text-red-300 text-xs font-pixel"
          >
            ⚠ {friendlyError(error)}
          </motion.div>
        )}
      </AnimatePresence>

      {isDead ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl p-6 text-center space-y-2 border border-red-900/40"
        >
          <div className="text-3xl">⚰️</div>
          <p className="text-red-400 font-bold font-pixel">你死了</p>
          <p className="text-white/40 text-xs font-pixel">這一世的故事結束了</p>
        </motion.div>
      ) : (
        <>
          <div className="space-y-2">
            {choices.map((choice, i) => (
              <motion.button
                key={`${i}-${choice}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ x: 6 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => makeChoice(i)}
                disabled={isLoading}
                className="w-full text-left px-4 py-3 rounded-xl
                  glass border border-white/5
                  hover:border-purple-500/50 hover:bg-purple-900/20
                  disabled:opacity-30 disabled:cursor-not-allowed
                  transition-all duration-150 group"
              >
                <span className="text-purple-500 mr-2 font-pixel text-xs
                  group-hover:text-purple-300 transition-colors">
                  {ICONS[i % ICONS.length]}
                </span>
                <span className="text-white/80 text-sm group-hover:text-white transition-colors">
                  {choice}
                </span>
              </motion.button>
            ))}
          </div>

          {/* 自由輸入 */}
          <div>
            <button
              onClick={() => setShowFree(!showFree)}
              className="text-[11px] text-white/20 hover:text-white/50 font-pixel transition-colors"
            >
              {showFree ? "▼ 收起" : "▷ 自由輸入行動"}
            </button>
            <AnimatePresence>
              {showFree && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 flex gap-2 overflow-hidden"
                >
                  <input
                    type="text"
                    value={freeText}
                    onChange={(e) => setFreeText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleFreeSubmit()}
                    placeholder="輸入你想做的事..."
                    className="flex-1 glass rounded-xl px-3 py-2 text-sm text-white/80
                      placeholder-white/20 focus:outline-none focus:border-purple-500/50
                      font-pixel border border-white/5"
                  />
                  <button
                    onClick={handleFreeSubmit}
                    disabled={isLoading || !freeText.trim()}
                    className="px-4 py-2 bg-purple-700/60 hover:bg-purple-600/60
                      border border-purple-500/30 text-white rounded-xl text-xs
                      font-pixel disabled:opacity-30 transition-colors"
                  >
                    執行
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
