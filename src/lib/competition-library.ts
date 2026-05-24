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

async function requestCompetitionApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/competitions${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const body = (await response.json()) as { ok?: boolean; message?: string; data?: T };

  if (!response.ok || !body.ok) {
    throw new Error(body.message ?? "Yarışma kütüphanesi işlemi başarısız.");
  }

  if (typeof body.data === "undefined") {
    throw new Error("Sunucudan geçerli yarışma verisi alınamadı.");
  }

  return body.data;
}

export async function listSavedCompetitions(): Promise<SavedCompetition[]> {
  return requestCompetitionApi<SavedCompetition[]>("?scope=active");
}

export async function listTrashedCompetitions(): Promise<SavedCompetition[]> {
  return requestCompetitionApi<SavedCompetition[]>("?scope=trash");
}

export async function loadSavedCompetition(id: string): Promise<SavedCompetition | null> {
  const records = await requestCompetitionApi<SavedCompetition[]>(`?id=${encodeURIComponent(id)}`);
  return records[0] ?? null;
}

export async function saveCurrentCompetition(state: GameState, name: string, existingId?: string): Promise<SavedCompetition> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Yarışma adı boş olamaz.");
  }

  return requestCompetitionApi<SavedCompetition>("", {
    method: existingId ? "PATCH" : "POST",
    body: JSON.stringify({
      id: existingId,
      name: trimmedName,
      settings: state.settings,
      flowItems: state.flowItems,
    }),
  });
}

export async function duplicateSavedCompetition(id: string): Promise<SavedCompetition> {
  return requestCompetitionApi<SavedCompetition>("/duplicate", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

export async function moveSavedCompetitionToTrash(id: string): Promise<void> {
  await requestCompetitionApi<{ id: string }>("/trash", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

export async function restoreSavedCompetition(id: string): Promise<void> {
  await requestCompetitionApi<{ id: string }>("/restore", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

export async function permanentlyDeleteSavedCompetition(id: string): Promise<void> {
  await requestCompetitionApi<{ id: string }>(`?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
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
