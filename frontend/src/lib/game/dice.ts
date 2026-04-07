import type { WeatherType, TimeOfDay, NarrativeHint, DiceDetail } from "./types";

export interface DiceContext {
  baseRate?: number;
  affection?: number;
  hpRatio?: number;
  stress?: number;
  charisma?: number;
  weather?: WeatherType;
  timeOfDay?: TimeOfDay;
  worldBonus?: number;
}

const WEATHER_MOD: Record<WeatherType, number> = {
  clear: 0.05, rain: -0.05, fog: -0.10, thunder: 0.0,
};
const TIME_MOD: Record<TimeOfDay, number> = {
  dawn: 0.02, morning: 0.05, noon: 0.0, dusk: -0.03, night: -0.08,
};

export function rollDice(ctx: DiceContext): DiceDetail {
  const modifiers: { source: string; value: number }[] = [];
  let rate = ctx.baseRate ?? 0.70;

  // 好感度修正
  const affectionMod = ((ctx.affection ?? 0) / 10) * 0.05;
  rate += affectionMod;
  modifiers.push({ source: "好感度", value: +affectionMod.toFixed(3) });

  // HP 危機
  const hpRatio = ctx.hpRatio ?? 1;
  if (hpRatio < 0.2) {
    rate -= 0.10;
    modifiers.push({ source: "瀕死狀態", value: -0.10 });
  } else if (hpRatio < 0.5) {
    rate -= 0.05;
    modifiers.push({ source: "負傷", value: -0.05 });
  }

  // 壓力
  if ((ctx.stress ?? 0) > 70) {
    rate -= 0.08;
    modifiers.push({ source: "高度壓力", value: -0.08 });
  }

  // 魅力
  const charismaMod = ((ctx.charisma ?? 10) - 10) * 0.005;
  rate += charismaMod;
  modifiers.push({ source: "魅力", value: +charismaMod.toFixed(3) });

  // 天氣
  const weatherMod = WEATHER_MOD[ctx.weather ?? "clear"];
  rate += weatherMod;
  modifiers.push({ source: `天氣:${ctx.weather ?? "clear"}`, value: weatherMod });

  // 時段
  const timeMod = TIME_MOD[ctx.timeOfDay ?? "morning"];
  rate += timeMod;
  modifiers.push({ source: `時段:${ctx.timeOfDay ?? "morning"}`, value: timeMod });

  // 世界觀加成
  if (ctx.worldBonus) {
    rate += ctx.worldBonus;
    modifiers.push({ source: "世界觀屬性", value: ctx.worldBonus });
  }

  const finalRate = Math.max(0.05, Math.min(0.98, rate));
  const roll = Math.random();
  const success = roll <= finalRate;

  let narrativeHint: NarrativeHint = "NORMAL";
  if (hpRatio < 0.2)          narrativeHint = "CRITICAL_HP";
  else if (!success && roll > 0.90) narrativeHint = "CRITICAL_FAIL";
  else if (success && roll < 0.05)  narrativeHint = "CRITICAL_SUCCESS";
  else if ((ctx.stress ?? 0) > 80)  narrativeHint = "HIGH_STRESS";

  return {
    baseRate: ctx.baseRate ?? 0.70,
    finalRate: +finalRate.toFixed(4),
    roll: +roll.toFixed(4),
    success,
    narrativeHint,
    modifiers,
  };
}
