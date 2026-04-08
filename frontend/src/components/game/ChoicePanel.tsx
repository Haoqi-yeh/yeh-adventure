"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Send } from "lucide-react";
import { useGameStore } from "@/store/game-store";

function friendlyError(msg: string): string {
  if (msg.includes("Quota") || msg.includes("quota") || msg.includes("429"))
    return "AI 額度暫時用完，請稍等幾分鐘再試";
  if (msg.includes("API key") || msg.includes("401"))
    return "API Key 設定有誤";
  if (msg.includes("404") || msg.includes("not found") || msg.includes("available"))
    return "AI 模型不可用，請稍後再試";
  return "發生錯誤，請稍後再試";
}

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
      {/* 分隔線 */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/8" />
        <span className="text-[10px] text-slate-600 tracking-widest uppercase">Choose Action</span>
        <div className="flex-1 h-px bg-white/8" />
      </div>

      {/* 錯誤訊息 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl px-4 py-3 border border-red-500/30 bg-red-950/40 text-red-300 text-sm"
          >
            ⚠ {friendlyError(error)}
            <div className="text-red-600/50 text-xs mt-0.5 break-all">{error}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {isDead ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl p-6 text-center space-y-3 border border-red-900/40 bg-red-950/20"
        >
          <div className="text-4xl">⚰️</div>
          <p className="text-red-400 font-bold">你死了</p>
          <p className="text-slate-500 text-xs">這一世的故事到此結束</p>
        </motion.div>
      ) : (
        <>
          {/* 選項按鈕 */}
          <div className="space-y-2">
            {choices.map((choice, i) => (
              <motion.button
                key={`${i}-${choice.slice(0, 10)}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => makeChoice(i)}
                disabled={isLoading}
                className="w-full text-left px-4 py-3.5 rounded-xl
                  bg-slate-800/50 border border-slate-700/50
                  hover:bg-slate-700/60 hover:border-purple-500/40
                  disabled:opacity-30 disabled:cursor-not-allowed
                  transition-all duration-150 group flex items-center gap-3"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-md bg-purple-900/60 border border-purple-700/40
                                 flex items-center justify-center text-[10px] text-purple-300 font-bold">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-slate-200 group-hover:text-white transition-colors leading-snug">
                  {choice}
                </span>
                <ChevronRight size={14} className="flex-shrink-0 text-slate-600 group-hover:text-purple-400 transition-colors" />
              </motion.button>
            ))}
          </div>

          {/* 自由輸入 */}
          <div>
            <button
              onClick={() => setShowFree(!showFree)}
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors py-1"
            >
              {showFree ? "▼ 收起" : "✏️ 自由輸入行動"}
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
                    className="flex-1 rounded-xl px-3 py-2.5 text-sm
                      bg-slate-800/60 border border-slate-700/60
                      focus:outline-none focus:ring-2 focus:ring-purple-500/40
                      transition-all"
                  />
                  <button
                    onClick={handleFreeSubmit}
                    disabled={isLoading || !freeText.trim()}
                    className="px-3 py-2.5 bg-purple-700/60 hover:bg-purple-600/70
                      border border-purple-600/30 text-white rounded-xl
                      disabled:opacity-30 transition-colors flex items-center"
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
