import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rollDice } from "@/lib/game/dice";
import { advanceTick, rollWeather, shouldChangeWeather, getEnvDescription } from "@/lib/game/time";
import { buildNPCContext, applyAffectionDelta } from "@/lib/game/npc";
import { buildSystemPrompt } from "@/lib/game/prompt";
import { getActiveGate, causalityTriggerTick } from "@/lib/game/progression";
import type { CausalityTag } from "@/lib/game/progression";
import type {
  PlayerActionRequest, NarrativeResponse, AdventureRow, NPCStateRow, NPCUpdate,
} from "@/lib/game/types";

// Extend Vercel / Next.js serverless function timeout to 60 s
export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
const encoder = new TextEncoder();

// ── NDJSON helpers ────────────────────────────────────────────────────────────
function chunk(obj: unknown) {
  return encoder.encode(JSON.stringify(obj) + "\n");
}

export async function POST(req: NextRequest) {
  const body: PlayerActionRequest = await req.json();
  const { adventureId, choiceIndex, freeInput, previousChoices } = body;
  const db = getSupabaseAdmin();

  // ── Parallel initial DB fetch ─────────────────────────────────────────────
  const [adventureRes, npcRes] = await Promise.all([
    db.from("adventures").select("*, players(username)").eq("id", adventureId).single(),
    db.from("npc_states").select("*").eq("adventure_id", adventureId),
  ]);

  if (adventureRes.error || !adventureRes.data) {
    return new Response(
      JSON.stringify({ error: "找不到冒險" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }
  const adventure = adventureRes.data as AdventureRow & { players?: { username: string } };
  const playerName = adventure.players?.username ?? "你";
  if (adventure.status !== "active") {
    return new Response(
      JSON.stringify({ error: "此冒險已結束" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  const npcs: NPCStateRow[] = npcRes.data ?? [];

  // ── Game logic ────────────────────────────────────────────────────────────
  const avgAffection = npcs.length
    ? Math.round(npcs.reduce((s, n) => s + n.affection, 0) / npcs.length)
    : 0;
  const hpRatio = adventure.hp_max > 0 ? adventure.hp / adventure.hp_max : 0;
  const diceResult = rollDice({
    affection: avgAffection, hpRatio, stress: adventure.stress, charisma: adventure.charisma,
    weather: adventure.weather, timeOfDay: adventure.time_of_day, worldBonus: getWorldBonus(adventure),
  });

  const { newTick, timeOfDay } = advanceTick(adventure.tick);
  const weather = shouldChangeWeather(newTick) ? rollWeather(adventure.weather) : adventure.weather;
  const envDesc = getEnvDescription(timeOfDay, weather);

  // ── Causality & Progression ───────────────────────────────────────────────
  const worldAttrs = (adventure.world_attributes ?? {}) as Record<string, unknown>;
  const effectiveWorldType = (worldAttrs.world_flavor as string) ?? adventure.world_type;
  const causalityTags = (worldAttrs.causality_tags ?? []) as CausalityTag[];
  const progressionStage = (worldAttrs.progression_stage as number) ?? 0;

  // Find causality events that should now fire
  const nowTriggered = causalityTags.filter(
    (t) => !t.triggered && newTick >= t.triggerAtTick
  );

  // Check if a progression gate is currently active
  const activeGate = getActiveGate(effectiveWorldType, progressionStage, newTick);

  const systemPrompt = buildSystemPrompt({
    worldType: adventure.world_type,
    playerName,
    narrativeHint: diceResult.narrativeHint,
    hp: adventure.hp, hpMax: adventure.hp_max,
    mp: adventure.mp, mpMax: adventure.mp_max,
    stress: adventure.stress, charisma: adventure.charisma,
    tick: newTick, timeOfDay, weather, location: adventure.location,
    envDesc, npcContext: buildNPCContext(npcs),
    personalityTags: adventure.personality_tags ?? [],
    skills: adventure.skills ?? [],
    worldAttributes: adventure.world_attributes ?? {},
    legacyModifiers: adventure.legacy_modifiers ?? {},
    narrativeSummary: adventure.narrative_summary ?? "",
    generation: adventure.generation,
    triggeredCausality: nowTriggered,
    activeGate,
  });

  let userMsg = "開始這段冒險。";
  if (choiceIndex != null && previousChoices?.[choiceIndex]) {
    userMsg = `我選擇：${previousChoices[choiceIndex]}`;
  } else if (freeInput) {
    userMsg = `我的行動：${freeInput}`;
  }

  // ── Streaming response ────────────────────────────────────────────────────
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // gemini-2.5-flash + thinkingBudget:0 → disable thinking mode for fast first token
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          systemInstruction: systemPrompt,
        });

        const geminiStream = await model.generateContentStream({
          contents: [{ role: "user", parts: [{ text: userMsg }] }],
          generationConfig: {
            maxOutputTokens: 2500,
            temperature: 0.92,
            // @ts-expect-error thinkingConfig is valid but not yet in SDK types
            thinkingConfig: { thinkingBudget: 0 },
          },
        });

        // ── Stream narrative tokens ──
        let accumulated = "";
        let sentUpTo = 0;
        let inJson = false;

        for await (const chk of geminiStream.stream) {
          const text = chk.text();
          accumulated += text;

          if (!inJson) {
            const jsonIdx = accumulated.indexOf("```json");
            if (jsonIdx !== -1) {
              inJson = true;
              const remaining = accumulated.slice(sentUpTo, jsonIdx).trimEnd();
              if (remaining) {
                controller.enqueue(chunk({ t: "n", v: remaining }));
              }
            } else {
              const unsent = accumulated.slice(sentUpTo);
              if (unsent) {
                controller.enqueue(chunk({ t: "n", v: unsent }));
                sentUpTo = accumulated.length;
              }
            }
          }
        }

        // ── Parse full LLM output ──
        const parsed = parseLLMResponse(accumulated);

        // ── Parallel NPC updates ──
        const npcMap = new Map(npcs.map(n => [n.name, n]));
        const npcUpdates: NPCUpdate[] = [];
        const npcWritePromises: PromiseLike<unknown>[] = [];

        for (const upd of parsed.npcUpdates) {
          const npc = npcMap.get(upd.name);
          if (!npc) continue;
          const { updatedNPC, newRelation } = applyAffectionDelta(npc, upd.affectionDelta, upd.reactionText, newTick);
          npcWritePromises.push(
            db.from("npc_states").update({
              affection: updatedNPC.affection,
              relation: updatedNPC.relation,
              memory_log: updatedNPC.memory_log,
            }).eq("id", npc.id)
          );
          npcUpdates.push({ ...upd, newRelation });
        }

        // ── State calculations ──
        const sc = parsed.stateChanges;
        const newHp    = Math.max(0, Math.min(adventure.hp_max, adventure.hp + (sc.hpDelta ?? 0)));
        const newMp    = Math.max(0, Math.min(adventure.mp_max, adventure.mp + (sc.mpDelta ?? 0)));
        const newStress = Math.max(0, Math.min(100, adventure.stress + (sc.stressDelta ?? 0)));
        const newSummary = ((adventure.narrative_summary ?? "") + "\n" + parsed.narrative).slice(-500);
        const newStatus = newHp <= 0 ? "dead" : "active";

        const currentLust      = (worldAttrs.lust as number) ?? 50;
        const currentWillpower = (worldAttrs.willpower as number) ?? 70;

        // ── Causality: mark triggered tags + add new events from AI ──────────
        const newCausalityEvents = parsed.causalityEvents;
        const updatedCausality: CausalityTag[] = [
          // Mark already-triggered ones
          ...causalityTags.map((t) =>
            nowTriggered.some((nt) => nt.id === t.id) ? { ...t, triggered: true } : t
          ),
          // Add new causality seeds from this turn
          ...newCausalityEvents.map((e, i) => ({
            id: `${newTick}-${i}-${e.npcName}`,
            tick: newTick,
            type: e.type,
            npcName: e.npcName,
            detail: e.detail,
            triggered: false,
            triggerAtTick: causalityTriggerTick(newTick),
          })),
        ];

        // ── Progression: advance stage if gate completed ──────────────────────
        const newProgressionStage =
          parsed.progressionGateComplete && activeGate
            ? progressionStage + 1
            : progressionStage;

        const updatedWorldAttrs = {
          ...worldAttrs,
          lust:             Math.max(0, Math.min(100, currentLust     + (sc.lustDelta ?? 0))),
          willpower:        Math.max(0, Math.min(100, currentWillpower + (sc.willpowerDelta ?? 0))),
          ...(sc.clothingState ? { clothing_state: sc.clothingState } : {}),
          ...(sc.bodyStatus    ? { body_status: sc.bodyStatus }       : {}),
          causality_tags:   updatedCausality,
          progression_stage: newProgressionStage,
        };

        const newLocation = sc.location ?? adventure.location;

        // ── Parallel DB writes ──
        const [updResult, , , refreshResult] = await Promise.all([
          db.from("adventures").update({
            tick: newTick, time_of_day: timeOfDay, weather,
            hp: newHp, mp: newMp, stress: newStress,
            location: newLocation,
            narrative_summary: newSummary,
            status: newStatus,
            world_attributes: updatedWorldAttrs,
          }).eq("id", adventureId).select("*").single(),

          db.from("event_logs").insert({
            adventure_id: adventureId,
            tick: newTick,
            event_type: "player_action",
            player_input: freeInput ?? `選項${choiceIndex}`,
            choices_presented: parsed.choices,
            choice_made: choiceIndex ?? null,
            dice_result: diceResult,
            narrative_output: parsed.narrative,
            state_snapshot: { hp: newHp, mp: newMp, stress: newStress, location: newLocation },
          }),

          Promise.all(npcWritePromises),

          db.from("npc_states").select("*").eq("adventure_id", adventureId),
        ]);

        const response: NarrativeResponse = {
          tick: newTick,
          narrative: parsed.narrative,
          choices: parsed.choices,
          state: ((updResult.data ?? adventure) as AdventureRow),
          imagePrompt: parsed.imagePrompt,
          useSafeImage: parsed.useSafeImage,
          diceDetail: diceResult,
          npcUpdates,
          npcs: (refreshResult.data ?? npcs) as NPCStateRow[],
        };

        controller.enqueue(chunk({ t: "d", v: response }));
        controller.close();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[/api/game/action]", msg);
        controller.enqueue(chunk({ t: "e", v: msg }));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseLLMResponse(raw: string) {
  const match = raw.match(/```json\s*([\s\S]*?)\s*```/);
  let data: Record<string, unknown> = {};
  if (match) {
    try { data = JSON.parse(match[1]); } catch { /* ignore */ }
  }
  const narrativeFromText = match ? raw.slice(0, raw.indexOf(match[0])).trim() : raw.trim();

  return {
    narrative:   (data.narrative as string) || narrativeFromText,
    choices:     (data.choices as string[]) ?? ["繼續前進", "觀察四周", "休息一下"],
    imagePrompt: (data.imagePrompt as string) ?? "Pixel art style, 16-bit, vibrant colors, retro gaming aesthetic, a mysterious scene",
    useSafeImage:(data.useSafeImage as boolean) ?? true,
    npcUpdates:  (data.npcUpdates as { name: string; affectionDelta: number; reactionText: string }[]) ?? [],
    stateChanges:(data.stateChanges as {
      hpDelta?: number; mpDelta?: number; stressDelta?: number;
      lustDelta?: number; willpowerDelta?: number;
      clothingState?: string; bodyStatus?: string;
      location?: string; ticksConsumed?: number;
    }) ?? {},
    causalityEvents: (data.causalityEvents as {
      type: "kill" | "save" | "promise" | "betray" | "humiliate" | "ally";
      npcName: string;
      detail: string;
    }[]) ?? [],
    progressionGateComplete: (data.progressionGateComplete as boolean) ?? false,
  };
}

function getWorldBonus(adventure: AdventureRow): number {
  const attrs = adventure.world_attributes ?? {};
  if (adventure.world_type === "xian_xia")
    return Math.min(((attrs.ling_li as number) ?? 0) / 1000, 0.2);
  if (adventure.world_type === "campus")
    return (((attrs.grades as number) ?? 50) - 50) * 0.001;
  return 0;
}
