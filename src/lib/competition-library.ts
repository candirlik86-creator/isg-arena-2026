"use client";

import { cloneFlowItem, generatePin, type ContentFlowItem, type GameSettings, type GameState } from "./game-state";
import { normalizeGameState } from "./game-state-normalizer";

export type SavedCompetition = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  settings: GameSettings;
  flowItems: ContentFlowItem[];
};

type CompetitionLibraryStore = {
  version: 1;
  entries: SavedCompetition[];
};

const LIBRARY_STORAGE_KEY = "isg-arena-2026-competition-library-v1";

function createEntryId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `competition-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readLibraryStore(): CompetitionLibraryStore {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return { version: 1, entries: [] };
  }

  const rawValue = window.localStorage.getItem(LIBRARY_STORAGE_KEY);
  if (!rawValue) {
    return { version: 1, entries: [] };
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<CompetitionLibraryStore>;
    if (!Array.isArray(parsed.entries)) {
      return { version: 1, entries: [] };
    }

    return {
      version: 1,
      entries: parsed.entries.filter((entry): entry is SavedCompetition => {
        return Boolean(
          entry &&
            typeof entry === "object" &&
            typeof entry.id === "string" &&
            typeof entry.name === "string" &&
            typeof entry.createdAt === "number" &&
            typeof entry.updatedAt === "number" &&
            entry.settings &&
            Array.isArray(entry.flowItems),
        );
      }),
    };
  } catch {
    return { version: 1, entries: [] };
  }
}

function writeLibraryStore(store: CompetitionLibraryStore) {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return;
  }

  window.localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(store));
}

export function listSavedCompetitions(): SavedCompetition[] {
  return [...readLibraryStore().entries].sort((left, right) => right.updatedAt - left.updatedAt);
}

export function loadSavedCompetition(id: string): SavedCompetition | null {
  return readLibraryStore().entries.find((entry) => entry.id === id) ?? null;
}

export function saveCurrentCompetition(state: GameState, name: string): SavedCompetition {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Yarışma adı boş olamaz.");
  }

  const now = Date.now();
  const entry: SavedCompetition = {
    id: createEntryId(),
    name: trimmedName,
    createdAt: now,
    updatedAt: now,
    settings: { ...state.settings },
    flowItems: state.flowItems.map((item) => cloneFlowItem(item)),
  };

  const store = readLibraryStore();
  writeLibraryStore({
    version: 1,
    entries: [entry, ...store.entries],
  });

  return entry;
}

export function createGameStateFromSavedCompetition(saved: SavedCompetition): GameState {
  return normalizeGameState({
    version: 2,
    settings: {
      ...saved.settings,
      gamePin: generatePin(),
    },
    flowItems: saved.flowItems.map((item) => cloneFlowItem(item)),
    phase: "lobby",
    activeItemIndex: 0,
    activeItemStartedAt: null,
    answersLocked: false,
    showCorrectAnswer: false,
    teams: [],
    responses: {},
  });
}
