"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { calculateQuestionScore } from "@/lib/scoring";
import {
  cloneFlowItem,
  createFlowItemId,
  createInitialGameState,
  createInitialFlowItems,
  DEFAULT_SETTINGS,
  QUIZ_INTRO_SECONDS,
  deriveLeaderboard,
  getActiveItem,
  getFlowItems,
  getAnsweredCount,
  getItemStartPhase,
  getTeamResponses,
  pruneResponsesForFlowItems,
  type AnswerId,
  type ContentFlowItem,
  type ForkliftRun,
  type GameSettings,
  type GameState,
} from "@/lib/game-state";
import {
  clearTeamSession,
  createTeamId,
  getTeamSession,
  loadGameState,
  saveGameState,
  saveTeamSession,
  subscribeGameState,
} from "@/lib/game-store";

type JoinResult = {
  ok: boolean;
  message?: string;
};

type SubmitResult = {
  ok: boolean;
  message?: string;
};

function getStartedItemState(item: ContentFlowItem) {
  const phase = getItemStartPhase(item);

  return {
    phase,
    activeItemStartedAt: Date.now(),
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

export function useGameState() {
  const [state, setState] = useState<GameState>(() => createInitialGameState({ gamePin: DEFAULT_SETTINGS.gamePin }));
  const [now, setNow] = useState(() => Date.now());
  const [sessionTick, setSessionTick] = useState(0);

  useEffect(() => {
    setState(loadGameState());
    setSessionTick((value) => value + 1);

    return subscribeGameState(() => {
      setState(loadGameState());
      setSessionTick((value) => value + 1);
    });
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, []);

  const commit = useCallback((updater: (current: GameState) => GameState) => {
    const nextState = updater(loadGameState());
    saveGameState(nextState);
    setState(nextState);
  }, []);

  const activeItem = getActiveItem(state);
  const leaderboard = useMemo(() => deriveLeaderboard(state), [state]);
  const teamSession = useMemo(() => getTeamSession(), [state, sessionTick]);
  const currentTeam = useMemo(() => {
    if (!teamSession || teamSession.gamePin !== state.settings.gamePin) {
      return null;
    }

    return state.teams.find((team) => team.id === teamSession.teamId) ?? null;
  }, [state.settings.gamePin, state.teams, teamSession]);

  useEffect(() => {
    if (state.phase !== "quizIntro" || activeItem.type !== "quiz" || !state.activeItemStartedAt) {
      return;
    }

    if (now - state.activeItemStartedAt < QUIZ_INTRO_SECONDS * 1000) {
      return;
    }

    commit((currentState) => {
      const currentItem = getActiveItem(currentState);

      if (currentState.phase !== "quizIntro" || currentItem.type !== "quiz" || currentItem.id !== activeItem.id) {
        return currentState;
      }

      return {
        ...currentState,
        phase: "quiz",
        activeItemStartedAt: Date.now(),
        answersLocked: false,
        showCorrectAnswer: false,
      };
    });
  }, [activeItem.id, activeItem.type, commit, now, state.activeItemStartedAt, state.phase]);

  const resetGame = useCallback(() => {
    const currentState = loadGameState();
    const nextState = createInitialGameState({
      ...currentState.settings,
      gamePin: undefined,
    });
    saveGameState(nextState);
    clearTeamSession();
    setState(nextState);
    setSessionTick((value) => value + 1);
  }, []);

  const updateSettings = useCallback(
    (settings: Partial<GameSettings>) => {
      commit((currentState) => ({
        ...currentState,
        settings: {
          ...currentState.settings,
          ...settings,
          maxTeams: Math.max(1, Math.round(Number(settings.maxTeams ?? currentState.settings.maxTeams))),
          prizeFirst: Math.max(0, Math.round(Number(settings.prizeFirst ?? currentState.settings.prizeFirst))),
          prizeSecond: Math.max(0, Math.round(Number(settings.prizeSecond ?? currentState.settings.prizeSecond))),
          prizeThird: Math.max(0, Math.round(Number(settings.prizeThird ?? currentState.settings.prizeThird))),
          teamSize: Math.max(1, Math.round(Number(settings.teamSize ?? currentState.settings.teamSize))),
        },
      }));
    },
    [commit],
  );

  const joinTeam = useCallback((pin: string, teamName: string): JoinResult => {
    const currentState = loadGameState();
    const cleanPin = pin.trim();
    const cleanTeamName = teamName.trim();

    if (cleanPin !== currentState.settings.gamePin) {
      return { ok: false, message: "PIN hatalı. Projeksiyon ekranındaki PIN'i girin." };
    }

    if (cleanTeamName.length < 2) {
      return { ok: false, message: "Takım adı en az 2 karakter olmalı." };
    }

    const duplicateTeam = currentState.teams.find(
      (team) => team.name.toLocaleLowerCase("tr-TR") === cleanTeamName.toLocaleLowerCase("tr-TR"),
    );

    if (duplicateTeam) {
      saveTeamSession({ teamId: duplicateTeam.id, gamePin: currentState.settings.gamePin });
      setSessionTick((value) => value + 1);
      return { ok: true };
    }

    if (currentState.teams.length >= currentState.settings.maxTeams) {
      return { ok: false, message: "Takım kapasitesi doldu." };
    }

    const newTeam = {
      id: createTeamId(),
      name: cleanTeamName,
      joinedAt: Date.now(),
    };

    const nextState: GameState = {
      ...currentState,
      teams: [...currentState.teams, newTeam],
      responses: {
        ...currentState.responses,
        [newTeam.id]: { answers: {}, forkliftRuns: {} },
      },
    };

    saveTeamSession({ teamId: newTeam.id, gamePin: currentState.settings.gamePin });
    saveGameState(nextState);
    setState(nextState);
    setSessionTick((value) => value + 1);

    return { ok: true };
  }, []);

  const openLobby = useCallback(() => {
    commit((currentState) => ({
      ...currentState,
      phase: "lobby",
      activeItemStartedAt: null,
      answersLocked: false,
      showCorrectAnswer: false,
    }));
  }, [commit]);

  const startActiveItem = useCallback(() => {
    commit((currentState) => {
      if (!currentState.flowItems.length) {
        return {
          ...currentState,
          phase: "lobby",
          activeItemIndex: 0,
          activeItemStartedAt: null,
          answersLocked: false,
          showCorrectAnswer: false,
        };
      }

      const currentItem = getActiveItem(currentState);
      return {
        ...currentState,
        ...getStartedItemState(currentItem),
      };
    });
  }, [commit]);

  const goToItem = useCallback(
    (index: number) => {
      commit((currentState) => {
        const flowItems = currentState.flowItems;
        if (!flowItems.length) {
          return {
            ...currentState,
            phase: "lobby",
            activeItemIndex: 0,
            activeItemStartedAt: null,
            answersLocked: false,
            showCorrectAnswer: false,
          };
        }

        const safeIndex = Math.max(0, Math.min(flowItems.length - 1, index));
        const nextItem = flowItems[safeIndex];

        return {
          ...currentState,
          activeItemIndex: safeIndex,
          ...getStartedItemState(nextItem),
        };
      });
    },
    [commit],
  );

  const nextItem = useCallback(() => {
    commit((currentState) => {
      if (!currentState.flowItems.length) {
        return {
          ...currentState,
          phase: "lobby",
          activeItemIndex: 0,
          activeItemStartedAt: null,
          answersLocked: false,
          showCorrectAnswer: false,
        };
      }

      const flowItems = getFlowItems(currentState);
      const currentItem = getActiveItem(currentState);
      const shouldShowScoreboardBeforeNextItem =
        currentState.phase === "quiz" &&
        currentItem.type === "quiz" &&
        Boolean(currentState.activeItemStartedAt) &&
        Date.now() - (currentState.activeItemStartedAt ?? 0) >= currentItem.timeLimitSeconds * 1000;

      if (shouldShowScoreboardBeforeNextItem) {
        return {
          ...currentState,
          phase: "leaderboard",
          activeItemStartedAt: null,
          answersLocked: true,
          showCorrectAnswer: false,
        };
      }

      const nextIndex = currentState.activeItemIndex + 1;

      if (nextIndex >= flowItems.length) {
        return {
          ...currentState,
          phase: "finished",
          activeItemStartedAt: null,
          answersLocked: true,
          showCorrectAnswer: false,
        };
      }

      const nextFlowItem = flowItems[nextIndex];
      return {
        ...currentState,
        activeItemIndex: nextIndex,
        ...getStartedItemState(nextFlowItem),
      };
    });
  }, [commit]);

  const lockAnswers = useCallback(() => {
    commit((currentState) => ({ ...currentState, answersLocked: true }));
  }, [commit]);

  const revealCorrectAnswer = useCallback(() => {
    commit((currentState) => ({ ...currentState, answersLocked: true, showCorrectAnswer: true }));
  }, [commit]);

  const showLeaderboard = useCallback(() => {
    commit((currentState) => ({
      ...currentState,
      phase: "leaderboard",
      activeItemStartedAt: null,
      answersLocked: true,
      showCorrectAnswer: false,
    }));
  }, [commit]);

  const finishGame = useCallback(() => {
    commit((currentState) => ({
      ...currentState,
      phase: "finished",
      activeItemStartedAt: null,
      answersLocked: true,
      showCorrectAnswer: false,
    }));
  }, [commit]);

  const addFlowItem = useCallback(
    (item: ContentFlowItem) => {
      commit((currentState) => reconcileFlowState(currentState, [...currentState.flowItems, item]));
    },
    [commit],
  );

  const updateFlowItem = useCallback(
    (item: ContentFlowItem) => {
      commit((currentState) =>
        reconcileFlowState(
          currentState,
          currentState.flowItems.map((flowItem) => (flowItem.id === item.id ? item : flowItem)),
        ),
      );
    },
    [commit],
  );

  const deleteFlowItem = useCallback(
    (itemId: string) => {
      commit((currentState) => reconcileFlowState(currentState, currentState.flowItems.filter((item) => item.id !== itemId)));
    },
    [commit],
  );

  const duplicateFlowItem = useCallback(
    (itemId: string) => {
      commit((currentState) => {
        const itemIndex = currentState.flowItems.findIndex((item) => item.id === itemId);

        if (itemIndex < 0) {
          return currentState;
        }

        const duplicatedItem = createDuplicatedFlowItem(currentState.flowItems[itemIndex]);
        const nextFlowItems = [
          ...currentState.flowItems.slice(0, itemIndex + 1),
          duplicatedItem,
          ...currentState.flowItems.slice(itemIndex + 1),
        ];

        return reconcileFlowState(currentState, nextFlowItems);
      });
    },
    [commit],
  );

  const moveFlowItem = useCallback(
    (itemId: string, direction: -1 | 1) => {
      commit((currentState) => {
        const itemIndex = currentState.flowItems.findIndex((item) => item.id === itemId);
        const targetIndex = itemIndex + direction;

        if (itemIndex < 0 || targetIndex < 0 || targetIndex >= currentState.flowItems.length) {
          return currentState;
        }

        const nextFlowItems = [...currentState.flowItems];
        const [movedItem] = nextFlowItems.splice(itemIndex, 1);
        nextFlowItems.splice(targetIndex, 0, movedItem);

        return reconcileFlowState(currentState, nextFlowItems);
      });
    },
    [commit],
  );

  const restoreDefaultFlow = useCallback(() => {
    commit((currentState) => ({
      ...reconcileFlowState(currentState, createInitialFlowItems()),
      phase: "lobby",
      activeItemIndex: 0,
      activeItemStartedAt: null,
      answersLocked: false,
      showCorrectAnswer: false,
    }));
  }, [commit]);

  const submitQuizAnswer = useCallback((optionId: AnswerId): SubmitResult => {
    const session = getTeamSession();
    const currentState = loadGameState();
    const item = getActiveItem(currentState);

    if (!session || session.gamePin !== currentState.settings.gamePin) {
      return { ok: false, message: "Takım oturumu bulunamadı." };
    }

    if (currentState.phase !== "quiz" || item.type !== "quiz") {
      return { ok: false, message: "Aktif soru yok." };
    }

    if (currentState.answersLocked || currentState.showCorrectAnswer) {
      return { ok: false, message: "Cevaplar kilitlendi." };
    }

    const team = currentState.teams.find((entry) => entry.id === session.teamId);
    if (!team) {
      return { ok: false, message: "Takım bu oyunda kayıtlı değil." };
    }

    const responses = getTeamResponses(currentState, team.id);
    if (responses.answers[item.id]) {
      return { ok: false, message: "Bu soru için cevap zaten gönderildi." };
    }

    const submittedAt = Date.now();
    const answerTimeMs = currentState.activeItemStartedAt ? submittedAt - currentState.activeItemStartedAt : 0;

    if (!currentState.activeItemStartedAt || answerTimeMs >= item.timeLimitSeconds * 1000) {
      return { ok: false, message: "Cevap süresi doldu." };
    }

    const isCorrect = optionId === item.correctOptionId;
    const scoreResult = calculateQuestionScore({
      isCorrect,
      answerTimeMs,
      timeLimitMs: item.timeLimitSeconds * 1000,
    });

    const nextState: GameState = {
      ...currentState,
      responses: {
        ...currentState.responses,
        [team.id]: {
          answers: {
            ...responses.answers,
            [item.id]: {
              itemId: item.id,
              optionId,
              isCorrect,
              score: scoreResult.totalScore,
              answerTimeMs,
              submittedAt,
            },
          },
          forkliftRuns: responses.forkliftRuns,
        },
      },
    };

    saveGameState(nextState);
    setState(nextState);

    return { ok: true };
  }, []);

  const submitForkliftRun = useCallback((run: Omit<ForkliftRun, "submittedAt">): SubmitResult => {
    const session = getTeamSession();
    const currentState = loadGameState();
    const item = getActiveItem(currentState);

    if (!session || session.gamePin !== currentState.settings.gamePin) {
      return { ok: false, message: "Takım oturumu bulunamadı." };
    }

    if (currentState.phase !== "forkliftChallenge" || item.type !== "forkliftChallenge") {
      return { ok: false, message: "Aktif final etabı yok." };
    }

    const team = currentState.teams.find((entry) => entry.id === session.teamId);
    if (!team) {
      return { ok: false, message: "Takım bu oyunda kayıtlı değil." };
    }

    const responses = getTeamResponses(currentState, team.id);
    if (responses.forkliftRuns[item.id]) {
      return { ok: false, message: "Final etabı skoru zaten gönderildi." };
    }

    const nextState: GameState = {
      ...currentState,
      responses: {
        ...currentState.responses,
        [team.id]: {
          answers: responses.answers,
          forkliftRuns: {
            ...responses.forkliftRuns,
            [item.id]: {
              ...run,
              itemId: item.id,
              submittedAt: Date.now(),
            },
          },
        },
      },
    };

    saveGameState(nextState);
    setState(nextState);

    return { ok: true };
  }, []);

  return {
    state,
    now,
    activeItem,
    leaderboard,
    teamSession,
    currentTeam,
    answeredCount: getAnsweredCount(state, activeItem),
    resetGame,
    updateSettings,
    joinTeam,
    openLobby,
    startActiveItem,
    goToItem,
    nextItem,
    lockAnswers,
    revealCorrectAnswer,
    showLeaderboard,
    finishGame,
    addFlowItem,
    updateFlowItem,
    deleteFlowItem,
    duplicateFlowItem,
    moveFlowItem,
    restoreDefaultFlow,
    submitQuizAnswer,
    submitForkliftRun,
  };
}
