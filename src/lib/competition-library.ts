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
  deletedAt?: number;
};

type CompetitionLibraryStore = {
  version: 1;
  entries: SavedCompetition[];
};

const LIBRARY_STORAGE_KEY = "isg-arena-2026-competition-library-v1";
const LEGACY_DEMO_SEEDED_STORAGE_KEY = "isg-arena-2026-demo-competition-seeded-v1";
const LEGACY_DEMO_COMPETITION_ID = "sample-isg-competition";

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

    const entries = parsed.entries.filter((entry): entry is SavedCompetition => {
      return Boolean(
        entry &&
          typeof entry === "object" &&
          typeof entry.id === "string" &&
          typeof entry.name === "string" &&
          typeof entry.createdAt === "number" &&
          typeof entry.updatedAt === "number" &&
          (typeof entry.deletedAt === "undefined" || typeof entry.deletedAt === "number") &&
          entry.settings &&
          Array.isArray(entry.flowItems),
      );
    });

    if (window.localStorage.getItem(LEGACY_DEMO_SEEDED_STORAGE_KEY) === "1") {
      const filteredEntries = entries.filter((entry) => entry.id !== LEGACY_DEMO_COMPETITION_ID);
      const migratedStore = { version: 1 as const, entries: filteredEntries };
      writeLibraryStore(migratedStore);
      window.localStorage.removeItem(LEGACY_DEMO_SEEDED_STORAGE_KEY);
      return migratedStore;
    }

    return {
      version: 1,
      entries,
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
  return readLibraryStore().entries.filter((entry) => !entry.deletedAt).sort((left, right) => right.updatedAt - left.updatedAt);
}

export function listTrashedCompetitions(): SavedCompetition[] {
  return readLibraryStore().entries.filter((entry) => entry.deletedAt).sort((left, right) => (right.deletedAt ?? 0) - (left.deletedAt ?? 0));
}

export function loadSavedCompetition(id: string): SavedCompetition | null {
  return readLibraryStore().entries.find((entry) => entry.id === id && !entry.deletedAt) ?? null;
}

export function saveCurrentCompetition(state: GameState, name: string, existingId?: string): SavedCompetition {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Yarışma adı boş olamaz.");
  }

  const now = Date.now();
  const store = readLibraryStore();

  if (existingId) {
    const existing = store.entries.find((entry) => entry.id === existingId && !entry.deletedAt);
    if (existing) {
      const updatedEntry: SavedCompetition = {
        ...existing,
        name: trimmedName,
        updatedAt: now,
        settings: { ...state.settings },
        flowItems: state.flowItems.map((item) => cloneFlowItem(item)),
      };

      writeLibraryStore({
        version: 1,
        entries: store.entries.map((entry) => (entry.id === existingId ? updatedEntry : entry)),
      });

      return updatedEntry;
    }
  }

  const entry: SavedCompetition = {
    id: createEntryId(),
    name: trimmedName,
    createdAt: now,
    updatedAt: now,
    settings: { ...state.settings },
    flowItems: state.flowItems.map((item) => cloneFlowItem(item)),
  };

  writeLibraryStore({
    version: 1,
    entries: [entry, ...store.entries],
  });

  return entry;
}

export function duplicateSavedCompetition(id: string): SavedCompetition {
  const store = readLibraryStore();
  const source = store.entries.find((entry) => entry.id === id && !entry.deletedAt);

  if (!source) {
    throw new Error("Kayıtlı yarışma bulunamadı.");
  }

  const now = Date.now();
  const entry: SavedCompetition = {
    id: createEntryId(),
    name: source.name.endsWith(" Kopya") ? source.name : `${source.name} Kopya`,
    createdAt: now,
    updatedAt: now,
    settings: { ...source.settings },
    flowItems: source.flowItems.map((item) => cloneFlowItem(item)),
  };

  writeLibraryStore({
    version: 1,
    entries: [entry, ...store.entries],
  });

  return entry;
}

export function moveSavedCompetitionToTrash(id: string) {
  const store = readLibraryStore();
  const now = Date.now();

  writeLibraryStore({
    version: 1,
    entries: store.entries.map((entry) =>
      entry.id === id
        ? {
            ...entry,
            deletedAt: now,
            updatedAt: now,
          }
        : entry,
    ),
  });
}

export function restoreSavedCompetition(id: string) {
  const store = readLibraryStore();
  const now = Date.now();

  writeLibraryStore({
    version: 1,
    entries: store.entries.map((entry) => {
      if (entry.id !== id) {
        return entry;
      }

      const { deletedAt: _deletedAt, ...restoredEntry } = entry;
      return {
        ...restoredEntry,
        updatedAt: now,
      };
    }),
  });
}

export function permanentlyDeleteSavedCompetition(id: string) {
  const store = readLibraryStore();
  writeLibraryStore({
    version: 1,
    entries: store.entries.filter((entry) => entry.id !== id),
  });
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
