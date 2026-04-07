import type { NPCStateRow, NPCRelation, MemoryEntry } from "./types";

const RELATION_THRESHOLDS: [number, NPCRelation][] = [
  [60, "romantic"],
  [30, "friendly"],
  [-20, "neutral"],
  [-50, "hostile"],
  [-80, "vendetta"],
];

export function affectionToRelation(affection: number): NPCRelation {
  for (const [threshold, relation] of RELATION_THRESHOLDS) {
    if (affection >= threshold) return relation;
  }
  return "vendetta";
}

export function applyAffectionDelta(
  npc: NPCStateRow,
  delta: number,
  eventDesc: string,
  tick: number
) {
  const oldAffection = npc.affection;
  const newAffection = Math.max(-100, Math.min(100, oldAffection + delta));
  const oldRelation = npc.relation;
  const newRelation = affectionToRelation(newAffection);

  const entry: MemoryEntry = {
    tick,
    event: eventDesc,
    impact: delta,
    affection_after: newAffection,
  };
  const memoryLog = [...(npc.memory_log ?? []), entry].slice(-20);

  return {
    updatedNPC: { ...npc, affection: newAffection, relation: newRelation, memory_log: memoryLog },
    oldAffection,
    newAffection,
    oldRelation,
    newRelation,
    relationChanged: oldRelation !== newRelation,
  };
}

export function buildNPCContext(npcs: NPCStateRow[]): string {
  if (!npcs.length) return "目前沒有已知的 NPC。";

  const REL_LABEL: Record<NPCRelation, string> = {
    neutral: "普通", friendly: "友善", romantic: "曖昧/愛慕",
    hostile: "敵意", vendetta: "不死不休",
  };

  return npcs.map(npc => {
    const aliveStr = npc.is_alive ? "（存活）" : "【已死亡】";
    const recentMem = (npc.memory_log ?? []).slice(-3).map(m => m.event).join("；") || "無特殊記憶";
    return `- ${npc.name}${aliveStr} | 好感度：${npc.affection > 0 ? "+" : ""}${npc.affection} | 關係：${REL_LABEL[npc.relation]}\n  近期記憶：${recentMem}`;
  }).join("\n");
}
