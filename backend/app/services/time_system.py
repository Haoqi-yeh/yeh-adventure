"""
Tick 時間系統：晝夜變換 + 天氣系統
每個玩家行動消耗若干 tick
"""
import random
from app.models.game import TimeOfDay, WeatherType


# 每個 tick 代表 30 分鐘遊戲內時間
TICKS_PER_DAY = 48  # 24 小時 × 2

TIME_THRESHOLDS: list[tuple[int, TimeOfDay]] = [
    (0,  TimeOfDay.DAWN),     # 00:00 - 02:59
    (6,  TimeOfDay.MORNING),  # 03:00 - 11:59
    (24, TimeOfDay.NOON),     # 12:00 - 16:59
    (34, TimeOfDay.DUSK),     # 17:00 - 19:59
    (40, TimeOfDay.NIGHT),    # 20:00 - 23:59
]

# 天氣轉換機率矩陣
WEATHER_TRANSITION: dict[WeatherType, dict[WeatherType, float]] = {
    WeatherType.CLEAR: {
        WeatherType.CLEAR:   0.60,
        WeatherType.RAIN:    0.20,
        WeatherType.FOG:     0.10,
        WeatherType.THUNDER: 0.10,
    },
    WeatherType.RAIN: {
        WeatherType.CLEAR:   0.30,
        WeatherType.RAIN:    0.50,
        WeatherType.FOG:     0.15,
        WeatherType.THUNDER: 0.05,
    },
    WeatherType.FOG: {
        WeatherType.CLEAR:   0.40,
        WeatherType.RAIN:    0.20,
        WeatherType.FOG:     0.35,
        WeatherType.THUNDER: 0.05,
    },
    WeatherType.THUNDER: {
        WeatherType.CLEAR:   0.20,
        WeatherType.RAIN:    0.50,
        WeatherType.FOG:     0.10,
        WeatherType.THUNDER: 0.20,
    },
}


def advance_tick(current_tick: int, ticks_consumed: int = 1) -> dict:
    """推進時間並計算新的晝夜/天氣狀態"""
    new_tick = current_tick + ticks_consumed
    day_position = new_tick % TICKS_PER_DAY

    # 計算時段
    time_of_day = TimeOfDay.NIGHT
    for threshold, tod in reversed(TIME_THRESHOLDS):
        if day_position >= threshold:
            time_of_day = tod
            break

    # 天氣僅在整小時（偶數 tick）有機會改變
    weather_changed = False

    return {
        "new_tick": new_tick,
        "time_of_day": time_of_day,
        "weather_changed": weather_changed,
        "day_number": new_tick // TICKS_PER_DAY + 1,
    }


def roll_weather(current_weather: WeatherType) -> WeatherType:
    """根據轉換機率決定新天氣"""
    transitions = WEATHER_TRANSITION[current_weather]
    weathers = list(transitions.keys())
    weights = [transitions[w] for w in weathers]
    return random.choices(weathers, weights=weights, k=1)[0]


def should_change_weather(tick: int) -> bool:
    """每 8 個 tick（4 小時）有機率換天氣"""
    return tick % 8 == 0


def get_environment_description(time_of_day: TimeOfDay, weather: WeatherType) -> str:
    """返回環境描述，供 System Prompt 注入"""
    time_desc = {
        TimeOfDay.DAWN:    "天邊剛透出一絲魚肚白",
        TimeOfDay.MORNING: "陽光正好，萬物清醒",
        TimeOfDay.NOON:    "日頭毒辣，空氣有點燙",
        TimeOfDay.DUSK:    "夕陽把天空燒成橘紅色",
        TimeOfDay.NIGHT:   "夜色深沉，周遭靜得讓人不安",
    }
    weather_desc = {
        WeatherType.CLEAR:   "萬里無雲",
        WeatherType.RAIN:    "細雨打在身上，濕黏難受",
        WeatherType.FOG:     "霧氣瀰漫，三步外看不清人臉",
        WeatherType.THUNDER: "遠處傳來悶雷，閃電劃過天際",
    }
    return f"{time_desc[time_of_day]}，{weather_desc[weather]}。"
