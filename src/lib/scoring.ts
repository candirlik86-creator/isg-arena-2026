export type QuestionScoreInput = {
  isCorrect: boolean;
  answerTimeMs: number;
  timeLimitMs: number;
};

export type QuestionScoreResult = {
  totalScore: number;
  baseScore: number;
  speedScore: number;
};

const BASE_SCORE = 700;
const MAX_SPEED_SCORE = 300;

/**
 * Calculates a classic İSG Arena question score.
 * Correct answers always get 700 base points and up to 300 speed points.
 */
export function calculateQuestionScore({
  isCorrect,
  answerTimeMs,
  timeLimitMs,
}: QuestionScoreInput): QuestionScoreResult {
  if (!isCorrect || timeLimitMs <= 0) {
    return { totalScore: 0, baseScore: 0, speedScore: 0 };
  }

  const clampedAnswerTime = Math.min(Math.max(answerTimeMs, 0), timeLimitMs);
  const remainingRatio = (timeLimitMs - clampedAnswerTime) / timeLimitMs;
  const speedScore = Math.round(MAX_SPEED_SCORE * remainingRatio);
  const totalScore = BASE_SCORE + speedScore;

  return {
    totalScore,
    baseScore: BASE_SCORE,
    speedScore,
  };
}
