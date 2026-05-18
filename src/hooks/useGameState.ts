"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createInitialGameState,
  DEFAULT_SETTINGS,
  deriveLeaderboard,
  getActiveItem,
  getAnsweredCount,
  QUIZ_INTRO_SECONDS,
  type AnswerId,
  type ContentFlowItem,
  type ForkliftRun,
  type GameSettings,
  type GameState,
} from "@/lib/game-state";
import type { GameAction } from "@/lib/game-actions";
import {
  createGameStateFromSavedCompetition,
  loadSavedCompetition,
  saveCurrentCompetition,
  type SavedCompetition,
} from "@/lib/competition-library";
import {
  clearTeamSession,
  dispatchGameAction,
  fetchGameState,
  getTeamSession,
  loadGameState,
  replaceGameState,
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

const SERVER_POLL_MS = 750;

export function useGameState() {
  const [state, setState] = useState<GameState>(() => createInitialGameState({ gamePin: DEFAULT_SETTINGS.gamePin }));
  const [now, setNow] = useState(() => Date.now());
  const [sessionTick, setSessionTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let fetching = false;

    const refreshState = async () => {
      if (fetching) {
        return;
      }

      fetching = true;
      try {
        const nextState = await fetchGameState();
        if (!cancelled) {
          setState(nextState);
          setSessionTick((value) => value + 1);
        }
      } catch {
        if (!cancelled) {
          setState(loadGameState());
        }
      } finally {
        fetching = false;
      }
    };

    void refreshState();

    const pollTimer = window.setInterval(refreshState, SERVER_POLL_MS);
    const unsubscribe = subscribeGameState(() => {
      setState(loadGameState());
      setSessionTick((value) => value + 1);
    });

    return () => {
      cancelled = true;
      window.clearInterval(pollTimer);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, []);

  const runAction = useCallback(async (action: GameAction) => {
    const result = await dispatchGameAction(action);
    setState(result.state);
    setSessionTick((value) => value + 1);
    return result;
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

    void runAction({ type: "advanceQuizIntro", itemId: activeItem.id });
  }, [activeItem.id, activeItem.type, now, runAction, state.activeItemStartedAt, state.phase]);

  const resetGame = useCallback(() => {
    void runAction({ type: "resetGame" }).then((result) => {
      if (result.ok) {
        clearTeamSession();
        setSessionTick((value) => value + 1);
      }
    });
  }, [runAction]);

  const updateSettings = useCallback(
    (settings: Partial<GameSettings>) => {
      void runAction({ type: "updateSettings", settings });
    },
    [runAction],
  );

  const joinTeam = useCallback(
    async (pin: string, teamName: string): Promise<JoinResult> => {
      const result = await runAction({ type: "joinTeam", pin, teamName });

      if (result.ok && result.teamSession) {
        saveTeamSession(result.teamSession);
        setSessionTick((value) => value + 1);
      }

      return { ok: result.ok, message: result.message };
    },
    [runAction],
  );

  const openLobby = useCallback(() => {
    void runAction({ type: "openLobby" });
  }, [runAction]);

  const startActiveItem = useCallback(() => {
    void runAction({ type: "startActiveItem" });
  }, [runAction]);

  const goToItem = useCallback(
    (index: number) => {
      void runAction({ type: "goToItem", index });
    },
    [runAction],
  );

  const nextItem = useCallback(() => {
    void runAction({ type: "nextItem" });
  }, [runAction]);

  const lockAnswers = useCallback(() => {
    void runAction({ type: "lockAnswers" });
  }, [runAction]);

  const revealCorrectAnswer = useCallback(() => {
    void runAction({ type: "revealCorrectAnswer" });
  }, [runAction]);

  const showLeaderboard = useCallback(() => {
    void runAction({ type: "showLeaderboard" });
  }, [runAction]);

  const finishGame = useCallback(() => {
    void runAction({ type: "finishGame" });
  }, [runAction]);

  const addFlowItem = useCallback(
    (item: ContentFlowItem) => {
      void runAction({ type: "addFlowItem", item });
    },
    [runAction],
  );

  const updateFlowItem = useCallback(
    (item: ContentFlowItem) => {
      void runAction({ type: "updateFlowItem", item });
    },
    [runAction],
  );

  const deleteFlowItem = useCallback(
    (itemId: string) => {
      void runAction({ type: "deleteFlowItem", itemId });
    },
    [runAction],
  );

  const duplicateFlowItem = useCallback(
    (itemId: string) => {
      void runAction({ type: "duplicateFlowItem", itemId });
    },
    [runAction],
  );

  const moveFlowItem = useCallback(
    (itemId: string, direction: -1 | 1) => {
      void runAction({ type: "moveFlowItem", itemId, direction });
    },
    [runAction],
  );

  const restoreDefaultFlow = useCallback(() => {
    void runAction({ type: "restoreDefaultFlow" });
  }, [runAction]);

  const saveCompetitionToLibrary = useCallback(
    (name: string): SavedCompetition => {
      return saveCurrentCompetition(state, name);
    },
    [state],
  );

  const openSavedCompetition = useCallback(async (id: string) => {
    const saved = loadSavedCompetition(id);
    if (!saved) {
      return { ok: false, message: "Kayıtlı yarışma bulunamadı." };
    }

    const nextState = createGameStateFromSavedCompetition(saved);
    const result = await replaceGameState(nextState);
    if (result.ok) {
      clearTeamSession();
      setState(result.state);
      setSessionTick((value) => value + 1);
    }

    return { ok: result.ok, message: result.message };
  }, []);

  const submitQuizAnswer = useCallback(
    async (optionId: AnswerId): Promise<SubmitResult> => {
      const session = getTeamSession();

      if (!session) {
        return { ok: false, message: "Takım oturumu bulunamadı." };
      }

      const result = await runAction({
        type: "submitQuizAnswer",
        teamId: session.teamId,
        gamePin: session.gamePin,
        optionId,
      });

      return { ok: result.ok, message: result.message };
    },
    [runAction],
  );

  const submitForkliftRun = useCallback(
    async (run: Omit<ForkliftRun, "submittedAt">): Promise<SubmitResult> => {
      const session = getTeamSession();

      if (!session) {
        return { ok: false, message: "Takım oturumu bulunamadı." };
      }

      const result = await runAction({
        type: "submitForkliftRun",
        teamId: session.teamId,
        gamePin: session.gamePin,
        run,
      });

      return { ok: result.ok, message: result.message };
    },
    [runAction],
  );

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
    saveCompetitionToLibrary,
    openSavedCompetition,
    submitQuizAnswer,
    submitForkliftRun,
  };
}
