import { createInitialGameState } from "@/lib/game-state";
import type { GameState } from "@/lib/game-state";
import { normalizeGameState } from "@/lib/game-state-normalizer";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GAME_STATE_KEY = "default";

type SupabaseGameStateRow = {
  key: string;
  state_json: unknown;
  updated_at?: string;
};

function getHeaders() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };
}

function getTableUrl() {
  if (!SUPABASE_URL) {
    return null;
  }

  return `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/game_states`;
}

export function canUseSupabaseGameState() {
  return Boolean(getTableUrl() && getHeaders());
}

export async function readSupabaseGameState(): Promise<GameState> {
  const tableUrl = getTableUrl();
  const headers = getHeaders();

  if (!tableUrl || !headers) {
    throw new Error("Supabase yapılandırması eksik.");
  }

  const response = await fetch(`${tableUrl}?key=eq.${encodeURIComponent(GAME_STATE_KEY)}&select=state_json&limit=1`, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase read error (${response.status}): ${errorText || "unknown error"}`);
  }

  const rows = (await response.json()) as SupabaseGameStateRow[];
  const stateJson = rows[0]?.state_json;

  if (!stateJson) {
    const initialState = normalizeGameState(createInitialGameState());
    await writeSupabaseGameState(initialState);
    return initialState;
  }

  return normalizeGameState(stateJson);
}

export async function writeSupabaseGameState(state: unknown): Promise<GameState> {
  const tableUrl = getTableUrl();
  const headers = getHeaders();

  if (!tableUrl || !headers) {
    throw new Error("Supabase yapılandırması eksik.");
  }

  const normalizedState = normalizeGameState(state);

  const response = await fetch(`${tableUrl}?on_conflict=key`, {
    method: "POST",
    headers: {
      ...headers,
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify([
      {
        key: GAME_STATE_KEY,
        state_json: normalizedState,
      },
    ]),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase write error (${response.status}): ${errorText || "unknown error"}`);
  }

  const rows = (await response.json()) as SupabaseGameStateRow[];
  return normalizeGameState(rows[0]?.state_json ?? normalizedState);
}
