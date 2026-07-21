import type { AnswerId } from "@/lib/game-state";

// Tek ortak kaynak: A/B/C/D için Kahoot tarzı şekil ikonları.
// Telefon (/play) ve büyük ekran (/screen) aynı şekilleri kullansın ki
// oyuncu telefonda gördüğü şekli ekranda da tanısın.
export const ANSWER_SHAPES: Record<AnswerId, string> = {
  A: "▲",
  B: "◆",
  C: "●",
  D: "■",
};
