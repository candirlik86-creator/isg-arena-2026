import { createInitialGameState } from "@/lib/game-state";
import type { GameState } from "@/lib/game-state";
import { normalizeGameState } from "@/lib/game-state-normalizer";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GAME_STATE_KEY = "default";
const MAX_MUTATION_RETRIES = 80;

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

function waitForRetry(attempt: number) {
  const delayMs = Math.min(250, 20 + attempt * 6 + Math.floor(Math.random() * 35));
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export async function readSupabaseGameState(): Promise<GameState> {
  return (await readSupabaseGameStateRow()).state;
}

async function readSupabaseGameStateRow(): Promise<{ state: GameState; updatedAt?: string }> {
  const tableUrl = getTableUrl();
  const headers = getHeaders();

  if (!tableUrl || !headers) {
    throw new Error("Supabase yapılandırması eksik.");
  }

  const response = await fetch(`${tableUrl}?key=eq.${encodeURIComponent(GAME_STATE_KEY)}&select=state_json,updated_at&limit=1`, {
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
    return { state: initialState };
  }

  return { state: normalizeGameState(stateJson), updatedAt: rows[0]?.updated_at };
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

export async function mutateSupabaseGameState(
  updater: (state: GameState) => GameState | Promise<GameState>,
): Promise<GameState> {
  const tableUrl = getTableUrl();
  const headers = getHeaders();

  if (!tableUrl || !headers) {
    throw new Error("Supabase yapılandırması eksik.");
  }

  for (let attempt = 0; attempt < MAX_MUTATION_RETRIES; attempt += 1) {
    const { state: currentState, updatedAt } = await readSupabaseGameStateRow();
    const nextState = normalizeGameState(await updater(currentState));
    const nextUpdatedAt = new Date().toISOString();
    const conflictFilter = updatedAt ? `&updated_at=eq.${encodeURIComponent(updatedAt)}` : "";

    const response = await fetch(
      `${tableUrl}?key=eq.${encodeURIComponent(GAME_STATE_KEY)}${conflictFilter}&select=state_json`,
      {
        method: "PATCH",
        headers: {
          ...headers,
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          state_json: nextState,
          updated_at: nextUpdatedAt,
        }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase mutation error (${response.status}): ${errorText || "unknown error"}`);
    }

    const rows = (await response.json()) as SupabaseGameStateRow[];
    if (rows[0]) {
      return normalizeGameState(rows[0].state_json ?? nextState);
    }

    await waitForRetry(attempt);
  }

  throw new Error("Supabase state eşzamanlı güncelleme sınırı aşıldı. Lütfen tekrar deneyin.");
}
