"""
敘事引擎：整合 Claude API、骰子、時間、NPC 記憶
"""
import json
import re
from typing import Any

import anthropic

from app.core.config import get_settings
from app.models.game import Adventure, NPCState, WorldType
from app.prompts.system_prompt import build_system_prompt
from app.services.dice_engine import DiceContext, roll
from app.services.npc_memory import build_npc_context_for_prompt
from app.services.time_system import (
    advance_tick,
    get_environment_description,
    roll_weather,
    should_change_weather,
)

settings = get_settings()
_client = None


def get_anthropic_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    return _client


async def process_player_action(
    adventure: Adventure,
    npc_states: list[NPCState],
    choice_index: int | None,
    free_input: str | None,
    previous_choices: list[str],
) -> dict[str, Any]:
    """
    主流程：
    1. 骰子判定
    2. 推進時間
    3. 構建 System Prompt
    4. 呼叫 Claude 生成敘事
    5. 解析 LLM 回應
    """
    client = get_anthropic_client()

    # ── 1. 骰子判定 ────────────────────────────────────────
    hp_ratio = adventure.hp / adventure.hp_max if adventure.hp_max > 0 else 0
    dice_ctx = DiceContext(
        base_rate=0.70,
        affection=_avg_affection(npc_states),
        hp_ratio=hp_ratio,
        stamina=adventure.stamina,
        stress=adventure.stress,
        charisma=adventure.charisma,
        weather=adventure.weather,
        time_of_day=adventure.time_of_day,
        world_bonus=_get_world_bonus(adventure),
    )
    dice_result = roll(dice_ctx)

    # ── 2. 推進時間 ────────────────────────────────────────
    time_result = advance_tick(adventure.tick, ticks_consumed=1)
    new_tick = time_result["new_tick"]
    new_time_of_day = time_result["time_of_day"]

    # 天氣變換
    new_weather = adventure.weather
    if should_change_weather(new_tick):
        new_weather = roll_weather(adventure.weather)

    env_desc = get_environment_description(new_time_of_day, new_weather)

    # ── 3. 構建 System Prompt ──────────────────────────────
    npc_context = build_npc_context_for_prompt(npc_states)
    system = build_system_prompt(
        world_type=adventure.world_type,
        narrative_hint=dice_result.narrative_hint,
        hp=adventure.hp,
        hp_max=adventure.hp_max,
        mp=adventure.mp,
        mp_max=adventure.mp_max,
        stress=adventure.stress,
        charisma=adventure.charisma,
        tick=new_tick,
        time_of_day=new_time_of_day,
        weather=new_weather,
        location=adventure.location,
        environment_desc=env_desc,
        npc_context=npc_context,
        personality_tags=adventure.personality_tags or [],
        skills=adventure.skills or [],
        world_attributes=adventure.world_attributes or {},
        legacy_modifiers=adventure.legacy_modifiers or {},
        narrative_summary=adventure.narrative_summary,
        generation=adventure.generation,
    )

    # 組合用戶訊息
    if choice_index is not None and previous_choices and choice_index < len(previous_choices):
        user_msg = f"我選擇：{previous_choices[choice_index]}"
    elif free_input:
        user_msg = f"我的行動：{free_input}"
    else:
        user_msg = "開始這段冒險。"

    # ── 4. 呼叫 Claude ─────────────────────────────────────
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=system,
        messages=[{"role": "user", "content": user_msg}],
    )
    raw_text = response.content[0].text

    # ── 5. 解析 LLM 回應 ────────────────────────────────────
    parsed = _parse_llm_response(raw_text)

    return {
        "tick": new_tick,
        "time_of_day": new_time_of_day,
        "weather": new_weather,
        "dice_result": {
            "base_rate": dice_result.base_rate,
            "final_rate": dice_result.final_rate,
            "roll": dice_result.roll,
            "success": dice_result.success,
            "narrative_hint": dice_result.narrative_hint,
            "modifiers": dice_result.modifiers_applied,
        },
        **parsed,
    }


def _parse_llm_response(raw_text: str) -> dict[str, Any]:
    """從 LLM 輸出中提取 JSON 區塊"""
    json_match = re.search(r"```json\s*([\s\S]*?)\s*```", raw_text)
    if json_match:
        try:
            data = json.loads(json_match.group(1))
        except json.JSONDecodeError:
            data = {}
        # 提取 JSON 之外的純文字作為敘事（備用）
        narrative_from_text = raw_text[:json_match.start()].strip()
    else:
        data = {}
        narrative_from_text = raw_text.strip()

    return {
        "narrative": data.get("narrative") or narrative_from_text,
        "choices": data.get("choices", ["繼續", "觀察四周", "休息"]),
        "image_prompt": data.get("image_prompt", "Pixel art style, 16-bit, vibrant colors, retro gaming aesthetic, a mysterious scene"),
        "use_safe_image": data.get("use_safe_image", True),
        "npc_updates": data.get("npc_updates", []),
        "state_changes": data.get("state_changes", {
            "hp_delta": 0,
            "mp_delta": 0,
            "stress_delta": 0,
            "ticks_consumed": 1,
        }),
    }


def _avg_affection(npc_states: list[NPCState]) -> int:
    if not npc_states:
        return 0
    return sum(n.affection for n in npc_states) // len(npc_states)


def _get_world_bonus(adventure: Adventure) -> float:
    """從世界觀特殊屬性計算骰子加成"""
    attrs = adventure.world_attributes or {}
    if adventure.world_type == WorldType.XIAN_XIA:
        ling_li = attrs.get("ling_li", 0)
        return min(ling_li / 1000, 0.2)   # 最多 +20%
    elif adventure.world_type == WorldType.CAMPUS:
        grades = attrs.get("grades", 50)
        return (grades - 50) * 0.001       # 成績 80 → +0.03
    return 0.0
