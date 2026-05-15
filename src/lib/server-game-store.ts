import { applyGameAction, type GameAction, type GameActionResult } from "./game-actions";
import { createInitialGameState, type GameState } from "./game-state";
import { normalizeGameState } from "./game-state-normalizer";

const SERVER_STATE_KEY = "__isgArena2026GameState";

type ServerGlobal = typeof globalThis & {
  [SERVER_STATE_KEY]?: GameState;
};

function getServerGlobal() {
  return globalThis as ServerGlobal;
}

export function readServerGameState() {
  const serverGlobal = getServerGlobal();

  if (!serverGlobal[SERVER_STATE_KEY]) {
    serverGlobal[SERVER_STATE_KEY] = createInitialGameState();
  }

  serverGlobal[SERVER_STATE_KEY] = normalizeGameState(serverGlobal[SERVER_STATE_KEY]);
  return serverGlobal[SERVER_STATE_KEY];
}

export function replaceServerGameState(state: unknown) {
  const nextState = normalizeGameState(state);
  getServerGlobal()[SERVER_STATE_KEY] = nextState;
  return nextState;
}

export function dispatchServerGameAction(action: GameAction): GameActionResult {
  const currentState = readServerGameState();
  const result = applyGameAction(currentState, action);
  const nextState = normalizeGameState(result.state);
  getServerGlobal()[SERVER_STATE_KEY] = nextState;

  return {
    ...result,
    state: nextState,
  };
}
