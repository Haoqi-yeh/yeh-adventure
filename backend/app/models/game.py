"""
PADNE 核心資料模型
支援動態屬性、NPC 記憶、Roguelike 傳承
"""
import uuid
from datetime import datetime
from enum import Enum as PyEnum
from typing import Any

from sqlalchemy import (
    String, Integer, Float, Boolean, Text, DateTime, Enum,
    ForeignKey, JSON, UniqueConstraint, Index,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.database import Base


# ─────────────────────────────────────────────
# Enums
# ─────────────────────────────────────────────

class WorldType(str, PyEnum):
    XIAN_XIA   = "xian_xia"    # 仙俠
    CAMPUS     = "campus"      # 校園
    APOCALYPSE = "apocalypse"  # 末日
    ADULT      = "adult"       # 成人
    CUSTOM     = "custom"      # 自訂


class WeatherType(str, PyEnum):
    CLEAR   = "clear"    # 晴
    RAIN    = "rain"     # 雨
    FOG     = "fog"      # 霧
    THUNDER = "thunder"  # 雷電


class TimeOfDay(str, PyEnum):
    DAWN    = "dawn"     # 黎明
    MORNING = "morning"  # 早晨
    NOON    = "noon"     # 正午
    DUSK    = "dusk"     # 黃昏
    NIGHT   = "night"   # 深夜


class NPCRelation(str, PyEnum):
    NEUTRAL  = "neutral"
    FRIENDLY = "friendly"
    ROMANTIC = "romantic"
    HOSTILE  = "hostile"
    VENDETTA = "vendetta"  # 仇恨


class AdventureStatus(str, PyEnum):
    ACTIVE    = "active"
    COMPLETED = "completed"
    DEAD      = "dead"


# ─────────────────────────────────────────────
# Player（帳號層）
# ─────────────────────────────────────────────

class Player(Base):
    __tablename__ = "players"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    username: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    adventures: Mapped[list["Adventure"]] = relationship(
        back_populates="player", cascade="all, delete-orphan"
    )
    legacy_pool: Mapped[list["LegacyPool"]] = relationship(
        back_populates="player", cascade="all, delete-orphan"
    )
    npc_cache: Mapped[list["NPCCache"]] = relationship(
        back_populates="player", cascade="all, delete-orphan"
    )


# ─────────────────────────────────────────────
# Adventure（一次冒險回合）
# ─────────────────────────────────────────────

class Adventure(Base):
    __tablename__ = "adventures"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    player_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("players.id"), nullable=False
    )
    world_type: Mapped[WorldType] = mapped_column(
        Enum(WorldType), nullable=False, default=WorldType.CAMPUS
    )
    status: Mapped[AdventureStatus] = mapped_column(
        Enum(AdventureStatus), nullable=False, default=AdventureStatus.ACTIVE
    )
    generation: Mapped[int] = mapped_column(Integer, default=1)  # Roguelike 第幾世

    # ── 角色屬性（動態，根據世界觀不同有不同欄位）
    # 通用屬性
    hp: Mapped[int] = mapped_column(Integer, default=100)
    hp_max: Mapped[int] = mapped_column(Integer, default=100)
    mp: Mapped[int] = mapped_column(Integer, default=100)       # 魔力/靈力/精神力
    mp_max: Mapped[int] = mapped_column(Integer, default=100)
    stamina: Mapped[int] = mapped_column(Integer, default=100)  # 體力
    stress: Mapped[int] = mapped_column(Integer, default=0)     # 壓力（校園/末日用）
    charisma: Mapped[int] = mapped_column(Integer, default=10)  # 魅力

    # 世界觀特殊屬性（JSONB 彈性存放）
    # 仙俠: {"ling_li": 0, "dao_xin": 100, "cultivation_level": "煉氣期"}
    # 校園: {"grades": 80, "popularity": 50, "clubs": []}
    # 末日: {"sanity": 100, "scavenging": 50, "survivor_count": 0}
    # 成人: {"desire": 0, "reputation": 50}
    world_attributes: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)

    # ── 技能與標籤（Roguelike 傳承來源）
    skills: Mapped[list[str]] = mapped_column(JSONB, default=list)
    personality_tags: Mapped[list[str]] = mapped_column(JSONB, default=list)
    # e.g. ["衝動型", "幽默", "死亡回憶:被妖獸撕裂"]

    # ── 時間與環境
    tick: Mapped[int] = mapped_column(Integer, default=0)          # 遊戲內時間刻
    time_of_day: Mapped[TimeOfDay] = mapped_column(
        Enum(TimeOfDay), default=TimeOfDay.MORNING
    )
    weather: Mapped[WeatherType] = mapped_column(
        Enum(WeatherType), default=WeatherType.CLEAR
    )
    location: Mapped[str] = mapped_column(String(128), default="起始之地")

    # ── 敘事記憶（滾動窗口，最近 N 段故事摘要）
    narrative_summary: Mapped[str] = mapped_column(Text, default="")

    # ── 傳承修正（從 LegacyPool 繼承的 buff/debuff）
    legacy_modifiers: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    # e.g. {"affection_bonus": {"小龍女": 20}, "skill_bonus": {"劍術": 15}}

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    player: Mapped["Player"] = relationship(back_populates="adventures")
    npc_states: Mapped[list["NPCState"]] = relationship(
        back_populates="adventure", cascade="all, delete-orphan"
    )
    events: Mapped[list["EventLog"]] = relationship(
        back_populates="adventure", cascade="all, delete-orphan"
    )


# ─────────────────────────────────────────────
# NPC State（單次冒險中 NPC 狀態）
# ─────────────────────────────────────────────

class NPCState(Base):
    __tablename__ = "npc_states"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    adventure_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("adventures.id"), nullable=False
    )
    npc_cache_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("npc_cache.id"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(64), nullable=False)
    archetype: Mapped[str] = mapped_column(String(64), default="")  # 俠客/師父/惡霸...

    # 好感度 -100 ~ 100
    affection: Mapped[int] = mapped_column(Integer, default=0)
    relation: Mapped[NPCRelation] = mapped_column(
        Enum(NPCRelation), default=NPCRelation.NEUTRAL
    )
    is_alive: Mapped[bool] = mapped_column(Boolean, default=True)

    # NPC 自身記憶：玩家做過的事
    memory_log: Mapped[list[dict]] = mapped_column(JSONB, default=list)
    # [{"tick": 5, "event": "玩家救了我", "impact": +30}, ...]

    # 個性特質
    personality: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    # {"traits": ["傲嬌", "忠義"], "secret": "其實是魔族臥底"}

    adventure: Mapped["Adventure"] = relationship(back_populates="npc_states")
    cache: Mapped["NPCCache | None"] = relationship(back_populates="states")

    __table_args__ = (
        Index("ix_npc_states_adventure_name", "adventure_id", "name"),
    )


# ─────────────────────────────────────────────
# NPC Cache（跨回合持久記憶池）
# ─────────────────────────────────────────────

class NPCCache(Base):
    """未死亡的 NPC 進入此緩存，可在未來冒險中再次出現"""
    __tablename__ = "npc_cache"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    player_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("players.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(64), nullable=False)
    archetype: Mapped[str] = mapped_column(String(64), default="")
    last_affection: Mapped[int] = mapped_column(Integer, default=0)
    last_relation: Mapped[NPCRelation] = mapped_column(
        Enum(NPCRelation), default=NPCRelation.NEUTRAL
    )
    cumulative_memory: Mapped[list[dict]] = mapped_column(JSONB, default=list)
    # 跨回合累積記憶
    appearance_count: Mapped[int] = mapped_column(Integer, default=0)
    last_seen_generation: Mapped[int] = mapped_column(Integer, default=1)
    personality: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)

    player: Mapped["Player"] = relationship(back_populates="npc_cache")
    states: Mapped[list["NPCState"]] = relationship(back_populates="cache")

    __table_args__ = (
        UniqueConstraint("player_id", "name", name="uq_npc_cache_player_name"),
    )


# ─────────────────────────────────────────────
# Legacy Pool（Roguelike 傳承資料）
# ─────────────────────────────────────────────

class LegacyPool(Base):
    """冒險結束後，將成就與屬性記入傳承池，供下一世繼承"""
    __tablename__ = "legacy_pool"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    player_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("players.id"), nullable=False
    )
    source_adventure_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("adventures.id"), nullable=False
    )
    generation: Mapped[int] = mapped_column(Integer, nullable=False)
    world_type: Mapped[WorldType] = mapped_column(Enum(WorldType), nullable=False)

    # 繼承的個性標籤
    personality_tags: Mapped[list[str]] = mapped_column(JSONB, default=list)
    # 繼承的技能（帶衰減係數）
    inherited_skills: Mapped[list[dict]] = mapped_column(JSONB, default=list)
    # [{"skill": "劍術", "level": 3, "decay": 0.8}]
    # 好感度修正（NPC 記得前世情誼）
    affection_modifiers: Mapped[dict[str, int]] = mapped_column(JSONB, default=dict)
    # {"小龍女": 25, "魔頭Boss": -40}
    # 特殊能力（稀有傳承）
    special_abilities: Mapped[list[dict]] = mapped_column(JSONB, default=list)
    # [{"name": "鬼眼", "description": "能看見隱形存在", "source": "前世死於鬼手"}]

    death_cause: Mapped[str] = mapped_column(String(256), default="")
    final_narrative: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    player: Mapped["Player"] = relationship(back_populates="legacy_pool")


# ─────────────────────────────────────────────
# Event Log（事件記錄，含擲骰結果）
# ─────────────────────────────────────────────

class EventLog(Base):
    __tablename__ = "event_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    adventure_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("adventures.id"), nullable=False
    )
    tick: Mapped[int] = mapped_column(Integer, nullable=False)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    # "player_choice" | "dice_roll" | "combat" | "npc_reaction" | "narrative"

    # 玩家選擇 or 系統事件
    player_input: Mapped[str] = mapped_column(Text, default="")
    choices_presented: Mapped[list[str]] = mapped_column(JSONB, default=list)
    choice_made: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # 擲骰詳情（隱形骰）
    dice_result: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    # {"base_rate": 0.75, "modifiers": {"affection_bonus": 0.1}, "final_rate": 0.85, "success": true}

    # 敘事輸出
    narrative_output: Mapped[str] = mapped_column(Text, default="")
    state_snapshot: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    adventure: Mapped["Adventure"] = relationship(back_populates="events")

    __table_args__ = (
        Index("ix_event_logs_adventure_tick", "adventure_id", "tick"),
    )
