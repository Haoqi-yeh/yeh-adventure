"""
動態規則引擎（DRE）- 隱形擲骰
基礎成功率 70%，受好感度、環境、屬性動態修正
"""
import random
from dataclasses import dataclass, field
from typing import Any

from app.models.game import WeatherType, TimeOfDay


@dataclass
class DiceContext:
    """骰子情境，所有影響判定的變數"""
    base_rate: float = 0.70
    # 好感度修正：每 10 點好感度 ±0.05
    affection: int = 0
    # 屬性修正
    hp_ratio: float = 1.0      # hp / hp_max
    stamina: int = 100
    stress: int = 0
    charisma: int = 10
    # 環境修正
    weather: WeatherType = WeatherType.CLEAR
    time_of_day: TimeOfDay = TimeOfDay.MORNING
    # 世界觀特殊屬性（e.g. 仙俠靈力影響符咒成功率）
    world_bonus: float = 0.0
    # 技能加成
    skill_bonus: float = 0.0
    # 額外修正（事件觸發）
    extra_modifiers: list[dict[str, Any]] = field(default_factory=list)


@dataclass
class DiceResult:
    base_rate: float
    final_rate: float
    roll: float
    success: bool
    modifiers_applied: list[dict[str, Any]]
    narrative_hint: str  # 給 LLM 的暗示（緊迫感調整）


WEATHER_MODIFIERS = {
    WeatherType.CLEAR:   0.05,
    WeatherType.RAIN:   -0.05,
    WeatherType.FOG:    -0.10,
    WeatherType.THUNDER: 0.0,   # 雷電是 neutral，但影響敘事
}

TIME_MODIFIERS = {
    TimeOfDay.DAWN:    0.02,
    TimeOfDay.MORNING: 0.05,
    TimeOfDay.NOON:    0.0,
    TimeOfDay.DUSK:   -0.03,
    TimeOfDay.NIGHT:  -0.08,  # 夜晚危機感上升
}


def roll(ctx: DiceContext) -> DiceResult:
    modifiers: list[dict[str, Any]] = []

    rate = ctx.base_rate

    # 好感度修正
    affection_mod = (ctx.affection / 10) * 0.05
    rate += affection_mod
    modifiers.append({"source": "好感度", "value": round(affection_mod, 3)})

    # HP 危機修正（HP < 20% 時觸發緊迫感但略降成功率）
    if ctx.hp_ratio < 0.2:
        hp_mod = -0.10
        rate += hp_mod
        modifiers.append({"source": "瀕死狀態", "value": hp_mod})
    elif ctx.hp_ratio < 0.5:
        hp_mod = -0.05
        rate += hp_mod
        modifiers.append({"source": "負傷", "value": hp_mod})

    # 壓力修正（壓力 > 70 時判斷力下降）
    if ctx.stress > 70:
        stress_mod = -0.08
        rate += stress_mod
        modifiers.append({"source": "高度壓力", "value": stress_mod})

    # 魅力修正（社交事件）
    charisma_mod = (ctx.charisma - 10) * 0.005
    rate += charisma_mod
    modifiers.append({"source": "魅力", "value": round(charisma_mod, 3)})

    # 天氣修正
    weather_mod = WEATHER_MODIFIERS.get(ctx.weather, 0)
    rate += weather_mod
    modifiers.append({"source": f"天氣:{ctx.weather.value}", "value": weather_mod})

    # 時間修正
    time_mod = TIME_MODIFIERS.get(ctx.time_of_day, 0)
    rate += time_mod
    modifiers.append({"source": f"時段:{ctx.time_of_day.value}", "value": time_mod})

    # 世界觀與技能加成
    if ctx.world_bonus:
        rate += ctx.world_bonus
        modifiers.append({"source": "世界觀屬性", "value": ctx.world_bonus})
    if ctx.skill_bonus:
        rate += ctx.skill_bonus
        modifiers.append({"source": "技能加成", "value": ctx.skill_bonus})

    # 額外事件修正
    for mod in ctx.extra_modifiers:
        rate += mod.get("value", 0)
        modifiers.append(mod)

    # 限制在合理範圍
    final_rate = max(0.05, min(0.98, rate))

    roll_val = random.random()
    success = roll_val <= final_rate

    # 給 LLM 的敘事提示
    if ctx.hp_ratio < 0.2:
        narrative_hint = "CRITICAL_HP"   # 觸發極度緊迫敘事
    elif not success and roll_val > 0.90:
        narrative_hint = "CRITICAL_FAIL"
    elif success and roll_val < 0.05:
        narrative_hint = "CRITICAL_SUCCESS"
    elif ctx.stress > 80:
        narrative_hint = "HIGH_STRESS"
    else:
        narrative_hint = "NORMAL"

    return DiceResult(
        base_rate=ctx.base_rate,
        final_rate=final_rate,
        roll=round(roll_val, 4),
        success=success,
        modifiers_applied=modifiers,
        narrative_hint=narrative_hint,
    )
