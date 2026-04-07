"""
NPC 靈魂系統
- 記憶管理（記仇/報恩）
- 好感度計算
- 跨回合緩存池更新
"""
from typing import Any
from app.models.game import NPCRelation, NPCState

RELATION_THRESHOLDS = [
    (60,  NPCRelation.ROMANTIC),
    (30,  NPCRelation.FRIENDLY),
    (-20, NPCRelation.NEUTRAL),
    (-50, NPCRelation.HOSTILE),
    (-80, NPCRelation.VENDETTA),
]


def affection_to_relation(affection: int) -> NPCRelation:
    for threshold, relation in RELATION_THRESHOLDS:
        if affection >= threshold:
            return relation
    return NPCRelation.VENDETTA


def apply_affection_delta(npc: NPCState, delta: int, event_desc: str, tick: int) -> dict[str, Any]:
    """更新 NPC 好感度並記錄記憶"""
    old_affection = npc.affection
    new_affection = max(-100, min(100, old_affection + delta))
    old_relation = npc.relation
    new_relation = affection_to_relation(new_affection)

    npc.affection = new_affection
    npc.relation = new_relation

    # 追加記憶（保留最近 20 筆）
    memory_entry = {
        "tick": tick,
        "event": event_desc,
        "impact": delta,
        "affection_after": new_affection,
    }
    memory_log = list(npc.memory_log or [])
    memory_log.append(memory_entry)
    npc.memory_log = memory_log[-20:]

    return {
        "npc_name": npc.name,
        "affection_delta": delta,
        "old_affection": old_affection,
        "new_affection": new_affection,
        "old_relation": old_relation,
        "new_relation": new_relation,
        "relation_changed": old_relation != new_relation,
    }


def build_npc_context_for_prompt(npc_states: list[NPCState]) -> str:
    """將 NPC 狀態格式化為 System Prompt 可讀的文字"""
    if not npc_states:
        return "目前沒有已知的 NPC。"

    lines = []
    for npc in npc_states:
        alive_str = "（存活）" if npc.is_alive else "【已死亡】"
        rel_map = {
            NPCRelation.NEUTRAL:  "普通",
            NPCRelation.FRIENDLY: "友善",
            NPCRelation.ROMANTIC: "曖昧/愛慕",
            NPCRelation.HOSTILE:  "敵意",
            NPCRelation.VENDETTA: "不死不休",
        }
        relation_str = rel_map.get(npc.relation, "未知")

        # 取最近 3 筆記憶摘要
        recent_memories = (npc.memory_log or [])[-3:]
        mem_str = "；".join([m["event"] for m in recent_memories]) or "無特殊記憶"

        lines.append(
            f"- {npc.name}{alive_str} | 好感度：{npc.affection:+d} | 關係：{relation_str}"
            f"\n  近期記憶：{mem_str}"
        )
    return "\n".join(lines)


def prepare_npc_for_cache(npc: NPCState, generation: int) -> dict[str, Any]:
    """將存活 NPC 準備為緩存資料"""
    return {
        "name": npc.name,
        "archetype": npc.archetype,
        "last_affection": npc.affection,
        "last_relation": npc.relation,
        "cumulative_memory": list(npc.memory_log or []),
        "last_seen_generation": generation,
        "personality": npc.personality or {},
    }
