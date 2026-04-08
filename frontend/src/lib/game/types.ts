// ── 核心 Enum ──────────────────────────────────────────────────────────────────

export type WorldType     = "xian_xia" | "campus" | "apocalypse" | "adult" | "custom"
                          | "wuxia" | "western_fantasy" | "cyberpunk" | "horror" | "palace_intrigue" | "wasteland";
export type WeatherType   = "clear" | "rain" | "fog" | "thunder";
export type TimeOfDay     = "dawn" | "morning" | "noon" | "dusk" | "night";
export type NPCRelation   = "neutral" | "friendly" | "romantic" | "hostile" | "vendetta";
export type AdventureStatus = "active" | "completed" | "dead";

// ── DB Row 型別（對應 Supabase Schema）────────────────────────────────────────

export interface AdventureRow {
  id: string;
  player_id: string;
  world_type: WorldType;
  status: AdventureStatus;
  generation: number;
  hp: number;
  hp_max: number;
  mp: number;
  mp_max: number;
  stamina: number;
  stress: number;
  charisma: number;
  world_attributes: Record<string, unknown>;
  skills: string[];
  personality_tags: string[];
  tick: number;
  time_of_day: TimeOfDay;
  weather: WeatherType;
  location: string;
  narrative_summary: string;
  legacy_modifiers: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface NPCStateRow {
  id: string;
  adventure_id: string;
  npc_cache_id: string | null;
  name: string;
  archetype: string;
  affection: number;
  relation: NPCRelation;
  is_alive: boolean;
  memory_log: MemoryEntry[];
  personality: Record<string, unknown>;
}

export interface MemoryEntry {
  tick: number;
  event: string;
  impact: number;
  affection_after: number;
}

export interface LegacyRow {
  id: string;
  player_id: string;
  source_adventure_id: string;
  generation: number;
  world_type: WorldType;
  personality_tags: string[];
  inherited_skills: InheritedSkill[];
  affection_modifiers: Record<string, number>;
  special_abilities: SpecialAbility[];
  death_cause: string;
  final_narrative: string;
  created_at: string;
}

export interface InheritedSkill {
  skill: string;
  level: number;
  decay: number;
}

export interface SpecialAbility {
  name: string;
  description: string;
  source: string;
}

// ── API 請求/回應 型別 ────────────────────────────────────────────────────────

export interface StartAdventureRequest {
  playerName: string;
  worldType: WorldType;
  characterBio?: string;
  writingStyle?: string;
  inheritLegacyId?: string;
}

export interface PlayerActionRequest {
  adventureId: string;
  choiceIndex?: number;
  freeInput?: string;
  previousChoices?: string[];
}

export interface NPCUpdate {
  name: string;
  affectionDelta: number;
  newRelation: NPCRelation;
  reactionText: string;
}

export interface NarrativeResponse {
  tick: number;
  narrative: string;
  choices: string[];
  state: AdventureRow;
  imagePrompt: string;
  useSafeImage: boolean;
  diceDetail: DiceDetail | null;
  npcUpdates: NPCUpdate[];
  npcs: NPCStateRow[];
}

export interface DiceDetail {
  baseRate: number;
  finalRate: number;
  roll: number;
  success: boolean;
  narrativeHint: NarrativeHint;
  modifiers: { source: string; value: number }[];
}

export type NarrativeHint =
  | "CRITICAL_HP"
  | "CRITICAL_FAIL"
  | "CRITICAL_SUCCESS"
  | "HIGH_STRESS"
  | "NORMAL";
