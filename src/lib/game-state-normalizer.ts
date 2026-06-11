import { resolveBrandSettings } from "./brand-theme";
import {
  answerIds,
  createInitialGameState,
  DEFAULT_SETTINGS,
  inferMediaSource,
  inferMediaType,
  pruneResponsesForFlowItems,
  type AnswerId,
  type ContentFlowItem,
  type FinalRoundFlowItem,
  type FinalRoundQuestion,
  type GamePhase,
  type GameSettings,
  type GameState,
  type MediaSource,
  type MediaType,
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
    finalRound: "final",
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

function isMediaType(value: unknown): value is MediaType {
  return value === "image" || value === "video" || value === "youtube" || value === "none";
}

function isMediaSource(value: unknown): value is MediaSource {
  return value === "upload" || value === "url" || value === "youtube" || value === "public-path" || value === "none";
}

function createDefaultFinalRoundQuestion(index: number): FinalRoundQuestion {
  return {
    id: `final-question-${index + 1}`,
    scenarioText: `Final senaryo ${index + 1}`,
    scenarioDurationSeconds: 10,
    questionText: `Final soru ${index + 1}`,
    options: answerIds.map((id) => ({ id, text: `${id} seçeneği` })),
    correctOptionId: "A",
    timeLimitSeconds: 30,
    mediaType: "none",
    mediaSource: "none",
  };
}

function normalizeFinalRoundQuestion(value: unknown, index: number, usedIds: Set<string>): FinalRoundQuestion {
  const fallback = createDefaultFinalRoundQuestion(index);
  const question = isRecord(value) ? value : {};
  const requestedId = asString(question.id).trim();
  let id = requestedId || fallback.id;

  while (usedIds.has(id)) {
    id = `${fallback.id}-${Math.random().toString(36).slice(2, 8)}`;
  }
  usedIds.add(id);

  const rawOptions = Array.isArray(question.options) ? question.options : [];
  const options = answerIds.map((optionId) => {
    const rawOption = rawOptions.find((option) => isRecord(option) && option.id === optionId);
    return {
      id: optionId,
      text: isRecord(rawOption) ? asString(rawOption.text, `${optionId} seçeneği`) : `${optionId} seçeneği`,
    };
  });
  const mediaUrl = asString(question.mediaUrl).trim();

  return {
    id,
    scenarioText: asString(question.scenarioText, fallback.scenarioText),
    scenarioDurationSeconds: asPositiveNumber(question.scenarioDurationSeconds, fallback.scenarioDurationSeconds),
    questionText: asString(question.questionText, fallback.questionText),
    options,
    correctOptionId: isAnswerId(question.correctOptionId) ? question.correctOptionId : fallback.correctOptionId,
    timeLimitSeconds: asPositiveNumber(question.timeLimitSeconds, fallback.timeLimitSeconds),
    mediaUrl: mediaUrl || undefined,
    mediaType: isMediaType(question.mediaType) ? question.mediaType : inferMediaType(mediaUrl),
    mediaSource: isMediaSource(question.mediaSource) ? question.mediaSource : inferMediaSource(mediaUrl),
  };
}

function normalizeFinalRoundQuestions(value: unknown): FinalRoundFlowItem["questions"] {
  const rawQuestions = Array.isArray(value) ? value : [];
  const usedIds = new Set<string>();

  return [0, 1, 2].map((index) => normalizeFinalRoundQuestion(rawQuestions[index], index, usedIds)) as FinalRoundFlowItem["questions"];
}

function normalizeFlowItem(value: unknown, usedIds: Set<string>, quizNumber: number): ContentFlowItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const type = value.type;

  if (type === "quiz") {
    const mediaUrl = asString(value.mediaUrl ?? value.imageUrl).trim();
    const mediaType = isMediaType(value.mediaType) ? value.mediaType : inferMediaType(mediaUrl);
    const mediaSource = isMediaSource(value.mediaSource) ? value.mediaSource : inferMediaSource(mediaUrl);
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
      mediaUrl: mediaUrl || undefined,
      mediaType,
      mediaSource,
      timeLimitSeconds: asPositiveNumber(value.timeLimitSeconds, 30),
      maxScore: asPositiveNumber(value.maxScore, 1000),
      options,
      correctOptionId: isAnswerId(value.correctOptionId) ? value.correctOptionId : "A",
      explanation: asString(value.explanation) || undefined,
    };
  }

  if (type === "infoSlide") {
    const mediaUrl = asString(value.mediaUrl ?? value.imageUrl).trim();
    const mediaType = isMediaType(value.mediaType) ? value.mediaType : inferMediaType(mediaUrl);
    const mediaSource = isMediaSource(value.mediaSource) ? value.mediaSource : inferMediaSource(mediaUrl);

    return {
      id: createSafeId("infoSlide", usedIds, value.id),
      type: "infoSlide",
      title: asString(value.title, "Adsız bilgi slaytı"),
      category: asString(value.category),
      description: asString(value.description),
      imageUrl: asString(value.imageUrl) || undefined,
      mediaUrl: mediaUrl || undefined,
      mediaType,
      mediaSource,
      timeLimitSeconds: asOptionalPositiveNumber(value.timeLimitSeconds),
    };
  }

  if (type === "mediaSlide") {
    const mediaUrl = asString(value.mediaUrl ?? value.uploadedImageDataUrl).trim();
    const mediaType = isMediaType(value.mediaType) ? value.mediaType : inferMediaType(mediaUrl);
    const mediaSource = isMediaSource(value.mediaSource) ? value.mediaSource : inferMediaSource(mediaUrl);

    return {
      id: createSafeId("mediaSlide", usedIds, value.id),
      type: "mediaSlide",
      title: asString(value.title, "Adsız medya slaytı"),
      category: asString(value.category),
      mediaType,
      mediaSource,
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

  if (type === "finalRound") {
    const mediaUrl = asString(value.mediaUrl).trim();
    const mediaType = isMediaType(value.mediaType) ? value.mediaType : inferMediaType(mediaUrl);
    const mediaSource = isMediaSource(value.mediaSource) ? value.mediaSource : inferMediaSource(mediaUrl);

    return {
      id: createSafeId("finalRound", usedIds, value.id),
      type: "finalRound",
      title: asString(value.title, "Final Round"),
      category: asString(value.category, "Final"),
      mediaUrl: mediaUrl || undefined,
      mediaType,
      mediaSource,
      introTitle: asString(value.introTitle, "FINAL ROUND"),
      introMessage: asString(
        value.introMessage,
        "Artık bireysel hız değil, takımların ortak doğru karar alma gücü ölçülüyor.",
      ),
      questions: normalizeFinalRoundQuestions(value.questions),
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
    value === "finalRound" ||
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
    : [];
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
