export type GamePhase = "setup" | "playing";

export type WorldPreset = "urban_fantasy" | "xianxia" | "school_mystery" | "custom";

export interface PlayerProfile {
  name: string;
  premise: string;
  world: WorldPreset;
}

export interface StatBlock {
  focus: number;
  nerve: number;
  luck: number;
}

export interface StoryChoice {
  id: string;
  label: string;
  intent: string;
}

export interface StoryEntry {
  id: string;
  speaker: "system" | "player" | "story";
  text: string;
}

export interface AdventureState {
  phase: GamePhase;
  turn: number;
  profile: PlayerProfile;
  location: string;
  mood: string;
  stats: StatBlock;
  memory: string[];
  entries: StoryEntry[];
  choices: StoryChoice[];
}

export interface AdventureRequest {
  state: AdventureState;
  action: string;
}

export interface AdventureResponse {
  state: AdventureState;
}
