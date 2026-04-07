import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { adventureId, deathCause = "主動結束" } = await req.json();
  const db = getSupabaseAdmin();

  const { data: adventure } = await db
    .from("adventures")
    .select("*")
    .eq("id", adventureId)
    .single();

  if (!adventure) {
    return NextResponse.json({ error: "找不到冒險" }, { status: 404 });
  }

  // 標記完成
  await db
    .from("adventures")
    .update({ status: "completed" })
    .eq("id", adventureId);

  // 載入 NPC 計算好感修正
  const { data: npcs } = await db
    .from("npc_states")
    .select("name, affection, is_alive")
    .eq("adventure_id", adventureId);

  const affectionModifiers: Record<string, number> = {};
  for (const n of npcs ?? []) {
    if (Math.abs(n.affection) > 10) affectionModifiers[n.name] = n.affection;
  }

  // 建立傳承記錄
  const { data: legacy, error } = await db
    .from("legacy_pool")
    .insert({
      player_id: adventure.player_id,
      source_adventure_id: adventure.id,
      generation: adventure.generation,
      world_type: adventure.world_type,
      personality_tags: adventure.personality_tags ?? [],
      inherited_skills: (adventure.skills ?? []).map((s: string) => ({
        skill: s, level: 1, decay: 0.8,
      })),
      affection_modifiers: affectionModifiers,
      death_cause: deathCause,
      final_narrative: (adventure.narrative_summary ?? "").slice(-200),
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: "建立傳承失敗" }, { status: 500 });
  }

  return NextResponse.json(legacy);
}
