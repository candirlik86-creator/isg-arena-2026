import { calculateQuestionScore } from "./scoring";
import {
  cloneFlowItem,
  createFlowItemId,
  createInitialFlowItems,
  createInitialGameState,
  getActiveItem,
  getFlowItems,
  getItemStartPhase,
  getTeamResponses,
  pruneResponsesForFlowItems,
  QUIZ_INTRO_SECONDS,
  type AnswerId,
  type ContentFlowItem,
  type ForkliftRun,
  type GameSettings,
  type GameState,
} from "./game-state";

export type GameTeamSession = {
  teamId: string;
  gamePin: string;
};

export type GameAction =
  | { type: "resetGame" }
  | { type: "updateSettings"; settings: Partial<GameSettings> }
  | { type: "openLobby" }
  | { type: "startActiveItem" }
  | { type: "goToItem"; index: number }
  | { type: "nextItem" }
  | { type: "lockAnswers" }
  | { type: "revealCorrectAnswer" }
  | { type: "showLeaderboard" }
  | { type: "finishGame" }
  | { type: "addFlowItem"; item: ContentFlowItem }
  | { type: "updateFlowItem"; item: ContentFlowItem }
  | { type: "deleteFlowItem"; itemId: string }
  | { type: "duplicateFlowItem"; itemId: string }
  | { type: "moveFlowItem"; itemId: string; direction: -1 | 1 }
  | { type: "restoreDefaultFlow" }
  | { type: "advanceQuizIntro"; itemId: string }
  | { type: "joinTeam"; pin: string; teamName: string }
  | { type: "submitQuizAnswer"; teamId: string; gamePin: string; optionId: AnswerId }
  | { type: "submitForkliftRun"; teamId: string; gamePin: string; run: Omit<ForkliftRun, "submittedAt"> };

export type GameActionResult = {
  ok: boolean;
  state: GameState;
  message?: string;
  teamSession?: GameTeamSession;
};

function getStartedItemState(item: ContentFlowItem, now: number) {
  const phase = getItemStartPhase(item);

  return {
    phase,
    activeItemStartedAt: now,
    answersLocked: phase === "quizIntro",
    showCorrectAnswer: false,
  };
}

function reconcileFlowState(currentState: GameState, flowItems: ContentFlowItem[]): GameState {
  const currentActiveItem = currentState.flowItems[currentState.activeItemIndex];
  const nextActiveIndex = currentActiveItem ? flowItems.findIndex((item) => item.id === currentActiveItem.id) : -1;
  const activeItemWasPreserved = nextActiveIndex >= 0;
  const shouldPreservePhase = activeItemWasPreserved || currentState.phase === "lobby" || currentState.phase === "finished";
  const safeActiveItemIndex = activeItemWasPreserved
    ? nextActiveIndex
    : flowItems.length
      ? Math.min(currentState.activeItemIndex, flowItems.length - 1)
      : 0;
  const nextActiveItem = flowItems[safeActiveItemIndex];

  return {
    ...currentState,
    flowItems,
    activeItemIndex: safeActiveItemIndex,
    responses: pruneResponsesForFlowItems(currentState.responses, flowItems),
    phase: flowItems.length ? (shouldPreservePhase ? currentState.phase : getItemStartPhase(nextActiveItem)) : "lobby",
    activeItemStartedAt: activeItemWasPreserved ? currentState.activeItemStartedAt : null,
    answersLocked: activeItemWasPreserved ? currentState.answersLocked : false,
    showCorrectAnswer: activeItemWasPreserved ? currentState.showCorrectAnswer : false,
  };
}

function createDuplicatedFlowItem(item: ContentFlowItem): ContentFlowItem {
  const duplicatedItem = cloneFlowItem(item);
  const title = item.title.endsWith(" Kopya") ? item.title : `${item.title} Kopya`;

  if (duplicatedItem.type === "quiz") {
    return {
      ...duplicatedItem,
      id: createFlowItemId("quiz"),
      title,
    };
  }

  return {
    ...duplicatedItem,
    id: createFlowItemId(duplicatedItem.type),
    title,
  };
}

function createTeamId(now: number) {
  return `team-${now}-${Math.random().toString(36).slice(2, 8)}`;
}

function success(state: GameState, extra: Omit<GameActionResult, "ok" | "state"> = {}): GameActionResult {
  return { ok: true, state, ...extra };
}

function failure(state: GameState, message: string): GameActionResult {
  return { ok: false, state, message };
}

export function applyGameAction(currentState: GameState, action: GameAction, now = Date.now()): GameActionResult {
  if (action.type === "resetGame") {
    return success(
      createInitialGameState({
        ...currentState.settings,
        gamePin: undefined,
      }),
    );
  }

  if (action.type === "updateSettings") {
    return success({
      ...currentState,
      settings: {
        ...currentState.settings,
        ...action.settings,
        maxTeams: Math.max(1, Math.round(Number(action.settings.maxTeams ?? currentState.settings.maxTeams))),
        prizeFirst: Math.max(0, Math.round(Number(action.settings.prizeFirst ?? currentState.settings.prizeFirst))),
        prizeSecond: Math.max(0, Math.round(Number(action.settings.prizeSecond ?? currentState.settings.prizeSecond))),
        prizeThird: Math.max(0, Math.round(Number(action.settings.prizeThird ?? currentState.settings.prizeThird))),
        teamSize: Math.max(1, Math.round(Number(action.settings.teamSize ?? currentState.settings.teamSize))),
      },
    });
  }

  if (action.type === "openLobby") {
    return success({
      ...currentState,
      phase: "lobby",
      activeItemStartedAt: null,
      answersLocked: false,
      showCorrectAnswer: false,
    });
  }

  if (action.type === "startActiveItem") {
    if (!currentState.flowItems.length) {
      return success({
        ...currentState,
        phase: "lobby",
        activeItemIndex: 0,
        activeItemStartedAt: null,
        answersLocked: false,
        showCorrectAnswer: false,
      });
    }

    const currentItem = getActiveItem(currentState);
    return success({
      ...currentState,
      ...getStartedItemState(currentItem, now),
    });
  }

  if (action.type === "goToItem") {
    const flowItems = currentState.flowItems;
    if (!flowItems.length) {
      return success({
        ...currentState,
        phase: "lobby",
        activeItemIndex: 0,
        activeItemStartedAt: null,
        answersLocked: false,
        showCorrectAnswer: false,
      });
    }

    const safeIndex = Math.max(0, Math.min(flowItems.length - 1, action.index));
    const nextItem = flowItems[safeIndex];

    return success({
      ...currentState,
      activeItemIndex: safeIndex,
      ...getStartedItemState(nextItem, now),
    });
  }

  if (action.type === "nextItem") {
    if (!currentState.flowItems.length) {
      return success({
        ...currentState,
        phase: "lobby",
        activeItemIndex: 0,
        activeItemStartedAt: null,
        answersLocked: false,
        showCorrectAnswer: false,
      });
    }

    const flowItems = getFlowItems(currentState);
    const currentItem = getActiveItem(currentState);
    const shouldShowScoreboardBeforeNextItem =
      currentState.phase === "quiz" &&
      currentItem.type === "quiz" &&
      Boolean(currentState.activeItemStartedAt) &&
      now - (currentState.activeItemStartedAt ?? 0) >= currentItem.timeLimitSeconds * 1000;

    if (shouldShowScoreboardBeforeNextItem) {
      return success({
        ...currentState,
        phase: "leaderboard",
        activeItemStartedAt: null,
        answersLocked: true,
        showCorrectAnswer: false,
      });
    }

    const nextIndex = currentState.activeItemIndex + 1;

    if (nextIndex >= flowItems.length) {
      return success({
        ...currentState,
        phase: "finished",
        activeItemStartedAt: null,
        answersLocked: true,
        showCorrectAnswer: false,
      });
    }

    const nextFlowItem = flowItems[nextIndex];
    return success({
      ...currentState,
      activeItemIndex: nextIndex,
      ...getStartedItemState(nextFlowItem, now),
    });
  }

  if (action.type === "lockAnswers") {
    return success({ ...currentState, answersLocked: true });
  }

  if (action.type === "revealCorrectAnswer") {
    return success({ ...currentState, answersLocked: true, showCorrectAnswer: true });
  }

  if (action.type === "showLeaderboard") {
    return success({
      ...currentState,
      phase: "leaderboard",
      activeItemStartedAt: null,
      answersLocked: true,
      showCorrectAnswer: false,
    });
  }

  if (action.type === "finishGame") {
    return success({
      ...currentState,
      phase: "finished",
      activeItemStartedAt: null,
      answersLocked: true,
      showCorrectAnswer: false,
    });
  }

  if (action.type === "addFlowItem") {
    return success(reconcileFlowState(currentState, [...currentState.flowItems, action.item]));
  }

  if (action.type === "updateFlowItem") {
    return success(
      reconcileFlowState(
        currentState,
        currentState.flowItems.map((flowItem) => (flowItem.id === action.item.id ? action.item : flowItem)),
      ),
    );
  }

  if (action.type === "deleteFlowItem") {
    return success(reconcileFlowState(currentState, currentState.flowItems.filter((item) => item.id !== action.itemId)));
  }

  if (action.type === "duplicateFlowItem") {
    const itemIndex = currentState.flowItems.findIndex((item) => item.id === action.itemId);

    if (itemIndex < 0) {
      return success(currentState);
    }

    const duplicatedItem = createDuplicatedFlowItem(currentState.flowItems[itemIndex]);
    const nextFlowItems = [
      ...currentState.flowItems.slice(0, itemIndex + 1),
      duplicatedItem,
      ...currentState.flowItems.slice(itemIndex + 1),
    ];

    return success(reconcileFlowState(currentState, nextFlowItems));
  }

  if (action.type === "moveFlowItem") {
    const itemIndex = currentState.flowItems.findIndex((item) => item.id === action.itemId);
    const targetIndex = itemIndex + action.direction;

    if (itemIndex < 0 || targetIndex < 0 || targetIndex >= currentState.flowItems.length) {
      return success(currentState);
    }

    const nextFlowItems = [...currentState.flowItems];
    const [movedItem] = nextFlowItems.splice(itemIndex, 1);
    nextFlowItems.splice(targetIndex, 0, movedItem);

    return success(reconcileFlowState(currentState, nextFlowItems));
  }

  if (action.type === "restoreDefaultFlow") {
    return success({
      ...reconcileFlowState(currentState, createInitialFlowItems()),
      phase: "lobby",
      activeItemIndex: 0,
      activeItemStartedAt: null,
      answersLocked: false,
      showCorrectAnswer: false,
    });
  }

  if (action.type === "advanceQuizIntro") {
    const currentItem = getActiveItem(currentState);

    if (
      currentState.phase !== "quizIntro" ||
      currentItem.type !== "quiz" ||
      currentItem.id !== action.itemId ||
      !currentState.activeItemStartedAt ||
      now - currentState.activeItemStartedAt < QUIZ_INTRO_SECONDS * 1000
    ) {
      return success(currentState);
    }

    return success({
      ...currentState,
      phase: "quiz",
      activeItemStartedAt: now,
      answersLocked: false,
      showCorrectAnswer: false,
    });
  }

  if (action.type === "joinTeam") {
    const cleanPin = action.pin.trim();
    const cleanTeamName = action.teamName.trim();

    if (cleanPin !== currentState.settings.gamePin) {
      return failure(currentState, "PIN hatalı. Projeksiyon ekranındaki PIN'i girin.");
    }

    if (cleanTeamName.length < 2) {
      return failure(currentState, "Takım adı en az 2 karakter olmalı.");
    }

    const duplicateTeam = currentState.teams.find(
      (team) => team.name.toLocaleLowerCase("tr-TR") === cleanTeamName.toLocaleLowerCase("tr-TR"),
    );

    if (duplicateTeam) {
      return success(currentState, {
        teamSession: { teamId: duplicateTeam.id, gamePin: currentState.settings.gamePin },
      });
    }

    if (currentState.teams.length >= currentState.settings.maxTeams) {
      return failure(currentState, "Takım kapasitesi doldu.");
    }

    const newTeam = {
      id: createTeamId(now),
      name: cleanTeamName,
      joinedAt: now,
    };

    const nextState: GameState = {
      ...currentState,
      teams: [...currentState.teams, newTeam],
      responses: {
        ...currentState.responses,
        [newTeam.id]: { answers: {}, forkliftRuns: {} },
      },
    };

    return success(nextState, {
      teamSession: { teamId: newTeam.id, gamePin: currentState.settings.gamePin },
    });
  }

  if (action.type === "submitQuizAnswer") {
    const item = getActiveItem(currentState);

    if (action.gamePin !== currentState.settings.gamePin) {
      return failure(currentState, "Takım oturumu bulunamadı.");
    }

    if (currentState.phase !== "quiz" || item.type !== "quiz") {
      return failure(currentState, "Aktif soru yok.");
    }

    if (currentState.answersLocked || currentState.showCorrectAnswer) {
      return failure(currentState, "Cevaplar kilitlendi.");
    }

    const team = currentState.teams.find((entry) => entry.id === action.teamId);
    if (!team) {
      return failure(currentState, "Takım bu oyunda kayıtlı değil.");
    }

    const responses = getTeamResponses(currentState, team.id);
    if (responses.answers[item.id]) {
      return failure(currentState, "Bu soru için cevap zaten gönderildi.");
    }

    const answerTimeMs = currentState.activeItemStartedAt ? now - currentState.activeItemStartedAt : 0;

    if (!currentState.activeItemStartedAt || answerTimeMs >= item.timeLimitSeconds * 1000) {
      return failure(currentState, "Cevap süresi doldu.");
    }

    const isCorrect = action.optionId === item.correctOptionId;
    const scoreResult = calculateQuestionScore({
      isCorrect,
      answerTimeMs,
      timeLimitMs: item.timeLimitSeconds * 1000,
    });

    return success({
      ...currentState,
      responses: {
        ...currentState.responses,
        [team.id]: {
          answers: {
            ...responses.answers,
            [item.id]: {
              itemId: item.id,
              optionId: action.optionId,
              isCorrect,
              score: scoreResult.totalScore,
              answerTimeMs,
              submittedAt: now,
            },
          },
          forkliftRuns: responses.forkliftRuns,
        },
      },
    });
  }

  if (action.type === "submitForkliftRun") {
    const item = getActiveItem(currentState);

    if (action.gamePin !== currentState.settings.gamePin) {
      return failure(currentState, "Takım oturumu bulunamadı.");
    }

    if (currentState.phase !== "forkliftChallenge" || item.type !== "forkliftChallenge") {
      return failure(currentState, "Aktif final etabı yok.");
    }

    const team = currentState.teams.find((entry) => entry.id === action.teamId);
    if (!team) {
      return failure(currentState, "Takım bu oyunda kayıtlı değil.");
    }

    const responses = getTeamResponses(currentState, team.id);
    if (responses.forkliftRuns[item.id]) {
      return failure(currentState, "Final etabı skoru zaten gönderildi.");
    }

    return success({
      ...currentState,
      responses: {
        ...currentState.responses,
        [team.id]: {
          answers: responses.answers,
          forkliftRuns: {
            ...responses.forkliftRuns,
            [item.id]: {
              ...action.run,
              itemId: item.id,
              submittedAt: now,
            },
          },
        },
      },
    });
  }

  return failure(currentState, "Bilinmeyen oyun aksiyonu.");
}
