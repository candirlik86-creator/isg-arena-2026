"use client";

import { buildResultsCsv, createInitialGameState, DEFAULT_SETTINGS, type GameState } from "./game-state";

export type TeamSession = {
  teamId: string;
  gamePin: string;
};

export const GAME_STATE_KEY = "isg-arena-2026-state-v2";
export const TEAM_SESSION_KEY = "isg-arena-2026-team-session-v2";
const GAME_STATE_EVENT = "isg-arena-state-change";

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeGameState(value: unknown): GameState {
  if (!value || typeof value !== "object") {
    return createInitialGameState();
  }

  const candidate = value as Partial<GameState>;
  const activeItemIndex =
    typeof candidate.activeItemIndex === "number" && candidate.activeItemIndex >= 0 ? candidate.activeItemIndex : 0;

  return {
    version: 2,
    settings: {
      ...DEFAULT_SETTINGS,
      ...(candidate.settings ?? {}),
      maxTeams: Number(candidate.settings?.maxTeams ?? DEFAULT_SETTINGS.maxTeams),
      prizeFirst: Number(candidate.settings?.prizeFirst ?? DEFAULT_SETTINGS.prizeFirst),
      prizeSecond: Number(candidate.settings?.prizeSecond ?? DEFAULT_SETTINGS.prizeSecond),
      prizeThird: Number(candidate.settings?.prizeThird ?? DEFAULT_SETTINGS.prizeThird),
      teamSize: Number(candidate.settings?.teamSize ?? DEFAULT_SETTINGS.teamSize),
    },
    phase: candidate.phase ?? "lobby",
    activeItemIndex,
    activeItemStartedAt: candidate.activeItemStartedAt ?? null,
    answersLocked: Boolean(candidate.answersLocked),
    showCorrectAnswer: Boolean(candidate.showCorrectAnswer),
    teams: Array.isArray(candidate.teams) ? candidate.teams : [],
    responses: candidate.responses && typeof candidate.responses === "object" ? candidate.responses : {},
  };
}

function emitGameStateChange() {
  window.dispatchEvent(new Event(GAME_STATE_EVENT));
}

export function loadGameState(): GameState {
  if (!hasStorage()) {
    return createInitialGameState({ gamePin: DEFAULT_SETTINGS.gamePin });
  }

  const rawState = window.localStorage.getItem(GAME_STATE_KEY);

  if (!rawState) {
    const initialState = createInitialGameState();
    window.localStorage.setItem(GAME_STATE_KEY, JSON.stringify(initialState));
    return initialState;
  }

  try {
    return normalizeGameState(JSON.parse(rawState));
  } catch {
    const initialState = createInitialGameState();
    window.localStorage.setItem(GAME_STATE_KEY, JSON.stringify(initialState));
    return initialState;
  }
}

export function saveGameState(state: GameState) {
  if (!hasStorage()) {
    return;
  }

  window.localStorage.setItem(GAME_STATE_KEY, JSON.stringify(state));
  emitGameStateChange();
}

export function subscribeGameState(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === GAME_STATE_KEY) {
      listener();
    }
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(GAME_STATE_EVENT, listener);

  return () => {
    window.removeEventListener("storage", onStorage);
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

export function createTeamId() {
  return `team-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
