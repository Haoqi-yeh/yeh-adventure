"use client";
import { useGameStore } from "@/store/game-store";
import { clsx } from "clsx";

const WEATHER_EMOJI: Record<string, string> = {
  clear: "☀️", rain: "🌧️", fog: "🌫️", thunder: "⛈️",
};
const TIME_EMOJI: Record<string, string> = {
  dawn: "🌅", morning: "🌤️", noon: "☀️", dusk: "🌆", night: "🌙",
};

export default function StatusBar() {
  const { adventure } = useGameStore();
  if (!adventure) return null;

  const hpPercent = Math.round((adventure.hp / adventure.hp_max) * 100);
  const mpPercent = Math.round((adventure.mp / adventure.mp_max) * 100);

  return (
    <div className="bg-gray-900 border border-cyan-800 rounded-xl p-4 space-y-3 font-mono text-sm">
      {/* 位置與時間 */}
      <div className="flex items-center justify-between text-cyan-400">
        <span>📍 {adventure.location}</span>
        <span>
          {TIME_EMOJI[adventure.time_of_day]} {WEATHER_EMOJI[adventure.weather]}
          {" "}第{adventure.generation}世 · Tick {adventure.tick}
        </span>
      </div>

      {/* HP 條 */}
      <StatBar
        label="HP"
        value={adventure.hp}
        max={adventure.hp_max}
        percent={hpPercent}
        color={hpPercent < 20 ? "bg-red-500" : hpPercent < 50 ? "bg-yellow-500" : "bg-green-500"}
      />

      {/* MP 條 */}
      <StatBar
        label="MP"
        value={adventure.mp}
        max={adventure.mp_max}
        percent={mpPercent}
        color="bg-blue-500"
      />

      {/* 壓力條 */}
      <StatBar
        label="壓力"
        value={adventure.stress}
        max={100}
        percent={adventure.stress}
        color={adventure.stress > 70 ? "bg-purple-500" : "bg-indigo-400"}
        reverse
      />

      {/* 個性標籤 */}
      {adventure.personality_tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {adventure.personality_tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-cyan-900 text-cyan-300 rounded text-xs">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function StatBar({
  label, value, max, percent, color, reverse = false,
}: {
  label: string;
  value: number;
  max: number;
  percent: number;
  color: string;
  reverse?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-gray-400">
        <span>{label}</span>
        <span>{value}/{max}</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={clsx("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
