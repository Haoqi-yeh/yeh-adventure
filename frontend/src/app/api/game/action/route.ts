import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rollDice } from "@/lib/game/dice";
import { advanceTick, rollWeather, shouldChangeWeather, getEnvDescription } from "@/lib/game/time";
import { buildNPCContext, applyAffectionDelta } from "@/lib/game/npc";
import { buildSystemPrompt } from "@/lib/game/prompt";
import type {
  PlayerActionRequest, NarrativeResponse, AdventureRow, NPCStateRow, NPCUpdate,
} from "@/lib/game/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const body: PlayerActionRequest = await req.json();
  const { adventureId, choiceIndex, freeInput, previousChoices } = body;
  const db = getSupabaseAdmin();

  // ── 載入冒險 ────────────────────────────────────────────────
  const { data: adventure, error: advErr } = await db
    .from("adventures")
    .select("*")
    .eq("id", adventureId)
    .single();

  if (advErr || !adventure) {
    return NextResponse.json({ error: "找不到冒險" }, { status: 404 });
  }
  if (adventure.status !== "active") {
    return NextResponse.json({ error: "此冒險已結束" }, { status: 400 });
  }

  // ── 載入 NPC ────────────────────────────────────────────────
  const { data: npcRows } = await db
    .from("npc_states")
    .select("*")
    .eq("adventure_id", adventureId);
  const npcs: NPCStateRow[] = npcRows ?? [];

  // ── 1. 骰子 ─────────────────────────────────────────────────
  const avgAffection = npcs.length
    ? Math.round(npcs.reduce((s, n) => s + n.affection, 0) / npcs.length)
    : 0;
  const hpRatio = adventure.hp_max > 0 ? adventure.hp / adventure.hp_max : 0;
  const diceResult = rollDice({
    affection: avgAffection,
    hpRatio,
    stress: adventure.stress,
    charisma: adventure.charisma,
    weather: adventure.weather,
    timeOfDay: adventure.time_of_day,
    worldBonus: getWorldBonus(adventure),
  });

  // ── 2. 推進時間 ──────────────────────────────────────────────
  const { newTick, timeOfDay } = advanceTick(adventure.tick);
  const weather = shouldChangeWeather(newTick)
    ? rollWeather(adventure.weather)
    : adventure.weather;
  const envDesc = getEnvDescription(timeOfDay, weather);

  // ── 3. 呼叫 Claude ───────────────────────────────────────────
  const systemPrompt = buildSystemPrompt({
    worldType: adventure.world_type,
    narrativeHint: diceResult.narrativeHint,
    hp: adventure.hp, hpMax: adventure.hp_max,
    mp: adventure.mp, mpMax: adventure.mp_max,
    stress: adventure.stress, charisma: adventure.charisma,
    tick: newTick, timeOfDay, weather,
    location: adventure.location,
    envDesc,
    npcContext: buildNPCContext(npcs),
    personalityTags: adventure.personality_tags ?? [],
    skills: adventure.skills ?? [],
    worldAttributes: adventure.world_attributes ?? {},
    legacyModifiers: adventure.legacy_modifiers ?? {},
    narrativeSummary: adventure.narrative_summary ?? "",
    generation: adventure.generation,
  });

  let userMsg = "開始這段冒險。";
  if (choiceIndex != null && previousChoices?.[choiceIndex]) {
    userMsg = `我選擇：${previousChoices[choiceIndex]}`;
  } else if (freeInput) {
    userMsg = `我的行動：${freeInput}`;
  }

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: userMsg }],
  });

  const rawText = (message.content[0] as { text: string }).text;
  const parsed = parseLLMResponse(rawText);

  // ── 4. 更新 NPC 狀態 ─────────────────────────────────────────
  const npcUpdates: NPCUpdate[] = [];
  const npcMap = new Map(npcs.map(n => [n.name, n]));

  for (const upd of parsed.npcUpdates) {
    const npc = npcMap.get(upd.name);
    if (!npc) continue;
    const { updatedNPC, newRelation } = applyAffectionDelta(
      npc, upd.affectionDelta, upd.reactionText, newTick
    );
    await db
      .from("npc_states")
      .update({
        affection: updatedNPC.affection,
        relation: updatedNPC.relation,
        memory_log: updatedNPC.memory_log,
      })
      .eq("id", npc.id);
    npcUpdates.push({ ...upd, newRelation });
  }

  // ── 5. 更新冒險狀態 ──────────────────────────────────────────
  const sc = parsed.stateChanges;
  const newHp = Math.max(0, Math.min(adventure.hp_max, adventure.hp + (sc.hpDelta ?? 0)));
  const newMp = Math.max(0, Math.min(adventure.mp_max, adventure.mp + (sc.mpDelta ?? 0)));
  const newStress = Math.max(0, Math.min(100, adventure.stress + (sc.stressDelta ?? 0)));
  const newSummary = ((adventure.narrative_summary ?? "") + "\n" + parsed.narrative).slice(-500);
  const newStatus = newHp <= 0 ? "dead" : "active";

  const { data: updatedAdventure } = await db
    .from("adventures")
    .update({
      tick: newTick,
      time_of_day: timeOfDay,
      weather,
      hp: newHp,
      mp: newMp,
      stress: newStress,
      location: sc.location ?? adventure.location,
      narrative_summary: newSummary,
      status: newStatus,
    })
    .eq("id", adventureId)
    .select("*")
    .single();

  // ── 6. 記錄 EventLog ─────────────────────────────────────────
  await db.from("event_logs").insert({
    adventure_id: adventureId,
    tick: newTick,
    event_type: "player_action",
    player_input: freeInput ?? `選項${choiceIndex}`,
    choices_presented: parsed.choices,
    choice_made: choiceIndex ?? null,
    dice_result: diceResult,
    narrative_output: parsed.narrative,
    state_snapshot: { hp: newHp, mp: newMp, stress: newStress, location: sc.location ?? adventure.location },
  });

  const response: NarrativeResponse = {
    tick: newTick,
    narrative: parsed.narrative,
    choices: parsed.choices,
    state: (updatedAdventure ?? adventure) as AdventureRow,
    imagePrompt: parsed.imagePrompt,
    useSafeImage: parsed.useSafeImage,
    diceDetail: diceResult,
    npcUpdates,
  };

  return NextResponse.json(response);
}

// ── 工具函式 ──────────────────────────────────────────────────────────────────

function parseLLMResponse(raw: string) {
  const match = raw.match(/```json\s*([\s\S]*?)\s*```/);
  let data: Record<string, unknown> = {};
  if (match) {
    try { data = JSON.parse(match[1]); } catch { /* ignore */ }
  }
  const narrativeFromText = match ? raw.slice(0, raw.indexOf(match[0])).trim() : raw.trim();

  return {
    narrative: (data.narrative as string) || narrativeFromText,
    choices: (data.choices as string[]) ?? ["繼續前進", "觀察四周", "休息一下"],
    imagePrompt: (data.imagePrompt as string) ?? "Pixel art style, 16-bit, vibrant colors, retro gaming aesthetic, a mysterious scene",
    useSafeImage: (data.useSafeImage as boolean) ?? true,
    npcUpdates: (data.npcUpdates as { name: string; affectionDelta: number; reactionText: string }[]) ?? [],
    stateChanges: (data.stateChanges as {
      hpDelta?: number; mpDelta?: number; stressDelta?: number; location?: string; ticksConsumed?: number;
    }) ?? {},
  };
}

function getWorldBonus(adventure: AdventureRow): number {
  const attrs = adventure.world_attributes ?? {};
  if (adventure.world_type === "xian_xia") {
    return Math.min(((attrs.ling_li as number) ?? 0) / 1000, 0.2);
  }
  if (adventure.world_type === "campus") {
    return (((attrs.grades as number) ?? 50) - 50) * 0.001;
  }
  return 0;
}
