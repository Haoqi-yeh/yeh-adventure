import type { TimeOfDay, WeatherType } from "./types";

const TICKS_PER_DAY = 48;

const TIME_THRESHOLDS: [number, TimeOfDay][] = [
  [0,  "dawn"],
  [6,  "morning"],
  [24, "noon"],
  [34, "dusk"],
  [40, "night"],
];

const WEATHER_TRANSITION: Record<WeatherType, Record<WeatherType, number>> = {
  clear:   { clear: 0.60, rain: 0.20, fog: 0.10, thunder: 0.10 },
  rain:    { clear: 0.30, rain: 0.50, fog: 0.15, thunder: 0.05 },
  fog:     { clear: 0.40, rain: 0.20, fog: 0.35, thunder: 0.05 },
  thunder: { clear: 0.20, rain: 0.50, fog: 0.10, thunder: 0.20 },
};

export function advanceTick(currentTick: number, consume = 1) {
  const newTick = currentTick + consume;
  const pos = newTick % TICKS_PER_DAY;

  let timeOfDay: TimeOfDay = "night";
  for (const [threshold, tod] of [...TIME_THRESHOLDS].reverse()) {
    if (pos >= threshold) { timeOfDay = tod; break; }
  }

  return { newTick, timeOfDay, dayNumber: Math.floor(newTick / TICKS_PER_DAY) + 1 };
}

export function rollWeather(current: WeatherType): WeatherType {
  const table = WEATHER_TRANSITION[current];
  const entries = Object.entries(table) as [WeatherType, number][];
  const rand = Math.random();
  let cumulative = 0;
  for (const [weather, prob] of entries) {
    cumulative += prob;
    if (rand <= cumulative) return weather;
  }
  return current;
}

export function shouldChangeWeather(tick: number) {
  return tick % 8 === 0;
}

export function getEnvDescription(timeOfDay: TimeOfDay, weather: WeatherType): string {
  const TIME: Record<TimeOfDay, string> = {
    dawn:    "天邊剛透出一絲魚肚白",
    morning: "陽光正好，萬物清醒",
    noon:    "日頭毒辣，空氣有點燙",
    dusk:    "夕陽把天空燒成橘紅色",
    night:   "夜色深沉，周遭靜得讓人不安",
  };
  const WEATHER: Record<WeatherType, string> = {
    clear:   "萬里無雲",
    rain:    "細雨打在身上，濕黏難受",
    fog:     "霧氣瀰漫，三步外看不清人臉",
    thunder: "遠處傳來悶雷，閃電劃過天際",
  };
  return `${TIME[timeOfDay]}，${WEATHER[weather]}。`;
}
