import type {
  AdventureRow,
  NarrativeResponse,
  StartAdventureRequest,
  PlayerActionRequest,
  LegacyRow,
} from "@/lib/game/types";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "請求失敗");
  }
  return res.json();
}

export const createAdventure = (payload: StartAdventureRequest) =>
  post<AdventureRow>("/api/game/start", payload);

export const sendPlayerAction = (payload: PlayerActionRequest) =>
  post<NarrativeResponse>("/api/game/action", payload);

export const endAdventure = (adventureId: string, deathCause?: string) =>
  post<LegacyRow>("/api/game/end", { adventureId, deathCause });
