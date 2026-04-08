"use client";
import { useGameStore } from "@/store/game-store";

const WEATHER_EMOJI: Record<string, string> = { clear: "☀️", rain: "🌧️", fog: "🌫️", thunder: "⛈️" };
const TIME_EMOJI:    Record<string, string> = { dawn: "🌅", morning: "🌤️", noon: "☀️", dusk: "🌆", night: "🌙" };

export default function StatusBar() {
  const { adventure } = useGameStore();
  if (!adventure) return null;

  const hpPct  = Math.round((adventure.hp / adventure.hp_max) * 100);
  const mpPct  = Math.round((adventure.mp / adventure.mp_max) * 100);
  const hpColor = hpPct < 20 ? "bg-red-500" : hpPct < 50 ? "bg-yellow-400" : "bg-emerald-400";
  const stColor = adventure.stress > 70 ? "bg-rose-500" : "bg-violet-500";

  return (
    <div className="border-b border-white/5 bg-[#05091a]/80">
      {/* 屬性列 */}
      <div className="flex gap-2 px-4 py-2.5 overflow-x-auto">
        <StatPill label="HP" value={adventure.hp} max={adventure.hp_max} pct={hpPct} barColor={hpColor} />
        <StatPill label="MP" value={adventure.mp} max={adventure.mp_max} pct={mpPct} barColor="bg-blue-400" />
        <StatPill label="壓力" value={adventure.stress} max={100} pct={adventure.stress} barColor={stColor} />
        <div className="flex-shrink-0 px-3 py-1 rounded-lg bg-slate-800/60 border border-slate-700/40 text-center">
          <div className="text-[9px] text-slate-500 uppercase tracking-wider">魅力</div>
          <div className="text-sm font-bold text-amber-300">{adventure.charisma}</div>
        </div>
      </div>

      {/* 位置 + 時間 */}
      <div className="flex items-center justify-between px-4 pb-2 text-[10px] text-slate-500">
        <span className="flex items-center gap-1 truncate max-w-[55%]">
          <span>📍</span>
          <span className="truncate">{adventure.location || "未知位置"}</span>
        </span>
        <span className="flex items-center gap-2 flex-shrink-0">
          <span>{TIME_EMOJI[adventure.time_of_day]}</span>
          <span>{WEATHER_EMOJI[adventure.weather]}</span>
          <span className="text-slate-600">第 {adventure.generation} 世 #{adventure.tick}</span>
        </span>
      </div>

      {/* 個性標籤 */}
      {(adventure.personality_tags ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1 px-4 pb-2.5">
          {adventure.personality_tags.map((tag: string) => (
            <span key={tag}
              className="px-2 py-0.5 rounded-md text-[9px] bg-purple-900/40 border border-purple-700/30 text-purple-300">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value, max, pct, barColor }: {
  label: string; value: number; max: number; pct: number; barColor: string;
}) {
  return (
    <div className="flex-shrink-0 px-3 py-1 rounded-lg bg-slate-800/60 border border-slate-700/40 min-w-[68px]">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[9px] text-slate-500 uppercase tracking-wider">{label}</span>
        <span className="text-[9px] text-slate-400">{value}/{max}</span>
      </div>
      <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`}
             style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
