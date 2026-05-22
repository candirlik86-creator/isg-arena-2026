import { resolveBrandSettings } from "./brand-theme";
import {
  answerIds,
  createInitialFlowItems,
  createInitialGameState,
  DEFAULT_SETTINGS,
  inferMediaType,
  pruneResponsesForFlowItems,
  type AnswerId,
  type ContentFlowItem,
  type GamePhase,
  type GameSettings,
  type GameState,
  type TeamResponses,
} from "./game-state";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asPositiveNumber(value: unknown, fallback: number) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

function asOptionalPositiveNumber(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : undefined;
}

function createSafeId(type: ContentFlowItem["type"], usedIds: Set<string>, requestedId: unknown) {
  const baseId = asString(requestedId).trim();
  const prefixByType: Record<ContentFlowItem["type"], string> = {
    quiz: "quiz",
    infoSlide: "info",
    mediaSlide: "media",
    forkliftChallenge: "forklift",
  };
  let nextId = baseId || `${prefixByType[type]}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  while (usedIds.has(nextId)) {
    nextId = `${prefixByType[type]}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  usedIds.add(nextId);
  return nextId;
}

function isAnswerId(value: unknown): value is AnswerId {
  return answerIds.includes(value as AnswerId);
}

function normalizeFlowItem(value: unknown, usedIds: Set<string>, quizNumber: number): ContentFlowItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const type = value.type;

  if (type === "quiz") {
    const rawOptions = Array.isArray(value.options) ? value.options : [];
    const options = answerIds.map((id) => {
      const rawOption = rawOptions.find((option) => isRecord(option) && option.id === id);
      return {
        id,
        text: isRecord(rawOption) ? asString(rawOption.text, `${id} seçeneği`) : `${id} seçeneği`,
      };
    });

    return {
      id: createSafeId("quiz", usedIds, value.id),
      type: "quiz",
      quizNumber: Math.max(1, Math.round(Number(value.quizNumber ?? quizNumber) || quizNumber)),
      title: asString(value.title, "Adsız quiz"),
      topic: asString(value.topic ?? value.category, "Genel"),
      category: asString(value.category),
      stage: asString(value.stage, "Quiz"),
      imageUrl: asString(value.imageUrl) || undefined,
      timeLimitSeconds: asPositiveNumber(value.timeLimitSeconds, 30),
      maxScore: asPositiveNumber(value.maxScore, 1000),
      options,
      correctOptionId: isAnswerId(value.correctOptionId) ? value.correctOptionId : "A",
      explanation: asString(value.explanation) || undefined,
    };
  }

  if (type === "infoSlide") {
    return {
      id: createSafeId("infoSlide", usedIds, value.id),
      type: "infoSlide",
      title: asString(value.title, "Adsız bilgi slaytı"),
      category: asString(value.category),
      description: asString(value.description),
      imageUrl: asString(value.imageUrl) || undefined,
      timeLimitSeconds: asOptionalPositiveNumber(value.timeLimitSeconds),
    };
  }

  if (type === "mediaSlide") {
    const mediaUrl = asString(value.mediaUrl);
    const mediaType = value.mediaType === "youtube" || value.mediaType === "image" ? value.mediaType : inferMediaType(mediaUrl);

    return {
      id: createSafeId("mediaSlide", usedIds, value.id),
      type: "mediaSlide",
      title: asString(value.title, "Adsız medya slaytı"),
      category: asString(value.category),
      mediaType,
      mediaUrl,
      description: asString(value.description),
      timeLimitSeconds: asOptionalPositiveNumber(value.timeLimitSeconds),
      uploadedImageDataUrl: asString(value.uploadedImageDataUrl) || undefined,
    };
  }

  if (type === "forkliftChallenge") {
    return {
      id: createSafeId("forkliftChallenge", usedIds, value.id),
      type: "forkliftChallenge",
      title: asString(value.title, "Forklift Etabı"),
      category: asString(value.category, "Final"),
      description: asString(value.description),
      timeLimitSeconds: asPositiveNumber(value.timeLimitSeconds, 60),
      maxScore: asPositiveNumber(value.maxScore, 1000),
      message: asString(value.message, "Hızlı olan değil, güvenli süren kazanır."),
    };
  }

  return null;
}

function normalizeFlowItems(value: unknown, fallback: ContentFlowItem[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const usedIds = new Set<string>();
  let quizNumber = 1;

  return value.flatMap((item) => {
    const normalizedItem = normalizeFlowItem(item, usedIds, quizNumber);

    if (normalizedItem?.type === "quiz") {
      quizNumber += 1;
    }

    return normalizedItem ? [normalizedItem] : [];
  });
}

function isGamePhase(value: unknown): value is GamePhase {
  return (
    value === "lobby" ||
    value === "quizIntro" ||
    value === "quiz" ||
    value === "infoSlide" ||
    value === "mediaSlide" ||
    value === "leaderboard" ||
    value === "forkliftChallenge" ||
    value === "finished"
  );
}

export function normalizeGameState(value: unknown): GameState {
  if (!value || typeof value !== "object") {
    return createInitialGameState();
  }

  const candidate = value as Partial<GameState>;
  const flowItems = Array.isArray(candidate.flowItems)
    ? normalizeFlowItems(candidate.flowItems, [])
    : createInitialFlowItems();
  const activeItemIndex =
    typeof candidate.activeItemIndex === "number" && candidate.activeItemIndex >= 0 && flowItems.length
      ? Math.min(candidate.activeItemIndex, flowItems.length - 1)
      : 0;
  const phase = flowItems.length ? (isGamePhase(candidate.phase) ? candidate.phase : "lobby") : "lobby";
  const responses =
    candidate.responses && typeof candidate.responses === "object" ? (candidate.responses as Record<string, TeamResponses>) : {};

  const rawSettings = (candidate.settings ?? {}) as Partial<GameSettings>;

  return {
    version: 2,
    settings: resolveBrandSettings({
      ...DEFAULT_SETTINGS,
      ...rawSettings,
      welcomeTitle: typeof rawSettings.welcomeTitle === "string" ? rawSettings.welcomeTitle : DEFAULT_SETTINGS.welcomeTitle,
      subtitle: typeof rawSettings.subtitle === "string" ? rawSettings.subtitle : DEFAULT_SETTINGS.subtitle,
      gamePin: typeof rawSettings.gamePin === "string" ? rawSettings.gamePin : DEFAULT_SETTINGS.gamePin,
      currency: typeof rawSettings.currency === "string" ? rawSettings.currency : DEFAULT_SETTINGS.currency,
      maxTeams: Number(rawSettings.maxTeams ?? DEFAULT_SETTINGS.maxTeams),
      prizeFirst: Number(rawSettings.prizeFirst ?? DEFAULT_SETTINGS.prizeFirst),
      prizeSecond: Number(rawSettings.prizeSecond ?? DEFAULT_SETTINGS.prizeSecond),
      prizeThird: Number(rawSettings.prizeThird ?? DEFAULT_SETTINGS.prizeThird),
      teamSize: Number(rawSettings.teamSize ?? DEFAULT_SETTINGS.teamSize),
    }),
    flowItems,
    phase,
    activeItemIndex,
    activeItemStartedAt: candidate.activeItemStartedAt ?? null,
    answersLocked: Boolean(candidate.answersLocked),
    showCorrectAnswer: Boolean(candidate.showCorrectAnswer),
    teams: Array.isArray(candidate.teams) ? candidate.teams : [],
    responses: pruneResponsesForFlowItems(responses, flowItems),
  };
}
