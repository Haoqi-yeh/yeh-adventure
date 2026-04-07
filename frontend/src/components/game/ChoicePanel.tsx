"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import { clsx } from "clsx";

export default function ChoicePanel() {
  const { choices, makeChoice, freeAction, isLoading, adventure } = useGameStore();
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
      {isDead && (
        <div className="text-red-400 text-center py-4 font-bold text-lg border border-red-800 rounded-xl">
          ⚰️ 你死了。這一世的故事結束了。
        </div>
      )}

      {!isDead && (
        <>
          <div className="grid gap-2">
            {choices.map((choice, i) => (
              <motion.button
                key={`${i}-${choice}`}
                whileHover={{ scale: 1.01, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => makeChoice(i)}
                disabled={isLoading}
                className={clsx(
                  "w-full text-left px-4 py-3 rounded-lg border transition-all duration-200",
                  "bg-gray-800 border-gray-600 text-gray-200",
                  "hover:bg-cyan-900 hover:border-cyan-600 hover:text-cyan-100",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  "font-mono text-sm"
                )}
              >
                <span className="text-cyan-500 mr-2">{["▶", "◆", "●", "★"][i % 4]}</span>
                {choice}
              </motion.button>
            ))}
          </div>

          {/* 自由輸入 */}
          <div>
            <button
              onClick={() => setShowFree(!showFree)}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showFree ? "▼ 收起自由輸入" : "▷ 自由輸入行動"}
            </button>
            {showFree && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFreeSubmit()}
                  placeholder="輸入你想做的事..."
                  className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleFreeSubmit}
                  disabled={isLoading || !freeText.trim()}
                  className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg text-sm disabled:opacity-40 transition-colors"
                >
                  執行
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
