"""遊戲核心 API 路由"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.db.database import get_db
from app.models.game import Adventure, Player, NPCState, LegacyPool, EventLog, AdventureStatus
from app.schemas.game import (
    AdventureCreate, AdventureStateOut, PlayerAction, NarrativeResponse,
    NPCUpdateOut, LegacyOut,
)
from app.services.narrative_engine import process_player_action
from app.services.npc_memory import apply_affection_delta, prepare_npc_for_cache
from app.services.time_system import advance_tick

router = APIRouter(prefix="/game", tags=["game"])


# ── 建立新冒險 ─────────────────────────────────────────────────────────────────

@router.post("/adventures", response_model=AdventureStateOut, status_code=status.HTTP_201_CREATED)
async def create_adventure(
    payload: AdventureCreate,
    db: AsyncSession = Depends(get_db),
):
    # 取得或建立玩家
    result = await db.execute(select(Player).where(Player.username == payload.player_name))
    player = result.scalar_one_or_none()
    if not player:
        player = Player(username=payload.player_name)
        db.add(player)
        await db.flush()

    # 計算傳承修正
    legacy_modifiers: dict = {}
    generation = 1

    if payload.inherit_legacy_id:
        leg_result = await db.execute(
            select(LegacyPool).where(
                LegacyPool.id == payload.inherit_legacy_id,
                LegacyPool.player_id == player.id,
            )
        )
        legacy = leg_result.scalar_one_or_none()
        if legacy:
            generation = legacy.generation + 1
            legacy_modifiers = {
                "affection_bonus": legacy.affection_modifiers,
                "skill_bonus": {
                    s["skill"]: int(s["level"] * s.get("decay", 0.8))
                    for s in (legacy.inherited_skills or [])
                },
            }

    # 建立冒險
    adventure = Adventure(
        player_id=player.id,
        world_type=payload.world_type,
        generation=generation,
        legacy_modifiers=legacy_modifiers,
    )
    db.add(adventure)
    await db.commit()
    await db.refresh(adventure)
    return adventure


# ── 取得冒險狀態 ───────────────────────────────────────────────────────────────

@router.get("/adventures/{adventure_id}", response_model=AdventureStateOut)
async def get_adventure(
    adventure_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Adventure).where(Adventure.id == adventure_id))
    adventure = result.scalar_one_or_none()
    if not adventure:
        raise HTTPException(status_code=404, detail="冒險不存在")
    return adventure


# ── 玩家行動 ───────────────────────────────────────────────────────────────────

@router.post("/action", response_model=NarrativeResponse)
async def player_action(
    payload: PlayerAction,
    db: AsyncSession = Depends(get_db),
):
    # 載入冒險
    result = await db.execute(
        select(Adventure).where(Adventure.id == payload.adventure_id)
    )
    adventure = result.scalar_one_or_none()
    if not adventure:
        raise HTTPException(status_code=404, detail="冒險不存在")
    if adventure.status != AdventureStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="此冒險已結束")

    # 載入 NPC 狀態
    npc_result = await db.execute(
        select(NPCState).where(NPCState.adventure_id == adventure.id)
    )
    npc_states = list(npc_result.scalars().all())

    # 取得上一輪選項（從最新 EventLog）
    event_result = await db.execute(
        select(EventLog)
        .where(EventLog.adventure_id == adventure.id)
        .order_by(EventLog.tick.desc())
        .limit(1)
    )
    last_event = event_result.scalar_one_or_none()
    previous_choices = last_event.choices_presented if last_event else []

    # 呼叫敘事引擎
    engine_result = await process_player_action(
        adventure=adventure,
        npc_states=npc_states,
        choice_index=payload.choice_index,
        free_input=payload.free_input,
        previous_choices=previous_choices,
    )

    # ── 更新 NPC 好感度 ─────────────────────────────────────
    npc_update_outs: list[NPCUpdateOut] = []
    npc_map = {n.name: n for n in npc_states}

    for npc_upd in engine_result.get("npc_updates", []):
        npc_name = npc_upd.get("name")
        delta = npc_upd.get("affection_delta", 0)
        reaction = npc_upd.get("reaction_text", "")

        if npc_name in npc_map:
            result_info = apply_affection_delta(
                npc_map[npc_name], delta, reaction, engine_result["tick"]
            )
            npc_update_outs.append(NPCUpdateOut(
                name=npc_name,
                affection_delta=delta,
                new_relation=result_info["new_relation"],
                reaction_text=reaction,
            ))

    # ── 更新冒險狀態 ────────────────────────────────────────
    state_changes = engine_result.get("state_changes", {})
    adventure.tick = engine_result["tick"]
    adventure.time_of_day = engine_result["time_of_day"]
    adventure.weather = engine_result["weather"]
    adventure.hp = max(0, min(adventure.hp_max, adventure.hp + state_changes.get("hp_delta", 0)))
    adventure.mp = max(0, min(adventure.mp_max, adventure.mp + state_changes.get("mp_delta", 0)))
    adventure.stress = max(0, min(100, adventure.stress + state_changes.get("stress_delta", 0)))
    if state_changes.get("location"):
        adventure.location = state_changes["location"]

    # 更新敘事摘要（保留最近 500 字）
    new_summary = (adventure.narrative_summary or "") + "\n" + engine_result["narrative"]
    adventure.narrative_summary = new_summary[-500:]

    # 死亡判定
    if adventure.hp <= 0:
        adventure.status = AdventureStatus.DEAD

    # ── 記錄 EventLog ───────────────────────────────────────
    event = EventLog(
        adventure_id=adventure.id,
        tick=engine_result["tick"],
        event_type="player_action",
        player_input=payload.free_input or f"選項{payload.choice_index}",
        choices_presented=engine_result.get("choices", []),
        choice_made=payload.choice_index,
        dice_result=engine_result.get("dice_result"),
        narrative_output=engine_result["narrative"],
        state_snapshot={
            "hp": adventure.hp,
            "mp": adventure.mp,
            "stress": adventure.stress,
            "location": adventure.location,
        },
    )
    db.add(event)
    await db.commit()
    await db.refresh(adventure)

    return NarrativeResponse(
        tick=engine_result["tick"],
        narrative=engine_result["narrative"],
        choices=engine_result.get("choices", []),
        state=adventure,
        image_prompt=engine_result.get("image_prompt", ""),
        use_safe_image=engine_result.get("use_safe_image", True),
        dice_detail=engine_result.get("dice_result"),
        npc_updates=npc_update_outs,
    )


# ── 結束冒險（觸發傳承） ───────────────────────────────────────────────────────

@router.post("/adventures/{adventure_id}/end", response_model=LegacyOut)
async def end_adventure(
    adventure_id: uuid.UUID,
    death_cause: str = "主動結束",
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Adventure).where(Adventure.id == adventure_id))
    adventure = result.scalar_one_or_none()
    if not adventure:
        raise HTTPException(status_code=404, detail="冒險不存在")

    adventure.status = AdventureStatus.COMPLETED

    # 建立傳承記錄
    npc_result = await db.execute(
        select(NPCState).where(NPCState.adventure_id == adventure.id)
    )
    npc_states = list(npc_result.scalars().all())

    affection_mods = {n.name: n.affection for n in npc_states if abs(n.affection) > 10}

    legacy = LegacyPool(
        player_id=adventure.player_id,
        source_adventure_id=adventure.id,
        generation=adventure.generation,
        world_type=adventure.world_type,
        personality_tags=adventure.personality_tags or [],
        inherited_skills=[{"skill": s, "level": 1, "decay": 0.8} for s in (adventure.skills or [])],
        affection_modifiers=affection_mods,
        death_cause=death_cause,
        final_narrative=adventure.narrative_summary[-200:],
    )
    db.add(legacy)
    await db.commit()
    await db.refresh(legacy)
    return legacy
