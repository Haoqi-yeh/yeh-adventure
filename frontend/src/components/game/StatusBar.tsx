"use client";
import { useGameStore } from "@/store/game-store";

const WEATHER_LABEL: Record<string, string> = { clear: "☀️ 晴", rain: "🌧️ 雨", fog: "🌫️ 霧", thunder: "⛈️ 雷" };
const TIME_LABEL:    Record<string, string> = { dawn: "🌅 黎明", morning: "🌤️ 早晨", noon: "☀️ 正午", dusk: "🌆 黃昏", night: "🌙 深夜" };

export default function StatusBar() {
  const { adventure } = useGameStore();
  if (!adventure) return null;

  const hpPct  = Math.round((adventure.hp / adventure.hp_max) * 100);
  const mpPct  = Math.round((adventure.mp / adventure.mp_max) * 100);

  return (
    <div className="glass rounded-2xl p-4 space-y-3 font-pixel text-xs">
      {/* 頂部資訊列 */}
      <div className="flex items-center justify-between text-purple-300/70 text-[11px]">
        <span>📍 {adventure.location}</span>
        <span className="flex gap-3">
          <span>{TIME_LABEL[adventure.time_of_day]}</span>
          <span>{WEATHER_LABEL[adventure.weather]}</span>
          <span className="text-purple-400/50">第 {adventure.generation} 世 · #{adventure.tick}</span>
        </span>
      </div>

      {/* 屬性條 */}
      <div className="grid grid-cols-3 gap-3">
        <Bar label="HP" value={adventure.hp} max={adventure.hp_max} pct={hpPct}
          color={hpPct < 20 ? "bg-red-500" : hpPct < 50 ? "bg-yellow-500" : "bg-emerald-500"} />
        <Bar label="MP" value={adventure.mp} max={adventure.mp_max} pct={mpPct} color="bg-blue-500" />
        <Bar label="壓力" value={adventure.stress} max={100} pct={adventure.stress}
          color={adventure.stress > 70 ? "bg-rose-500" : "bg-violet-500"} reverse />
      </div>

      {/* 個性標籤 */}
      {(adventure.personality_tags ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {adventure.personality_tags.map((tag: string) => (
            <span key={tag} className="px-2 py-0.5 rounded-md text-[10px]
              bg-purple-900/50 border border-purple-700/40 text-purple-300">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Bar({ label, value, max, pct, color, reverse = false }: {
  label: string; value: number; max: number; pct: number; color: string; reverse?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-white/40 text-[10px]">
        <span>{label}</span>
        <span>{value}/{max}</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
