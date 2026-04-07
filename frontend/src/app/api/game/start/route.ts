import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { StartAdventureRequest, AdventureRow } from "@/lib/game/types";

export async function POST(req: NextRequest) {
  const body: StartAdventureRequest = await req.json();
  const { playerName, worldType, inheritLegacyId } = body;
  const db = getSupabaseAdmin();

  if (!playerName?.trim()) {
    return NextResponse.json({ error: "請填入角色名稱" }, { status: 400 });
  }

  // 取得或建立玩家
  let playerId: string;
  const { data: existing } = await db
    .from("players")
    .select("id")
    .eq("username", playerName.trim())
    .single();

  if (existing) {
    playerId = existing.id;
  } else {
    const { data: newPlayer, error } = await db
      .from("players")
      .insert({ username: playerName.trim() })
      .select("id")
      .single();
    if (error || !newPlayer) {
      return NextResponse.json({ error: "建立玩家失敗" }, { status: 500 });
    }
    playerId = newPlayer.id;
  }

  // 處理傳承
  let legacyModifiers: Record<string, unknown> = {};
  let generation = 1;

  if (inheritLegacyId) {
    const { data: legacy } = await db
      .from("legacy_pool")
      .select("*")
      .eq("id", inheritLegacyId)
      .eq("player_id", playerId)
      .single();

    if (legacy) {
      generation = legacy.generation + 1;
      const skillBonus: Record<string, number> = {};
      for (const s of (legacy.inherited_skills ?? [])) {
        skillBonus[s.skill] = Math.round(s.level * (s.decay ?? 0.8));
      }
      legacyModifiers = {
        affection_bonus: legacy.affection_modifiers ?? {},
        skill_bonus: skillBonus,
      };
    }
  }

  // 建立冒險
  const { data: adventure, error } = await db
    .from("adventures")
    .insert({
      player_id: playerId,
      world_type: worldType,
      generation,
      legacy_modifiers: legacyModifiers,
    })
    .select("*")
    .single();

  if (error || !adventure) {
    return NextResponse.json({ error: "建立冒險失敗" }, { status: 500 });
  }

  return NextResponse.json(adventure as AdventureRow, { status: 201 });
}
