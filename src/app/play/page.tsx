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
  const correctOption = activeItem.type === "quiz" ? activeItem.options.find((option) => option.id === activeItem.correctOptionId) : undefined;
  const activeQuizPosition = getQuizPosition(state, activeItem);
  const quizTimeExpired = activeItem.type === "quiz" && remainingSeconds !== null && remainingSeconds <= 0;
  const shouldShowQuizResult = activeItem.type === "quiz" && (quizTimeExpired || state.showCorrectAnswer);

  if (!currentTeam) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1e3a8a_0%,transparent_34%),#020617] p-4 text-white">
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1e3a8a_0%,transparent_34%),#020617] p-4 text-white">
      <div className="mx-auto max-w-2xl space-y-5">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl">
          <StageBadge label="Mobil cevap ekranı" />
          <div className="mt-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Takım</p>
              <h1 className="mt-1 text-3xl font-black text-white">{currentTeam.name}</h1>
            </div>
            <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-right">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-200">PIN</p>
              <p className="text-2xl font-black text-white">{state.settings.gamePin}</p>
            </div>
          </div>
        </header>

        {state.phase === "lobby" ? (
          <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 text-center shadow-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-emerald-200">Lobi</p>
            <h2 className="mt-4 text-4xl font-black text-white">Yarışma başlamak üzere</h2>
            <p className="mt-3 text-lg font-semibold text-slate-300">Projeksiyon ekranını takip edin.</p>
          </section>
        ) : null}

        {state.phase === "quizIntro" && activeItem.type === "quiz" ? (
          <section className="rounded-[2rem] border border-amber-300/30 bg-amber-300/10 p-6 text-center shadow-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-100">Hazır ol</p>
            <h2 className="mt-4 text-4xl font-black text-white">Soru geliyor</h2>
            <p className="mt-3 text-xl font-black text-slate-100">
              Soru {activeQuizPosition?.current ?? activeItem.quizNumber}/{activeQuizPosition?.total ?? activeItem.quizNumber}
            </p>
            <p className="mt-6 text-8xl font-black tabular-nums text-white">{introRemainingSeconds ?? QUIZ_INTRO_SECONDS}</p>
            <p className="mt-5 text-lg font-semibold text-slate-200">Cevap seçenekleri birazdan açılacak.</p>
          </section>
        ) : null}

        {state.phase === "quiz" && activeItem.type === "quiz" ? (
          <>
            <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-5 shadow-2xl">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-200">
                  Soru {activeQuizPosition?.current ?? activeItem.quizNumber}/{activeQuizPosition?.total ?? activeItem.quizNumber}
                </p>
                <p className="rounded-full bg-emerald-400/15 px-4 py-2 text-sm font-black text-emerald-100">{activeItem.topic}</p>
              </div>
              <h2 className="mt-5 text-3xl font-black leading-tight">{activeItem.title}</h2>
            </section>

            <Countdown seconds={remainingSeconds ?? activeItem.timeLimitSeconds} totalSeconds={activeItem.timeLimitSeconds} label="Telefon süresi" />

            <AnswerButtons
              options={activeItem.options}
              selectedOptionId={currentAnswer?.optionId ?? selectedOptionId}
              correctOptionId={state.showCorrectAnswer ? activeItem.correctOptionId : undefined}
              onSelect={submitAnswer}
              disabled={answerDisabled}
            />

            {shouldShowQuizResult && currentAnswer ? (
              <div
                className={`rounded-[2rem] border p-6 text-center shadow-2xl ${
                  currentAnswer.isCorrect ? "border-emerald-300/40 bg-emerald-400/15" : "border-red-300/40 bg-red-400/15"
                }`}
              >
                <div
                  className={`mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] text-6xl font-black ${
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
                {correctOption ? (
                  <p className="mt-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-lg font-bold text-slate-100">
                    Doğru cevap: {correctOption.id} - {correctOption.text}
                  </p>
                ) : null}
                <p className={`mt-4 text-xl font-black ${currentAnswer.isCorrect ? "text-emerald-100" : "text-red-100"}`}>
                  {currentAnswer.isCorrect ? "Güvenli karar!" : "Bir sonraki soruda dikkat!"}
                </p>
              </div>
            ) : message || currentAnswer ? (
              <div className="rounded-[2rem] border border-emerald-300/30 bg-emerald-400/15 p-5 text-center">
                <p className="text-2xl font-black text-emerald-100">
                  {message || "Cevabın alındı. Sonuç bekleniyor."}
                </p>
              </div>
            ) : null}

            {shouldShowQuizResult && !currentAnswer ? (
              <div className="rounded-[2rem] border border-red-300/40 bg-red-400/15 p-6 text-center shadow-2xl">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-red-400 text-5xl font-black text-white">!</div>
                <p className="mt-5 text-4xl font-black text-red-100">Cevap verilmedi</p>
                <p className="mt-3 text-2xl font-black text-white">Kazanılan puan: 0</p>
                <p className="mt-2 text-xl font-black text-slate-100">Toplam puan: {currentTeamTotalScore.toLocaleString("tr-TR")}</p>
                {correctOption ? (
                  <p className="mt-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-lg font-bold text-slate-100">
                    Doğru cevap: {correctOption.id} - {correctOption.text}
                  </p>
                ) : null}
                <p className="mt-4 text-xl font-black text-red-100">Bir sonraki soruda dikkat!</p>
              </div>
            ) : null}
          </>
        ) : null}

        {(state.phase === "infoSlide" || state.phase === "mediaSlide") && (activeItem.type === "infoSlide" || activeItem.type === "mediaSlide") ? (
          <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 text-center shadow-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-sky-200">Bekleme</p>
            <h2 className="mt-4 text-3xl font-black text-white">{activeItem.title}</h2>
            {"description" in activeItem ? <p className="mt-3 text-lg font-semibold text-slate-300">{activeItem.description}</p> : null}
            {activeItem.type === "mediaSlide" && activeItem.mediaUrl ? (
              <p className="mt-3 break-all text-sm font-bold text-sky-100">{activeItem.mediaUrl}</p>
            ) : null}
            <p className="mt-4 text-lg font-black text-slate-200">Projeksiyon ekranını takip edin.</p>
          </section>
        ) : null}

        {state.phase === "leaderboard" ? (
          <section className="space-y-5">
            <div className="rounded-[2rem] border border-amber-300/30 bg-amber-300/10 p-6 text-center shadow-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-200">Ara sıralama</p>
              <h2 className="mt-3 text-4xl font-black text-white">{ownRank ? `${ownRank}. sıradasınız` : "Sıralama bekleniyor"}</h2>
            </div>
            <Leaderboard teams={leaderboard} title="İlk 5" limit={5} />
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
          <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 text-center shadow-2xl">
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
