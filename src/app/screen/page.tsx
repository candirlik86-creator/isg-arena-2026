"use client";

import { AnswerDistributionChart } from "@/components/AnswerDistributionChart";
import { FinalRoundScreen } from "@/components/FinalRoundScreen";
import { Leaderboard } from "@/components/Leaderboard";
import { LobbyTeamGrid } from "@/components/LobbyTeamGrid";
import { Podium } from "@/components/Podium";
import { ProjectionFrame } from "@/components/ProjectionFrame";
import { ScreenProductMark } from "@/components/ScreenProductMark";
import { StageBadge } from "@/components/StageBadge";
import { useGameState } from "@/hooks/useGameState";
import { getScreenSurfaceAttributes, resolveBrandSettings } from "@/lib/brand-theme";
import {
  QUIZ_INTRO_SECONDS,
  calculateQuizIntroRemainingSeconds,
  calculateRemainingSeconds,
  getAnsweredCount,
  getFlowItemMedia,
  getQuizPosition,
  getYoutubeEmbedUrl,
  inferMediaType,
} from "@/lib/game-state";
import { useEffect, useState } from "react";

const liveOptionStyles = {
  A: "border-yellow-100/65 bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-500 shadow-amber-950/30",
  B: "border-sky-100/65 bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 shadow-blue-950/30",
  C: "border-emerald-100/65 bg-gradient-to-br from-emerald-400 via-teal-500 to-green-600 shadow-emerald-950/30",
  D: "border-rose-100/65 bg-gradient-to-br from-rose-400 via-red-500 to-pink-600 shadow-rose-950/30",
} as const;

const liveOptionBadgeStyles = {
  A: "bg-white text-slate-950",
  B: "bg-white text-slate-950",
  C: "bg-white text-slate-950",
  D: "bg-white text-slate-950",
} as const;

const scoreRowStyles = [
  "border-amber-100/65 bg-gradient-to-r from-amber-300/30 via-white/[0.18] to-white/[0.14] shadow-blue-900/20",
  "border-cyan-100/45 bg-gradient-to-r from-white/[0.22] via-cyan-100/15 to-white/[0.12] shadow-blue-900/20",
  "border-orange-100/50 bg-gradient-to-r from-orange-300/25 via-white/[0.16] to-white/[0.12] shadow-blue-900/20",
] as const;

function ScreenMedia({ mediaUrl, title }: { mediaUrl: string; title: string }) {
  const [imageError, setImageError] = useState(false);
  const mediaType = inferMediaType(mediaUrl);

  if (mediaType === "image") {
    if (imageError) {
      return (
        <div className="flex h-full min-h-0 w-full items-center justify-center rounded-[clamp(0.75rem,1.5vw,1.4rem)] border border-amber-300/40 bg-amber-500/10 p-4 text-center">
          <p className="text-base font-black text-amber-100 md:text-xl">Görsel yüklenemedi. URL: {mediaUrl}</p>
        </div>
      );
    }

    return (
      <img
        src={mediaUrl}
        alt=""
        className="h-full min-h-0 w-full rounded-[clamp(0.75rem,1.5vw,1.4rem)] object-contain"
        onError={() => setImageError(true)}
      />
    );
  }

  if (mediaType === "video") {
    return <video src={mediaUrl} controls className="h-full min-h-0 w-full rounded-[clamp(0.75rem,1.5vw,1.4rem)] object-contain" />;
  }

  if (mediaType === "youtube") {
    return (
      <iframe
        title={title}
        src={getYoutubeEmbedUrl(mediaUrl)}
        className="h-full min-h-0 w-full rounded-[clamp(0.75rem,1.5vw,1.4rem)]"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full items-center justify-center rounded-[clamp(0.75rem,1.5vw,1.4rem)] border border-white/20 bg-white/[0.08] p-4 text-center">
      <p className="text-lg font-black text-slate-100 md:text-2xl">Medya eklenmedi veya bağlantı desteklenmiyor.</p>
    </div>
  );
}

export default function ScreenPage() {
  const { state, now, activeItem, leaderboard, advanceFinalRoundTimedStep } = useGameState();
  const brand = resolveBrandSettings(state.settings);
  const screenSurface = getScreenSurfaceAttributes(state.settings);
  const remainingSeconds = calculateRemainingSeconds(state, activeItem, now);
  const introRemainingSeconds = calculateQuizIntroRemainingSeconds(state, activeItem, now);
  const answeredCount = getAnsweredCount(state, activeItem);
  const activeQuizPosition = getQuizPosition(state, activeItem);
  const quizTimeExpired = activeItem.type === "quiz" && remainingSeconds !== null && remainingSeconds <= 0;
  const shouldShowQuizDistribution = activeItem.type === "quiz" && quizTimeExpired;
  const quizInProgress = state.phase === "quiz" && activeItem.type === "quiz" && !quizTimeExpired;
  const activeItemMedia = getFlowItemMedia(activeItem);

  useEffect(() => {
    const runtime = state.finalRoundRuntime;

    if (
      state.phase !== "finalRound" ||
      activeItem.type !== "finalRound" ||
      runtime?.itemId !== activeItem.id ||
      (runtime.step !== "scenario" && runtime.step !== "question")
    ) {
      return;
    }

    const question = activeItem.questions[runtime.questionIndex];
    const durationSeconds = runtime.step === "scenario" ? question.scenarioDurationSeconds : question.timeLimitSeconds;

    if (!runtime.stepStartedAt || now - runtime.stepStartedAt < durationSeconds * 1000) {
      return;
    }

    advanceFinalRoundTimedStep(activeItem.id, runtime.step, runtime.questionIndex);
  }, [activeItem, advanceFinalRoundTimedStep, now, state.finalRoundRuntime, state.phase]);

  if (state.phase === "finalRound" && activeItem.type === "finalRound") {
    return <FinalRoundScreen item={activeItem} settings={state.settings} runtime={state.finalRoundRuntime} now={now} />;
  }

  if (quizInProgress && activeItem.type === "quiz") {
    const liveRemainingSeconds = remainingSeconds ?? activeItem.timeLimitSeconds;
    const liveProgress = Math.max(0, Math.min(100, (liveRemainingSeconds / activeItem.timeLimitSeconds) * 100));
    const questionMedia = activeItemMedia;

    if (questionMedia.mediaType !== "none") {
      return (
        <main
          {...screenSurface}
          data-customer-name={undefined}
          className={`${screenSurface.className} relative box-border h-[100dvh] max-h-[100dvh] overflow-hidden p-2 text-white md:p-3`}
        >
          <ScreenProductMark productBrandName={brand.productBrandName} />
          <p className="pointer-events-none absolute right-2 top-2 z-20 max-w-[7.5rem] truncate rounded-full border border-white/25 bg-white/[0.16] px-2 py-1 text-center text-[0.58rem] font-black uppercase tracking-[0.1em] text-white/85 shadow-lg shadow-blue-950/15 backdrop-blur md:right-3 md:top-2.5 md:max-w-[8.5rem] md:px-2.5 md:text-[0.68rem]">
            {brand.customerName}
          </p>
          <section className="relative mx-auto flex h-full max-h-full min-h-0 max-w-[1720px] flex-col gap-2 overflow-hidden">
            <header className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-stretch gap-2">
              <div className="min-w-0 rounded-[clamp(0.75rem,1.25vw,1.15rem)] border border-white/30 bg-white/[0.18] p-2 shadow-2xl shadow-blue-950/25 backdrop-blur md:px-3">
                <div className="flex items-center gap-2">
                  <StageBadge label={`Soru ${activeQuizPosition?.current ?? activeItem.quizNumber} / ${activeQuizPosition?.total ?? activeItem.quizNumber}`} />
                  <div className="h-2 flex-1 overflow-hidden rounded-full border border-white/25 bg-white/25 shadow-inner">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-yellow-300 to-rose-500 shadow-lg transition-all" style={{ width: `${liveProgress}%` }} />
                  </div>
                </div>
                <h1
                  className="mt-1 line-clamp-2 break-words font-black leading-tight text-white drop-shadow-2xl"
                  style={{ fontSize: "clamp(0.95rem, 1.75vw, 2.15rem)" }}
                >
                  {activeItem.title}
                </h1>
              </div>

              <div className="mr-[clamp(4.25rem,7vw,7.25rem)] grid shrink-0 grid-cols-2 gap-1.5 md:gap-2">
                <div className="min-w-[3.5rem] rounded-[clamp(0.6rem,0.95vw,0.9rem)] border border-white/30 bg-white/[0.18] px-1.5 py-0.5 text-center shadow-2xl shadow-blue-950/25 backdrop-blur md:min-w-[4.25rem] md:px-2 md:py-1">
                  <p className="text-[7px] font-black uppercase tracking-[0.16em] text-cyan-100 md:text-[8px]">Süre</p>
                  <p className="text-2xl font-black leading-none tabular-nums text-white md:text-[1.65rem]">{liveRemainingSeconds}</p>
                </div>
                <div className="min-w-[3.5rem] rounded-[clamp(0.6rem,0.95vw,0.9rem)] border border-white/30 bg-white/[0.18] px-1.5 py-0.5 text-center shadow-2xl shadow-blue-950/25 backdrop-blur md:min-w-[4.25rem] md:px-2 md:py-1">
                  <p className="text-[7px] font-black uppercase tracking-[0.16em] text-emerald-100 md:text-[8px]">Cevap</p>
                  <p className="text-2xl font-black leading-none tabular-nums text-white md:text-[1.65rem]">{answeredCount}</p>
                </div>
              </div>
            </header>

            <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(18rem,32rem)] gap-2 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(24rem,34rem)]">
              <div className="flex min-h-0 overflow-hidden rounded-[clamp(0.9rem,1.8vw,1.7rem)] border border-white/25 bg-slate-950/45 p-2 shadow-2xl shadow-blue-950/25 backdrop-blur md:p-3">
                <ScreenMedia mediaUrl={questionMedia.mediaUrl} title={activeItem.title} />
              </div>

              <div className="grid min-h-0 grid-rows-4 gap-2 overflow-hidden">
                {activeItem.options.map((option) => (
                  <article
                    key={option.id}
                    className={`flex min-h-0 overflow-hidden rounded-[clamp(0.8rem,1.35vw,1.25rem)] border p-2 shadow-2xl backdrop-blur md:p-3 ${liveOptionStyles[option.id]}`}
                  >
                    <div className="flex min-h-0 w-full items-center gap-2 md:gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl font-black shadow-xl md:h-12 md:w-12 md:rounded-2xl md:text-2xl ${liveOptionBadgeStyles[option.id]}`}
                      >
                        {option.id}
                      </div>
                      <p
                        className="line-clamp-2 min-w-0 break-words font-black leading-tight text-white drop-shadow-lg"
                        style={{ fontSize: "clamp(0.85rem, 1.35vw, 1.65rem)" }}
                      >
                        {option.text}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </main>
      );
    }

    return (
      <main
        {...screenSurface}
        className={`${screenSurface.className} relative box-border h-[100dvh] max-h-[100dvh] overflow-hidden p-2 text-white md:p-3`}
      >
        <ScreenProductMark productBrandName={brand.productBrandName} />
        <section className="relative mx-auto grid h-full max-h-full min-h-0 max-w-[1720px] grid-rows-[80px_140px_minmax(0,1fr)] gap-3 overflow-hidden px-2 pb-6 pt-[56px] md:px-3">
          <header className="flex min-w-0 items-center gap-3 rounded-[clamp(0.85rem,1.5vw,1.4rem)] border border-white/30 bg-white/[0.18] px-3 py-2 shadow-2xl shadow-blue-950/25 backdrop-blur md:gap-4 md:px-4">
            <StageBadge label={`Soru ${activeQuizPosition?.current ?? activeItem.quizNumber} / ${activeQuizPosition?.total ?? activeItem.quizNumber}`} />
            <div className="min-w-0 flex-1">
              <div className="h-3 overflow-hidden rounded-full border border-white/25 bg-white/25 shadow-inner">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-yellow-300 to-rose-500 shadow-lg transition-all" style={{ width: `${liveProgress}%` }} />
              </div>
            </div>
            <div className="shrink-0 text-center">
              <p className="text-[0.6rem] font-black uppercase tracking-[0.18em] text-cyan-100 md:text-xs">Süre</p>
              <p className="text-[clamp(1.75rem,3vw,2.5rem)] font-black leading-none tabular-nums text-white">{liveRemainingSeconds}</p>
            </div>
            <div className="shrink-0 border-l border-white/25 pl-3 text-center md:pl-4">
              <p className="text-[0.6rem] font-black uppercase tracking-[0.18em] text-emerald-100 md:text-xs">Cevap</p>
              <p className="text-[clamp(1.5rem,2.5vw,2rem)] font-black leading-none text-white">{answeredCount}</p>
            </div>
          </header>

          <div className="flex min-h-0 items-center justify-center overflow-hidden px-3">
            <h1
              className="mx-auto line-clamp-2 max-w-[1500px] break-words text-center font-black leading-tight text-white drop-shadow-2xl"
              style={{ fontSize: "clamp(2rem, 4vw, 4rem)" }}
            >
              {activeItem.title}
            </h1>
          </div>

          <div className="grid min-h-0 grid-cols-2 grid-rows-[repeat(2,minmax(0,153px))] content-end gap-3 overflow-hidden md:gap-4">
            {activeItem.options.map((option) => (
              <article
                key={option.id}
                className={`flex h-full min-h-0 overflow-hidden rounded-[clamp(1rem,2vw,2rem)] border p-3 shadow-2xl backdrop-blur md:p-4 ${liveOptionStyles[option.id]}`}
              >
                <div className="flex min-h-0 w-full items-center gap-3 md:gap-4">
                  <div
                    className={`flex h-[clamp(3.5rem,5vw,4.5rem)] w-[clamp(3.5rem,5vw,4.5rem)] shrink-0 items-center justify-center rounded-2xl text-[clamp(1.5rem,2.25vw,2.25rem)] font-black shadow-xl ${liveOptionBadgeStyles[option.id]}`}
                  >
                    {option.id}
                  </div>
                  <p
                    className="line-clamp-2 min-w-0 break-words font-black leading-tight text-white drop-shadow-lg"
                    style={{ fontSize: "clamp(1.25rem, 2.2vw, 2.25rem)" }}
                  >
                    {option.text}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    );
  }

  if (state.phase === "leaderboard") {
    const rankedTeams = leaderboard.slice(0, 10);

    return (
      <main
        {...screenSurface}
        className={`${screenSurface.className} relative box-border h-[100dvh] max-h-[100dvh] overflow-hidden p-2 text-white md:p-4`}
      >
        <ScreenProductMark productBrandName={brand.productBrandName} />
        <section className="relative mx-auto flex h-full max-h-full min-h-0 max-w-7xl flex-col justify-center md:py-1">
          <div className="shrink-0 text-center">
            <p className="text-xs font-black uppercase tracking-[0.34em] text-amber-100 md:text-sm">Ara Skor</p>
            <h1
              className="mt-2 font-black leading-none text-white drop-shadow-2xl md:mt-3"
              style={{ fontSize: "clamp(2rem, 5vw, 5rem)" }}
            >
              Puan Tablosu
            </h1>
          </div>

          <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden pr-1 md:mt-6 md:space-y-3">
            {rankedTeams.length ? (
              rankedTeams.map((team, index) => {
                const rank = index + 1;
                const rowStyle = scoreRowStyles[index] ?? "border-white/25 bg-white/[0.14] shadow-blue-900/20";

                return (
                  <article
                    key={team.id}
                    className={`grid grid-cols-[minmax(3.5rem,1fr)_minmax(0,3fr)_minmax(5rem,1.1fr)] items-center gap-2 rounded-[1.25rem] border px-3 py-2 shadow-2xl backdrop-blur sm:gap-3 sm:rounded-[1.5rem] sm:px-5 sm:py-3 md:gap-4 md:px-6 md:py-4 ${rowStyle}`}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-2xl font-black tabular-nums text-slate-950 shadow-xl sm:h-14 sm:w-14 sm:rounded-2xl sm:text-3xl md:h-16 md:w-16 md:text-4xl">
                      {rank}
                    </div>
                    <h2 className="min-w-0 truncate text-xl font-black leading-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">{team.name}</h2>
                    <p className="text-right text-lg font-black tabular-nums text-amber-100 sm:text-2xl md:text-3xl lg:text-4xl">
                      {team.score.toLocaleString("tr-TR")}
                    </p>
                  </article>
                );
              })
            ) : (
              <div className="rounded-[2rem] border border-white/25 bg-white/[0.16] p-6 text-center text-2xl font-black text-slate-100 shadow-2xl shadow-blue-900/20 backdrop-blur md:p-8 md:text-4xl">
                Henüz takım yok.
              </div>
            )}
          </div>
        </section>
      </main>
    );
  }

  return (
    <ProjectionFrame compactScreen screenSettings={state.settings}>
      {state.phase === "lobby" ? (
        <section className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden md:gap-4">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 rounded-[clamp(1rem,2vw,2rem)] border border-white/15 border-t-white/25 bg-gradient-to-b from-white/[0.14] to-white/[0.05] px-5 py-3 shadow-2xl shadow-black/30 backdrop-blur md:px-7 md:py-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StageBadge label="Lobi açık" tone="green" />
              </div>
              <h2
                className="mt-2 truncate font-black leading-tight text-white"
                style={{ fontSize: "clamp(1.25rem, 2.8vw, 3rem)" }}
              >
                {state.settings.welcomeTitle}
              </h2>
              <p className="mt-1 text-sm font-black text-white/90 md:text-lg">
                <span className="text-amber-300">/join</span> adresinden PIN ile katıl
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-amber-300 md:text-sm">Oyun PIN'i</p>
              <p
                className="font-black leading-none tracking-[0.14em] text-white drop-shadow-2xl"
                style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
              >
                {state.settings.gamePin}
              </p>
              <div className="ml-auto mt-2 h-1 w-3/5 rounded-full bg-gradient-to-r from-transparent to-amber-500" />
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[clamp(1rem,2.5vw,2.5rem)] border border-white/15 border-t-white/25 bg-gradient-to-b from-white/[0.12] to-white/[0.045] p-4 shadow-2xl shadow-black/30 backdrop-blur md:p-5">
            <div className="flex shrink-0 items-center justify-between gap-3">
              <h3 className="text-xl font-black text-white md:text-3xl">Katılan Takımlar</h3>
              <p className="rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-base font-black text-emerald-100 md:rounded-2xl md:px-4 md:py-3 md:text-lg">
                {state.teams.length}/{state.settings.maxTeams}
              </p>
            </div>
            <LobbyTeamGrid teams={state.teams} />
          </div>
        </section>
      ) : null}

      {state.phase === "quizIntro" && activeItem.type === "quiz" ? (
        <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden xl:grid xl:grid-cols-[1fr_300px] xl:items-center xl:gap-6 2xl:grid-cols-[1fr_340px]">
          <div className="min-h-0 shrink-0 xl:overflow-y-auto xl:pr-1">
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <StageBadge
                label={`Soru ${activeQuizPosition?.current ?? activeItem.quizNumber} / ${
                  activeQuizPosition?.total ?? activeItem.quizNumber
                }`}
              />
            </div>
            <h2
              className="mt-4 font-black leading-tight text-white md:mt-6"
              style={{ fontSize: "clamp(1.35rem, 3.6vw, 4.5rem)" }}
            >
              {activeItem.title}
            </h2>
          </div>
          <div className="flex shrink-0 flex-col justify-center rounded-[clamp(1.25rem,2.5vw,2.5rem)] border border-amber-100/45 bg-amber-300/20 p-4 text-center shadow-2xl shadow-blue-950/20 backdrop-blur md:p-6">
            <p className="text-xs font-black uppercase tracking-[0.34em] text-amber-100 md:text-sm">Hazırlan</p>
            <p
              className="mt-2 font-black leading-none tabular-nums text-white md:mt-4"
              style={{ fontSize: "clamp(4rem, 16vw, 9rem)" }}
            >
              {introRemainingSeconds ?? QUIZ_INTRO_SECONDS}
            </p>
            <p className="mt-3 text-lg font-black text-slate-100 md:mt-4 md:text-xl">Şıklar birazdan açılacak</p>
          </div>
        </section>
      ) : null}

      {state.phase === "quiz" && activeItem.type === "quiz" ? (
        shouldShowQuizDistribution ? (
          <section className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden md:gap-2.5">
            <div className="relative shrink-0 overflow-hidden rounded-[clamp(0.85rem,1.5vw,1.25rem)] border border-white/25 bg-white/[0.16] p-2.5 shadow-xl shadow-blue-950/25 backdrop-blur md:p-3">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/70 to-transparent" />
              <div className="relative flex items-start justify-between gap-2 md:gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                    <StageBadge label={`Soru ${activeQuizPosition?.current ?? activeItem.quizNumber} / ${activeQuizPosition?.total ?? activeItem.quizNumber}`} />
                  </div>
                  <h2 className="mt-1 line-clamp-2 text-base font-black leading-snug text-white md:mt-1.5 md:text-xl lg:text-2xl">
                    {activeItem.title}
                  </h2>
                </div>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <AnswerDistributionChart state={state} question={activeItem} />
            </div>
          </section>
        ) : null
      ) : null}

      {state.phase === "infoSlide" && activeItem.type === "infoSlide" ? (
        activeItemMedia.mediaType !== "none" ? (
          <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.95fr)] xl:items-center xl:gap-6">
            <div className="min-h-0 shrink-0 xl:overflow-y-auto xl:pr-1">
              <StageBadge label="Bilgilendirme" tone="blue" />
              <h2
                className="mt-3 font-black leading-tight text-white md:mt-4"
                style={{ fontSize: "clamp(1.35rem, 3.5vw, 4.5rem)" }}
              >
                {activeItem.title}
              </h2>
              <p className="mt-4 text-base font-semibold leading-relaxed text-slate-200 md:mt-5 md:text-xl lg:text-2xl">{activeItem.description}</p>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden md:gap-4 xl:h-[62dvh] xl:min-h-[28rem] xl:max-h-[42rem] xl:flex-none xl:self-center">
              <div className="shrink-0 rounded-[clamp(0.9rem,1.7vw,1.4rem)] border border-sky-100/25 bg-white/[0.12] px-4 py-3 text-center shadow-xl shadow-blue-950/15 backdrop-blur md:px-5 md:py-4">
                <p className="text-base font-black leading-tight text-amber-200 md:text-xl lg:text-2xl">Bil, Fark Et, Güvenli Karar Ver</p>
              </div>
              <div className="flex min-h-[16rem] min-w-0 flex-1 overflow-hidden rounded-[clamp(1rem,2vw,2.25rem)] border border-white/20 bg-white/[0.10] p-2 shadow-2xl shadow-blue-950/20 backdrop-blur md:min-h-[22rem] md:p-3 xl:min-h-0">
                <div className="flex min-h-0 w-full overflow-hidden rounded-[clamp(0.85rem,1.6vw,1.8rem)] border border-white/10 bg-slate-950/35">
                  <ScreenMedia mediaUrl={activeItemMedia.mediaUrl} title={activeItem.title} />
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden xl:grid xl:grid-cols-[1fr_0.85fr] xl:items-center xl:gap-6">
            <div className="min-h-0 shrink-0 xl:overflow-y-auto xl:pr-1">
              <StageBadge label="Bilgilendirme" tone="blue" />
              <h2
                className="mt-3 font-black leading-tight text-white md:mt-4"
                style={{ fontSize: "clamp(1.35rem, 3.5vw, 4.5rem)" }}
              >
                {activeItem.title}
              </h2>
              <p className="mt-4 text-base font-semibold leading-relaxed text-slate-200 md:mt-5 md:text-xl lg:text-2xl">{activeItem.description}</p>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[clamp(1.25rem,2.5vw,3rem)] border border-sky-100/30 bg-white/[0.12] p-4 shadow-2xl shadow-blue-950/20 backdrop-blur md:p-6">
              <div className="flex min-h-[12rem] flex-1 items-center justify-center rounded-[clamp(1rem,2vw,2rem)] border border-white/20 bg-white/[0.12] p-4 text-center md:min-h-[14rem] md:p-6">
                <p className="text-2xl font-black leading-tight text-amber-200 md:text-4xl">Bil, Fark Et, Güvenli Karar Ver</p>
              </div>
            </div>
          </section>
        )
      ) : null}

      {state.phase === "mediaSlide" && activeItem.type === "mediaSlide" ? (
        <section className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden md:gap-4">
          <div className="shrink-0">
            <StageBadge label="Medya Slaytı" tone="blue" />
            <h2 className="mt-2 text-3xl font-black text-white md:mt-3 md:text-4xl lg:text-5xl">{activeItem.title}</h2>
            <p className="mt-2 text-base font-semibold text-slate-300 md:text-lg lg:text-xl">{activeItem.description}</p>
          </div>
          <div className="flex min-h-0 flex-1 overflow-hidden rounded-[clamp(1rem,2vw,2.5rem)] border border-white/10 bg-slate-950 p-2 shadow-2xl md:p-3">
            <ScreenMedia mediaUrl={activeItemMedia.mediaUrl} title={activeItem.title} />
          </div>
        </section>
      ) : null}

      {state.phase === "forkliftChallenge" && activeItem.type === "forkliftChallenge" ? (
        <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden xl:grid xl:grid-cols-[1fr_0.8fr] xl:items-center xl:gap-6">
          <div className="min-h-0 shrink-0 xl:overflow-y-auto xl:pr-1">
            <StageBadge label="Final özel etap" tone="red" />
            <h2
              className="mt-3 font-black leading-tight text-white md:mt-4"
              style={{ fontSize: "clamp(1.35rem, 3.5vw, 4.5rem)" }}
            >
              {activeItem.title}
            </h2>
            <p className="mt-3 text-xl font-black text-amber-200 md:mt-4 md:text-2xl">{activeItem.message}</p>
            <p className="mt-3 text-base font-semibold leading-relaxed text-slate-300 md:mt-4 md:text-lg">{activeItem.description}</p>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[clamp(1.25rem,2.5vw,3rem)] border border-emerald-100/35 bg-emerald-300/15 p-4 text-center shadow-2xl shadow-blue-950/20 backdrop-blur md:p-6">
            <p className="text-xs font-black uppercase tracking-[0.34em] text-emerald-200 md:text-sm">Canlı final durumu</p>
            <p className="mt-3 text-5xl font-black text-white md:mt-4 md:text-6xl lg:text-7xl">{answeredCount}</p>
            <p className="mt-2 text-lg font-black text-slate-200 md:text-xl">/{state.teams.length} takım parkuru tamamladı</p>
            <div className="mt-3 min-h-0 flex-1 overflow-y-auto overflow-x-hidden md:mt-4">
              <Leaderboard teams={leaderboard} title="Final Skorları" limit={3} />
            </div>
          </div>
        </section>
      ) : null}

      {state.phase === "finished" ? (
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto pr-1">
          <Podium teams={leaderboard} settings={state.settings} />
        </div>
      ) : null}
    </ProjectionFrame>
  );
}
