"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { calculateQuestionScore } from "@/lib/scoring";
import {
  createInitialGameState,
  DEFAULT_FLOW,
  DEFAULT_SETTINGS,
  deriveLeaderboard,
  getActiveItem,
  getAnsweredCount,
  getItemPhase,
  getTeamResponses,
  shouldRevealLeaderboardAfter,
  type AnswerId,
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
      const currentItem = getActiveItem(currentState);
      return {
        ...currentState,
        phase: getItemPhase(currentItem),
        activeItemStartedAt: Date.now(),
        answersLocked: false,
        showCorrectAnswer: false,
      };
    });
  }, [commit]);

  const goToItem = useCallback(
    (index: number) => {
      commit((currentState) => {
        const safeIndex = Math.max(0, Math.min(DEFAULT_FLOW.length - 1, index));
        const nextItem = DEFAULT_FLOW[safeIndex];

        return {
          ...currentState,
          phase: getItemPhase(nextItem),
          activeItemIndex: safeIndex,
          activeItemStartedAt: Date.now(),
          answersLocked: false,
          showCorrectAnswer: false,
        };
      });
    },
    [commit],
  );

  const nextItem = useCallback(() => {
    commit((currentState) => {
      const currentItem = getActiveItem(currentState);

      if (currentState.phase !== "leaderboard" && shouldRevealLeaderboardAfter(currentItem)) {
        return {
          ...currentState,
          phase: "leaderboard",
          activeItemStartedAt: null,
          answersLocked: true,
          showCorrectAnswer: false,
        };
      }

      const nextIndex = currentState.activeItemIndex + 1;

      if (nextIndex >= DEFAULT_FLOW.length) {
        return {
          ...currentState,
          phase: "finished",
          activeItemStartedAt: null,
          answersLocked: true,
          showCorrectAnswer: false,
        };
      }

      const nextFlowItem = DEFAULT_FLOW[nextIndex];
      return {
        ...currentState,
        phase: getItemPhase(nextFlowItem),
        activeItemIndex: nextIndex,
        activeItemStartedAt: Date.now(),
        answersLocked: false,
        showCorrectAnswer: false,
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

    const answerTimeMs = currentState.activeItemStartedAt ? Date.now() - currentState.activeItemStartedAt : 0;
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
              submittedAt: Date.now(),
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
    submitQuizAnswer,
    submitForkliftRun,
  };
}
