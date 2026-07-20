"use client";

import { buildResultsCsv, createInitialGameState, DEFAULT_SETTINGS, type GameState } from "./game-state";
import { normalizeGameState } from "./game-state-normalizer";
import type { GameAction, GameActionResult, GameTeamSession } from "./game-actions";

export type TeamSession = GameTeamSession;

export const TEAM_SESSION_KEY = "isg-arena-2026-team-session-v2";
const GAME_STATE_EVENT = "isg-arena-state-change";
const CONNECTION_EVENT = "isg-arena-connection-change";
const GAME_STATE_API_PATH = "/api/game-state";
const CONNECTION_FAILURE_THRESHOLD = 3;

let cachedGameState = createInitialGameState({ gamePin: DEFAULT_SETTINGS.gamePin });
let connectionLost = false;
let consecutiveFetchFailures = 0;

function emitGameStateChange() {
  window.dispatchEvent(new Event(GAME_STATE_EVENT));
}

function setConnectionLost(next: boolean) {
  if (connectionLost === next) {
    return;
  }

  connectionLost = next;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CONNECTION_EVENT));
  }
}

export function getConnectionLost() {
  return connectionLost;
}

export function subscribeConnectionStatus(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(CONNECTION_EVENT, listener);

  return () => {
    window.removeEventListener(CONNECTION_EVENT, listener);
  };
}

export function loadGameState(): GameState {
  return cachedGameState;
}

export function saveGameState(state: GameState) {
  cachedGameState = normalizeGameState(state);

  if (typeof window !== "undefined") {
    emitGameStateChange();
  }
}

export async function fetchGameState(): Promise<GameState> {
  try {
    const response = await fetch(GAME_STATE_API_PATH, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Oyun state'i okunamadı.");
    }

    const body = (await response.json()) as { state?: unknown };
    const nextState = normalizeGameState(body.state);
    saveGameState(nextState);
    consecutiveFetchFailures = 0;
    setConnectionLost(false);
    return nextState;
  } catch (error) {
    consecutiveFetchFailures += 1;
    if (consecutiveFetchFailures >= CONNECTION_FAILURE_THRESHOLD) {
      setConnectionLost(true);
    }
    throw error;
  }
}

export async function replaceGameState(state: GameState): Promise<GameActionResult> {
  try {
    const response = await fetch(GAME_STATE_API_PATH, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ state }),
      cache: "no-store",
    });
    const body = (await response.json()) as Partial<GameActionResult> & { state?: unknown };
    const nextState = normalizeGameState(body.state);
    saveGameState(nextState);

    return {
      ok: Boolean(body.ok),
      state: nextState,
      message: body.message,
    };
  } catch {
    return {
      ok: false,
      state: cachedGameState,
      message: "Oyun sunucusuna bağlanılamadı. Aynı Wi-Fi ve doğru adresi kontrol edin.",
    };
  }
}

export async function dispatchGameAction(action: GameAction): Promise<GameActionResult> {
  try {
    const response = await fetch(GAME_STATE_API_PATH, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action }),
      cache: "no-store",
    });
    const body = (await response.json()) as Partial<GameActionResult> & { state?: unknown };
    const nextState = normalizeGameState(body.state);
    saveGameState(nextState);

    return {
      ok: Boolean(body.ok),
      state: nextState,
      message: body.message,
      teamSession: body.teamSession,
    };
  } catch {
    return {
      ok: false,
      state: cachedGameState,
      message: "Oyun sunucusuna bağlanılamadı. Aynı Wi-Fi ve doğru adresi kontrol edin.",
    };
  }
}

export function subscribeGameState(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(GAME_STATE_EVENT, listener);

  return () => {
    window.removeEventListener(GAME_STATE_EVENT, listener);
  };
}

export function getTeamSession(): TeamSession | null {
  if (typeof window === "undefined" || typeof window.sessionStorage === "undefined") {
    return null;
  }

  const rawSession = window.sessionStorage.getItem(TEAM_SESSION_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    const session = JSON.parse(rawSession) as Partial<TeamSession>;
    return session.teamId && session.gamePin ? { teamId: session.teamId, gamePin: session.gamePin } : null;
  } catch {
    return null;
  }
}

export function saveTeamSession(session: TeamSession) {
  if (typeof window === "undefined" || typeof window.sessionStorage === "undefined") {
    return;
  }

  window.sessionStorage.setItem(TEAM_SESSION_KEY, JSON.stringify(session));
}

export function clearTeamSession() {
  if (typeof window === "undefined" || typeof window.sessionStorage === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(TEAM_SESSION_KEY);
}

export function downloadResultsCsv(state: GameState) {
  const csv = `\uFEFF${buildResultsCsv(state)}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `isg-arena-2026-sonuclar-${state.settings.gamePin}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
