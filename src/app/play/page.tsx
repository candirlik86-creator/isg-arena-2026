"use client";

import { useEffect, useMemo, useState } from "react";
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

const kahootAnswerTiles: Record<
  AnswerId,
  {
    shape: string;
    buttonClass: string;
    selectedClass: string;
  }
> = {
  A: {
    shape: "▲",
    buttonClass: "border-yellow-100/65 bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-500 shadow-amber-950/30",
    selectedClass: "ring-yellow-100/80",
  },
  B: {
    shape: "◆",
    buttonClass: "border-sky-100/65 bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 shadow-blue-950/30",
    selectedClass: "ring-sky-100/80",
  },
  C: {
    shape: "●",
    buttonClass: "border-emerald-100/65 bg-gradient-to-br from-emerald-400 via-teal-500 to-green-600 shadow-emerald-950/30",
    selectedClass: "ring-emerald-100/80",
  },
  D: {
    shape: "■",
    buttonClass: "border-rose-100/65 bg-gradient-to-br from-rose-400 via-red-500 to-pink-600 shadow-rose-950/30",
    selectedClass: "ring-rose-100/80",
  },
};

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
  const shouldShowQuizResult = activeItem.type === "quiz" && (state.showCorrectAnswer || quizTimeExpired);

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

  const submitAnswer = async (optionId: AnswerId) => {
    if (answerDisabled) {
      return;
    }

    setSelectedOptionId(optionId);
    const result = await submitQuizAnswer(optionId);

    if (!result.ok) {
      setSelectedOptionId(undefined);
    }

    setMessage(result.ok ? "Cevabın alındı. Sonuç bekleniyor." : result.message ?? "Cevap gönderilemedi.");
  };

  const quizResultCard = currentAnswer ? (
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
      <p className="mt-6 text-xs font-black uppercase tracking-[0.24em] text-blue-50">Kazanılan puan</p>
      <p className="mt-2 text-7xl font-black leading-none tabular-nums text-white">+ {currentAnswer.score.toLocaleString("tr-TR")}</p>
      <p className="mt-5 text-2xl font-black text-slate-100">Toplam puan: {currentTeamTotalScore.toLocaleString("tr-TR")}</p>
    </div>
  ) : (
    <div className="rounded-[1.75rem] border border-red-100/50 bg-red-400/25 p-6 text-center shadow-lg shadow-blue-950/10">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-red-400 text-5xl font-black text-white shadow-md">!</div>
      <p className="mt-5 text-4xl font-black text-red-100">Cevap verilmedi</p>
      <p className="mt-6 text-xs font-black uppercase tracking-[0.24em] text-blue-50">Kazanılan puan</p>
      <p className="mt-2 text-7xl font-black leading-none tabular-nums text-white">+ 0</p>
      <p className="mt-5 text-2xl font-black text-slate-100">Toplam puan: {currentTeamTotalScore.toLocaleString("tr-TR")}</p>
    </div>
  );

  const isQuizPhase = state.phase === "quiz" && activeItem.type === "quiz";
  const isPassiveContentPhase =
    (state.phase === "infoSlide" || state.phase === "mediaSlide") &&
    (activeItem.type === "infoSlide" || activeItem.type === "mediaSlide");

  if (isQuizPhase) {
    const quizNumber = activeQuizPosition?.current ?? activeItem.quizNumber;
    const quizTotal = activeQuizPosition?.total ?? activeItem.quizNumber;
    const selectedAnswerId = currentAnswer?.optionId ?? selectedOptionId;
    const isWaitingForQuizResult = Boolean(currentAnswer || selectedOptionId) && !shouldShowQuizResult;
    const statusMessage = isWaitingForQuizResult ? "" : message;

    if (shouldShowQuizResult) {
      return (
        <main className="arena-play-bg min-h-[100svh] p-3 text-white">
          <div className="mx-auto flex min-h-[calc(100svh-1.5rem)] max-w-2xl flex-col justify-center">
            {quizResultCard}
          </div>
        </main>
      );
    }

    if (isWaitingForQuizResult) {
      return (
        <main className="arena-play-bg min-h-[100svh] overflow-hidden p-3 text-white">
          <div className="mx-auto flex min-h-[calc(100svh-1.5rem)] max-w-2xl flex-col justify-center">
            <section className="rounded-[1.75rem] border border-white/25 bg-white/[0.16] p-7 text-center shadow-lg shadow-blue-950/10 backdrop-blur">
              <p className="text-3xl font-black leading-tight text-white">Cevabın alındı. Sonuç bekleniyor.</p>
              <p className="mt-4 text-xl font-black leading-tight text-blue-50">Sonuç projeksiyon ekranında açıklanacak.</p>
            </section>
          </div>
        </main>
      );
    }

    return (
      <main className="arena-play-bg min-h-[100svh] overflow-hidden p-3 text-white">
        <div className="mx-auto flex min-h-[calc(100svh-1.5rem)] max-w-2xl flex-col gap-3">
          <header className="shrink-0 rounded-2xl border border-white/20 bg-white/[0.14] px-4 py-3 shadow-lg shadow-blue-950/10 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-100">Quiz</p>
                <p className="mt-1 text-xl font-black leading-none text-white">
                  Soru {quizNumber} / {quizTotal}
                </p>
              </div>
              <div className="shrink-0 rounded-xl border border-white/20 bg-white/[0.14] px-3 py-2 text-right">
                <p className="text-[0.65rem] font-black uppercase tracking-widest text-blue-100">Süre</p>
                <p className="text-2xl font-black leading-none tabular-nums text-white">{remainingSeconds ?? activeItem.timeLimitSeconds}</p>
              </div>
            </div>
          </header>

          <section className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-3" aria-label="Cevap seçenekleri">
            {activeItem.options.map((option) => {
              const tile = kahootAnswerTiles[option.id];
              const isSelected = selectedAnswerId === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  aria-label={`Cevap ${option.id}`}
                  disabled={answerDisabled}
                  onClick={() => submitAnswer(option.id)}
                  className={`flex min-h-0 flex-col items-center justify-center rounded-2xl border p-3 text-white shadow-2xl transition duration-150 active:scale-[0.98] ${
                    tile.buttonClass
                  } ${isSelected ? `ring-4 ${tile.selectedClass}` : ""} ${answerDisabled ? "cursor-not-allowed opacity-80" : ""}`}
                >
                  <span className="text-5xl font-black leading-none drop-shadow sm:text-6xl">{tile.shape}</span>
                  <span className="mt-3 text-6xl font-black leading-none drop-shadow sm:text-7xl">{option.id}</span>
                </button>
              );
            })}
          </section>

          <footer className="shrink-0 rounded-2xl border border-white/20 bg-white/[0.15] px-4 py-3 shadow-lg shadow-blue-950/10 backdrop-blur">
            {statusMessage ? (
              <p className="mb-2 rounded-xl border border-emerald-100/30 bg-emerald-400/20 px-3 py-2 text-center text-sm font-black text-emerald-50">{statusMessage}</p>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-cyan-100">Takım</p>
                <p className="truncate text-xl font-black text-white">{currentTeam.name}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-amber-100">Toplam puan</p>
                <p className="text-2xl font-black tabular-nums text-white">{currentTeamTotalScore.toLocaleString("tr-TR")}</p>
              </div>
            </div>
          </footer>
        </div>
      </main>
    );
  }

  if (isPassiveContentPhase) {
    return (
      <main className="arena-play-bg min-h-[100svh] p-3 text-white">
        <div className="mx-auto flex min-h-[calc(100svh-1.5rem)] max-w-2xl flex-col justify-center">
          <section className="rounded-[1.75rem] border border-white/25 bg-white/[0.15] p-7 text-center shadow-lg shadow-blue-950/10">
            <h2 className="text-4xl font-black text-white">Ekrana bak</h2>
            <p className="mt-4 text-xl font-black text-blue-50">Bu bölümde cevap vermen gerekmiyor</p>
          </section>
        </div>
      </main>
    );
  }

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

        {state.phase === "leaderboard" && activeItem.type === "quiz" ? (
          <section className="rounded-[1.75rem] border border-white/25 bg-white/[0.15] p-6 text-center shadow-lg shadow-blue-950/10">
            <h2 className="text-4xl font-black text-white">Ekrana bak</h2>
            <p className="mt-4 text-xl font-black text-blue-50">Sıralama projeksiyon ekranında gösterilecek</p>
          </section>
        ) : null}

        {state.phase === "forkliftChallenge" && activeItem.type === "forkliftChallenge" ? (
          <ForkliftChallenge
            item={activeItem}
            existingRun={currentForkliftRun}
            onComplete={async (run) => {
              const result = await submitForkliftRun(run);
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
