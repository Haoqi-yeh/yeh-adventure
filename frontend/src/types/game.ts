export type WorldType = "xian_xia" | "campus" | "apocalypse" | "adult" | "custom";
export type WeatherType = "clear" | "rain" | "fog" | "thunder";
export type TimeOfDay = "dawn" | "morning" | "noon" | "dusk" | "night";
export type NPCRelation = "neutral" | "friendly" | "romantic" | "hostile" | "vendetta";
export type AdventureStatus = "active" | "completed" | "dead";

export interface AdventureState {
  id: string;
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
}

export interface NPCUpdate {
  name: string;
  affection_delta: number;
  new_relation: NPCRelation;
  reaction_text: string;
}

export interface NarrativeResponse {
  tick: number;
  narrative: string;
  choices: string[];
  state: AdventureState;
  image_prompt: string;
  use_safe_image: boolean;
  dice_detail: Record<string, unknown> | null;
  npc_updates: NPCUpdate[];
}

export interface CreateAdventurePayload {
  world_type: WorldType;
  player_name: string;
  inherit_legacy_id?: string;
}

export interface PlayerActionPayload {
  adventure_id: string;
  choice_index?: number;
  free_input?: string;
}
