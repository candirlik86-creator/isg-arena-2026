"use client";

import { useEffect, useMemo, useState } from "react";
import { AnswerButtons } from "@/components/AnswerButtons";
import { Countdown } from "@/components/Countdown";
import { ForkliftChallenge } from "@/components/ForkliftChallenge";
import { Leaderboard } from "@/components/Leaderboard";
import { StageBadge } from "@/components/StageBadge";
import { TeamJoinPanel } from "@/components/TeamJoinPanel";
import { useGameState } from "@/hooks/useGameState";
import {
  QUIZ_INTRO_SECONDS,
  calculateQuizIntroRemainingSeconds,
  calculateRemainingSeconds,
  getQuizPosition,
  getTeamResponses,
  getTeamTotalScore,
  type AnswerId,
} from "@/lib/game-state";

export default function PlayPage() {
  const {
    state,
    now,
    activeItem,
    leaderboard,
    currentTeam,
    submitQuizAnswer,
    submitForkliftRun,
  } = useGameState();
  const [selectedOptionId, setSelectedOptionId] = useState<AnswerId>();
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSelectedOptionId(undefined);
    setMessage("");
  }, [activeItem.id, state.phase]);

  const responses = useMemo(() => (currentTeam ? getTeamResponses(state, currentTeam.id) : null), [currentTeam, state]);
  const currentAnswer = activeItem.type === "quiz" ? responses?.answers[activeItem.id] : undefined;
  const currentForkliftRun = activeItem.type === "forkliftChallenge" ? responses?.forkliftRuns[activeItem.id] : undefined;
  const remainingSeconds = calculateRemainingSeconds(state, activeItem, now);
  const introRemainingSeconds = calculateQuizIntroRemainingSeconds(state, activeItem, now);
  const ownRank = currentTeam ? leaderboard.findIndex((entry) => entry.id === currentTeam.id) + 1 : 0;
  const currentTeamTotalScore = currentTeam ? getTeamTotalScore(state, currentTeam.id) : 0;
  const activeQuizPosition = getQuizPosition(state, activeItem);
  const quizTimeExpired = activeItem.type === "quiz" && remainingSeconds !== null && remainingSeconds <= 0;
  const shouldShowQuizResult = activeItem.type === "quiz" && (quizTimeExpired || state.showCorrectAnswer);

  if (!currentTeam) {
    return (
      <main className="arena-play-bg min-h-screen p-4 text-white">
        <TeamJoinPanel title="Telefon Ekranına Bağlan" />
      </main>
    );
  }

  const answerDisabled =
    state.phase !== "quiz" ||
    Boolean(currentAnswer) ||
    Boolean(selectedOptionId) ||
    state.answersLocked ||
    (remainingSeconds !== null && remainingSeconds <= 0);

  const submitAnswer = (optionId: AnswerId) => {
    if (answerDisabled) {
      return;
    }

    setSelectedOptionId(optionId);
    const result = submitQuizAnswer(optionId);

    if (!result.ok) {
      setSelectedOptionId(undefined);
    }

    setMessage(result.ok ? "Cevabın alındı. Sonuç bekleniyor." : result.message ?? "Cevap gönderilemedi.");
  };

  return (
    <main className="arena-play-bg min-h-screen p-3 text-white sm:p-4">
      <div className="mx-auto max-w-2xl space-y-5">
        <header className="rounded-[1.75rem] border border-white/25 bg-white/[0.16] p-5 shadow-lg shadow-blue-950/10">
          <StageBadge label="Mobil cevap ekranı" />
          <div className="mt-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-100">Takım</p>
              <h1 className="mt-1 truncate text-3xl font-black text-white">{currentTeam.name}</h1>
            </div>
            <div className="shrink-0 rounded-2xl border border-amber-200/35 bg-amber-300/15 px-4 py-3 text-right shadow-lg shadow-amber-950/15">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-200">PIN</p>
              <p className="text-2xl font-black text-white">{state.settings.gamePin}</p>
            </div>
          </div>
        </header>

        {state.phase === "lobby" ? (
          <section className="rounded-[1.75rem] border border-white/25 bg-white/[0.15] p-6 text-center shadow-lg shadow-blue-950/10">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-emerald-200">Lobi</p>
            <h2 className="mt-4 text-4xl font-black text-white">Yarışma başlamak üzere</h2>
            <p className="mt-3 text-lg font-semibold text-blue-50">Projeksiyon ekranını takip edin.</p>
          </section>
        ) : null}

        {state.phase === "quizIntro" && activeItem.type === "quiz" ? (
          <section className="rounded-[1.75rem] border border-amber-100/40 bg-amber-300/20 p-6 text-center shadow-lg shadow-blue-950/10">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-100">Hazır ol</p>
            <h2 className="mt-4 text-4xl font-black text-white">Soru geliyor</h2>
            <p className="mt-3 text-xl font-black text-slate-100">
              Soru {activeQuizPosition?.current ?? activeItem.quizNumber}/{activeQuizPosition?.total ?? activeItem.quizNumber}
            </p>
            <p className="mt-6 text-8xl font-black tabular-nums text-white">{introRemainingSeconds ?? QUIZ_INTRO_SECONDS}</p>
            <p className="mt-5 text-lg font-semibold text-blue-50">Cevap seçenekleri birazdan açılacak.</p>
          </section>
        ) : null}

        {state.phase === "quiz" && activeItem.type === "quiz" ? (
          <>
            <section className="rounded-[1.75rem] border border-white/25 bg-white/[0.16] p-5 shadow-lg shadow-blue-950/10">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-200">
                  Soru {activeQuizPosition?.current ?? activeItem.quizNumber}/{activeQuizPosition?.total ?? activeItem.quizNumber}
                </p>
                <p className="rounded-full border border-emerald-200/25 bg-emerald-400/15 px-4 py-2 text-sm font-black text-emerald-100">{activeItem.topic}</p>
              </div>
              <h2 className="mt-5 text-4xl font-black leading-tight text-white">{activeItem.title}</h2>
            </section>

            <Countdown seconds={remainingSeconds ?? activeItem.timeLimitSeconds} totalSeconds={activeItem.timeLimitSeconds} label="Telefon süresi" />

            <div className="play-answer-buttons">
              <AnswerButtons
                options={activeItem.options}
                selectedOptionId={currentAnswer?.optionId ?? selectedOptionId}
                correctOptionId={state.showCorrectAnswer ? activeItem.correctOptionId : undefined}
                onSelect={submitAnswer}
                disabled={answerDisabled}
              />
            </div>

            {shouldShowQuizResult && currentAnswer ? (
              <div
                className={`rounded-[1.75rem] border p-6 text-center shadow-lg ${
                  currentAnswer.isCorrect ? "border-emerald-100/50 bg-emerald-400/25 shadow-blue-950/10" : "border-red-100/50 bg-red-400/25 shadow-blue-950/10"
                }`}
              >
                <div
                  className={`mx-auto flex h-24 w-24 items-center justify-center rounded-[1.5rem] text-6xl font-black shadow-md ${
                    currentAnswer.isCorrect ? "bg-emerald-300 text-slate-950" : "bg-red-400 text-white"
                  }`}
                >
                  {currentAnswer.isCorrect ? "✓" : "!"}
                </div>
                <p className={`mt-5 text-5xl font-black ${currentAnswer.isCorrect ? "text-emerald-100" : "text-red-100"}`}>
                  {currentAnswer.isCorrect ? "Doğru" : "Yanlış"}
                </p>
                <p className="mt-4 text-2xl font-black text-white">Kazanılan puan: {currentAnswer.score.toLocaleString("tr-TR")}</p>
                <p className="mt-2 text-xl font-black text-slate-100">Toplam puan: {currentTeamTotalScore.toLocaleString("tr-TR")}</p>
              </div>
            ) : message || currentAnswer ? (
              <div className="rounded-[1.75rem] border border-emerald-100/40 bg-emerald-400/20 p-6 text-center shadow-lg shadow-blue-950/10">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-300 text-4xl font-black text-slate-950 shadow-md">
                  ✓
                </div>
                <p className="text-2xl font-black leading-tight text-emerald-50">
                  {message || "Cevabın alındı. Sonuç bekleniyor."}
                </p>
              </div>
            ) : null}

            {shouldShowQuizResult && !currentAnswer ? (
              <div className="rounded-[1.75rem] border border-red-100/50 bg-red-400/25 p-6 text-center shadow-lg shadow-blue-950/10">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-red-400 text-5xl font-black text-white shadow-md">!</div>
                <p className="mt-5 text-4xl font-black text-red-100">Cevap verilmedi</p>
                <p className="mt-3 text-2xl font-black text-white">Kazanılan puan: 0</p>
                <p className="mt-2 text-xl font-black text-slate-100">Toplam puan: {currentTeamTotalScore.toLocaleString("tr-TR")}</p>
              </div>
            ) : null}
          </>
        ) : null}

        {(state.phase === "infoSlide" || state.phase === "mediaSlide") && (activeItem.type === "infoSlide" || activeItem.type === "mediaSlide") ? (
          <section className="rounded-[1.75rem] border border-white/25 bg-white/[0.15] p-6 text-center shadow-lg shadow-blue-950/10">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-sky-200">Bekleme</p>
            <h2 className="mt-4 text-3xl font-black text-white">{activeItem.title}</h2>
            {"description" in activeItem ? <p className="mt-3 text-lg font-semibold text-blue-50">{activeItem.description}</p> : null}
            {activeItem.type === "mediaSlide" && activeItem.mediaUrl ? (
              <p className="mt-3 break-all text-sm font-bold text-sky-100">{activeItem.mediaUrl}</p>
            ) : null}
            <p className="mt-4 text-lg font-black text-blue-50">Projeksiyon ekranını takip edin.</p>
          </section>
        ) : null}

        {state.phase === "leaderboard" && activeItem.type === "quiz" ? (
          <section
            className={`rounded-[1.75rem] border p-6 text-center shadow-lg ${
              currentAnswer ? (currentAnswer.isCorrect ? "border-emerald-100/50 bg-emerald-400/25 shadow-blue-950/10" : "border-red-100/50 bg-red-400/25 shadow-blue-950/10") : "border-red-100/50 bg-red-400/25 shadow-blue-950/10"
            }`}
          >
            <div
              className={`mx-auto flex h-24 w-24 items-center justify-center rounded-[1.5rem] text-6xl font-black shadow-md ${
                currentAnswer?.isCorrect ? "bg-emerald-300 text-slate-950" : "bg-red-400 text-white"
              }`}
            >
              {currentAnswer?.isCorrect ? "✓" : "!"}
            </div>
            <p className={`mt-5 text-5xl font-black ${currentAnswer?.isCorrect ? "text-emerald-100" : "text-red-100"}`}>
              {currentAnswer ? (currentAnswer.isCorrect ? "Doğru" : "Yanlış") : "Cevap verilmedi"}
            </p>
            <p className="mt-4 text-2xl font-black text-white">Kazanılan puan: {(currentAnswer?.score ?? 0).toLocaleString("tr-TR")}</p>
            <p className="mt-2 text-xl font-black text-slate-100">Toplam puan: {currentTeamTotalScore.toLocaleString("tr-TR")}</p>
          </section>
        ) : null}

        {state.phase === "forkliftChallenge" && activeItem.type === "forkliftChallenge" ? (
          <ForkliftChallenge
            item={activeItem}
            existingRun={currentForkliftRun}
            onComplete={(run) => {
              const result = submitForkliftRun(run);
              setMessage(result.ok ? "Final skorun kaydedildi." : result.message ?? "Final skoru gönderilemedi.");
            }}
          />
        ) : null}

        {state.phase === "finished" ? (
          <section className="rounded-[1.75rem] border border-white/25 bg-white/[0.15] p-6 text-center shadow-lg shadow-blue-950/10">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-200">Final Sonuçları</p>
            <h2 className="mt-4 text-4xl font-black text-white">{ownRank ? `${ownRank}. sırada tamamladınız` : "Yarışma tamamlandı"}</h2>
            <Leaderboard teams={leaderboard} title="Genel Skor" limit={5} />
          </section>
        ) : null}

        {message && state.phase === "forkliftChallenge" ? (
          <p className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 p-4 text-center text-lg font-black text-emerald-100">{message}</p>
        ) : null}
      </div>
    </main>
  );
}
