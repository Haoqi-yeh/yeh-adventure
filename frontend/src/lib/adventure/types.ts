export type GamePhase = "setup" | "playing";

export type Gender = "male" | "female" | "unspecified";

export type Origin = "wandering" | "fallen_clan" | "outer_disciple" | "hidden_bloodline";

export type Destiny = "sword" | "alchemy" | "formation" | "beast_taming";

export interface PlayerProfile {
  name: string;
  premise: string;
  gender: Gender;
  origin: Origin;
  destiny: Destiny;
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
