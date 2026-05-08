"use client";

import { Podium } from "@/components/Podium";
import { ProjectionFrame } from "@/components/ProjectionFrame";
import { useGameState } from "@/hooks/useGameState";

export default function ResultsPage() {
  const { state, leaderboard } = useGameState();

  return (
    <ProjectionFrame eyebrow="Final Sonuçları" title="İSG Arena 2026 Kazananları">
      <Podium teams={leaderboard} settings={state.settings} />
    </ProjectionFrame>
  );
}
