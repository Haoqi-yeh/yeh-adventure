import axios from "axios";
import type {
  AdventureState,
  CreateAdventurePayload,
  NarrativeResponse,
  PlayerActionPayload,
} from "@/types/game";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
});

export async function createAdventure(
  payload: CreateAdventurePayload
): Promise<AdventureState> {
  const { data } = await api.post("/game/adventures", payload);
  return data;
}

export async function getAdventure(id: string): Promise<AdventureState> {
  const { data } = await api.get(`/game/adventures/${id}`);
  return data;
}

export async function sendPlayerAction(
  payload: PlayerActionPayload
): Promise<NarrativeResponse> {
  const { data } = await api.post("/game/action", payload);
  return data;
}

export async function endAdventure(id: string, deathCause?: string) {
  const { data } = await api.post(`/game/adventures/${id}/end`, null, {
    params: { death_cause: deathCause || "主動結束" },
  });
  return data;
}
