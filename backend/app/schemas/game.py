"""Pydantic schemas for API request/response validation"""
from __future__ import annotations
import uuid
from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field

from app.models.game import WorldType, WeatherType, TimeOfDay, NPCRelation, AdventureStatus


# ── Adventure ─────────────────────────────────────────────────────────────────

class AdventureCreate(BaseModel):
    world_type: WorldType = WorldType.CAMPUS
    player_name: str = Field(..., min_length=1, max_length=64)
    # 可帶入上一世傳承 ID
    inherit_legacy_id: uuid.UUID | None = None


class AdventureStateOut(BaseModel):
    id: uuid.UUID
    world_type: WorldType
    status: AdventureStatus
    generation: int
    hp: int
    hp_max: int
    mp: int
    mp_max: int
    stamina: int
    stress: int
    charisma: int
    world_attributes: dict[str, Any]
    skills: list[str]
    personality_tags: list[str]
    tick: int
    time_of_day: TimeOfDay
    weather: WeatherType
    location: str
    narrative_summary: str
    legacy_modifiers: dict[str, Any]

    model_config = {"from_attributes": True}


# ── Player Action ──────────────────────────────────────────────────────────────

class PlayerAction(BaseModel):
    adventure_id: uuid.UUID
    choice_index: int | None = None       # 選項索引（0-based）
    free_input: str | None = None         # 自由輸入文字
    # 前端可附帶當前狀態快照以節省 DB 查詢
    state_hint: dict[str, Any] | None = None


class NarrativeResponse(BaseModel):
    tick: int
    narrative: str                        # 九把刀風格敘事
    choices: list[str]                    # 下一步選項
    state: AdventureStateOut
    image_prompt: str                     # 給 Imagen/Grok 的圖像 Prompt
    use_safe_image: bool                  # True=Imagen, False=Grok
    dice_detail: dict[str, Any] | None    # 隱形骰結果（debug 用）
    npc_updates: list[NPCUpdateOut]


# ── NPC ───────────────────────────────────────────────────────────────────────

class NPCUpdateOut(BaseModel):
    name: str
    affection_delta: int
    new_relation: NPCRelation
    reaction_text: str


class NPCStateOut(BaseModel):
    id: uuid.UUID
    name: str
    archetype: str
    affection: int
    relation: NPCRelation
    is_alive: bool
    personality: dict[str, Any]

    model_config = {"from_attributes": True}


# ── Legacy ────────────────────────────────────────────────────────────────────

class LegacyOut(BaseModel):
    id: uuid.UUID
    generation: int
    world_type: WorldType
    personality_tags: list[str]
    inherited_skills: list[dict[str, Any]]
    affection_modifiers: dict[str, int]
    special_abilities: list[dict[str, Any]]
    death_cause: str
    final_narrative: str
    created_at: datetime

    model_config = {"from_attributes": True}
