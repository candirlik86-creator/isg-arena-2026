"use client";

import { AnswerDistributionChart } from "@/components/AnswerDistributionChart";
import { Leaderboard } from "@/components/Leaderboard";
import { Podium } from "@/components/Podium";
import { ProjectionFrame } from "@/components/ProjectionFrame";
import { StageBadge } from "@/components/StageBadge";
import { useGameState } from "@/hooks/useGameState";
import {
  QUIZ_INTRO_SECONDS,
  calculateQuizIntroRemainingSeconds,
  calculateRemainingSeconds,
  getAnsweredCount,
  getQuizPosition,
  getYoutubeEmbedUrl,
} from "@/lib/game-state";

const liveOptionStyles = {
  A: "border-amber-200/55 bg-amber-400/20 text-amber-100",
  B: "border-sky-200/55 bg-sky-400/20 text-sky-100",
  C: "border-emerald-200/55 bg-emerald-400/20 text-emerald-100",
  D: "border-rose-200/55 bg-rose-400/20 text-rose-100",
} as const;

const liveOptionBadgeStyles = {
  A: "bg-amber-300 text-slate-950",
  B: "bg-sky-300 text-slate-950",
  C: "bg-emerald-300 text-slate-950",
  D: "bg-rose-300 text-slate-950",
} as const;

const scoreRowStyles = [
  "border-amber-200/55 bg-amber-300/20 shadow-amber-950/25",
  "border-slate-200/45 bg-slate-100/10 shadow-slate-950/20",
  "border-orange-200/40 bg-orange-300/10 shadow-orange-950/20",
] as const;

export default function ScreenPage() {
  const { state, now, activeItem, leaderboard } = useGameState();
  const remainingSeconds = calculateRemainingSeconds(state, activeItem, now);
  const introRemainingSeconds = calculateQuizIntroRemainingSeconds(state, activeItem, now);
  const answeredCount = getAnsweredCount(state, activeItem);
  const activeQuizPosition = getQuizPosition(state, activeItem);
  const quizTimeExpired = activeItem.type === "quiz" && remainingSeconds !== null && remainingSeconds <= 0;
  const shouldShowQuizDistribution = activeItem.type === "quiz" && quizTimeExpired;
  const quizInProgress = state.phase === "quiz" && activeItem.type === "quiz" && !quizTimeExpired;

  if (quizInProgress && activeItem.type === "quiz") {
    const liveRemainingSeconds = remainingSeconds ?? activeItem.timeLimitSeconds;
    const liveProgress = Math.max(0, Math.min(100, (liveRemainingSeconds / activeItem.timeLimitSeconds) * 100));

    return (
      <main className="min-h-screen overflow-hidden bg-slate-950 p-2 text-white md:p-4">
        <section className="mx-auto flex min-h-[calc(100vh-1rem)] max-w-[1600px] flex-col justify-center gap-7 md:min-h-[calc(100vh-2rem)] md:gap-9">
          <div className="grid gap-4 md:grid-cols-[1fr_360px]">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/30">
              <div className="flex items-end justify-between gap-5">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.28em] text-slate-300">Kalan süre</p>
                  <p className="mt-2 text-7xl font-black leading-none tabular-nums text-white md:text-8xl">{liveRemainingSeconds}</p>
                </div>
                <p className="pb-2 text-2xl font-black text-amber-100">saniye</p>
              </div>
              <div className="mt-5 h-5 overflow-hidden rounded-full bg-slate-900">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-300 to-red-500 transition-all" style={{ width: `${liveProgress}%` }} />
              </div>
            </div>

            <div className="rounded-[2rem] border border-emerald-300/35 bg-emerald-400/10 p-5 text-center shadow-2xl shadow-black/30">
              <p className="text-sm font-black uppercase tracking-[0.28em] text-emerald-100">Cevap sayısı</p>
              <p className="mt-3 text-5xl font-black leading-none text-white md:text-6xl">{answeredCount} cevap</p>
              <p className="mt-3 text-2xl font-black text-slate-200">
                {answeredCount} / {state.teams.length} takım
              </p>
            </div>
          </div>

          <h1 className="text-center text-4xl font-black leading-tight text-white md:text-6xl lg:text-7xl">{activeItem.title}</h1>

          <div className="grid gap-4 md:grid-cols-2">
            {activeItem.options.map((option) => (
              <article
                key={option.id}
                className={`min-h-32 rounded-[2rem] border p-5 shadow-2xl shadow-black/25 md:min-h-40 md:p-6 ${liveOptionStyles[option.id]}`}
              >
                <div className="flex h-full items-center gap-5">
                  <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl font-black shadow-xl md:h-20 md:w-20 md:text-4xl ${liveOptionBadgeStyles[option.id]}`}>
                    {option.id}
                  </div>
                  <p className="text-2xl font-black leading-tight text-white md:text-4xl">{option.text}</p>
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
      <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#164e63_0%,transparent_34%),radial-gradient(circle_at_bottom,#7c2d12_0%,transparent_30%),#020617] p-4 text-white md:p-8">
        <section className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl flex-col justify-center md:min-h-[calc(100vh-4rem)]">
          <h1 className="text-center text-6xl font-black leading-none text-white md:text-8xl">Puan Tablosu</h1>

          <div className="mt-10 space-y-4 md:mt-12 md:space-y-5">
            {rankedTeams.length ? (
              rankedTeams.map((team, index) => {
                const rank = index + 1;
                const rowStyle = scoreRowStyles[index] ?? "border-white/10 bg-white/[0.07] shadow-black/20";

                return (
                  <article
                    key={team.id}
                    className={`grid grid-cols-[86px_minmax(0,1fr)_260px] items-center gap-5 rounded-[1.75rem] border px-5 py-4 shadow-2xl backdrop-blur md:grid-cols-[104px_minmax(0,1fr)_320px] md:px-7 md:py-5 ${rowStyle}`}
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-4xl font-black tabular-nums text-slate-950 shadow-xl md:h-20 md:w-20 md:text-5xl">
                      {rank}
                    </div>
                    <h2 className="truncate text-4xl font-black leading-tight text-white md:text-6xl">{team.name}</h2>
                    <p className="text-right text-4xl font-black tabular-nums text-amber-100 md:text-6xl">
                      {team.score.toLocaleString("tr-TR")}
                    </p>
                  </article>
                );
              })
            ) : (
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-10 text-center text-5xl font-black text-slate-200">
                Henüz takım yok.
              </div>
            )}
          </div>
        </section>
      </main>
    );
  }

  return (
    <ProjectionFrame compactScreen>
      {state.phase === "lobby" ? (
        <section className="grid min-h-[68vh] items-center gap-8 xl:grid-cols-[1fr_0.9fr]">
          <div>
            <StageBadge label="Lobi açık" tone="green" />
            <h2 className="mt-6 text-5xl font-black leading-tight text-white md:text-7xl">{state.settings.welcomeTitle}</h2>
            <p className="mt-5 text-3xl font-bold text-amber-200">{state.settings.subtitle}</p>
            <div className="mt-10 rounded-[3rem] border border-amber-300/40 bg-amber-300/15 p-8 text-center shadow-2xl shadow-amber-900/20">
              <p className="text-xl font-black uppercase tracking-[0.4em] text-amber-100">Oyun PIN'i</p>
              <p className="mt-5 text-[8rem] font-black leading-none tracking-[0.16em] text-white md:text-[12rem]">{state.settings.gamePin}</p>
              <p className="mt-5 text-3xl font-black text-white">Katılım adresi: /join</p>
            </div>
          </div>
          <div className="rounded-[2.5rem] border border-white/10 bg-slate-950/75 p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-4xl font-black text-white">Katılan Takımlar</h3>
              <p className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-xl font-black text-emerald-100">
                {state.teams.length}/{state.settings.maxTeams}
              </p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {state.teams.length ? (
                state.teams.map((team, index) => (
                  <div key={team.id} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                    <p className="text-sm font-black uppercase tracking-widest text-amber-200">Takım {index + 1}</p>
                    <p className="mt-1 text-2xl font-black text-white">{team.name}</p>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center text-xl font-bold text-slate-400 sm:col-span-2">
                  Takımlar PIN ile bağlanmayı bekliyor.
                </p>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {state.phase === "quizIntro" && activeItem.type === "quiz" ? (
        <section className="grid min-h-[68vh] items-center gap-8 xl:grid-cols-[1fr_340px]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <StageBadge
                label={`Soru ${activeQuizPosition?.current ?? activeItem.quizNumber} / ${
                  activeQuizPosition?.total ?? activeItem.quizNumber
                }`}
              />
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-black text-slate-200">
                {activeItem.topic}
              </span>
            </div>
            <p className="mt-8 text-sm font-black uppercase tracking-[0.32em] text-amber-200">{activeItem.stage}</p>
            <h2 className="mt-5 text-6xl font-black leading-tight text-white md:text-8xl">{activeItem.title}</h2>
          </div>
          <div className="rounded-[2.5rem] border border-amber-300/35 bg-amber-300/10 p-8 text-center shadow-2xl shadow-amber-950/30">
            <p className="text-sm font-black uppercase tracking-[0.34em] text-amber-100">Hazırlan</p>
            <p className="mt-5 text-[10rem] font-black leading-none tabular-nums text-white">
              {introRemainingSeconds ?? QUIZ_INTRO_SECONDS}
            </p>
            <p className="mt-5 text-2xl font-black text-slate-100">Şıklar birazdan açılacak</p>
          </div>
        </section>
      ) : null}

      {state.phase === "quiz" && activeItem.type === "quiz" ? (
        shouldShowQuizDistribution ? (
          <section className="space-y-5">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.94),rgba(2,6,23,0.86))] p-6 shadow-2xl shadow-black/35 md:p-8">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/70 to-transparent" />
              <div className="relative flex flex-wrap items-start justify-between gap-5">
                <div className="min-w-0 flex-1">
                  <StageBadge label={`Soru ${activeQuizPosition?.current ?? activeItem.quizNumber} / ${activeQuizPosition?.total ?? activeItem.quizNumber}`} />
                  <p className="mt-5 text-sm font-black uppercase tracking-[0.28em] text-amber-100">{activeItem.stage}</p>
                  <h2 className="mt-3 text-4xl font-black leading-tight text-white md:text-6xl">{activeItem.title}</h2>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-right shadow-xl">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Konu</p>
                  <p className="mt-1 text-2xl font-black text-white">{activeItem.topic}</p>
                </div>
              </div>
            </div>
            <AnswerDistributionChart state={state} question={activeItem} />
          </section>
        ) : null
      ) : null}

      {state.phase === "infoSlide" && activeItem.type === "infoSlide" ? (
        <section className="grid min-h-[68vh] items-center gap-8 xl:grid-cols-[1fr_0.85fr]">
          <div>
            <StageBadge label="Bilgilendirme" tone="blue" />
            <h2 className="mt-6 text-6xl font-black leading-tight text-white md:text-8xl">{activeItem.title}</h2>
            <p className="mt-8 text-3xl font-semibold leading-relaxed text-slate-200">{activeItem.description}</p>
          </div>
          <div className="rounded-[3rem] border border-sky-300/20 bg-sky-400/10 p-8 shadow-2xl">
            {activeItem.imageUrl ? (
              <img src={activeItem.imageUrl} alt="" className="h-full max-h-[560px] w-full rounded-[2rem] object-cover" />
            ) : (
              <div className="flex min-h-[420px] items-center justify-center rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 text-center">
                <p className="text-5xl font-black leading-tight text-amber-200">Bil, Fark Et, Güvenli Karar Ver</p>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {state.phase === "mediaSlide" && activeItem.type === "mediaSlide" ? (
        <section className="space-y-6">
          <div>
            <StageBadge label="Medya Slaytı" tone="blue" />
            <h2 className="mt-4 text-6xl font-black text-white">{activeItem.title}</h2>
            <p className="mt-3 text-2xl font-semibold text-slate-300">{activeItem.description}</p>
            {!activeItem.uploadedImageDataUrl && activeItem.mediaUrl ? (
              <a
                href={activeItem.mediaUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 block break-all rounded-2xl border border-sky-300/25 bg-sky-400/10 p-4 text-xl font-black text-sky-100"
              >
                Medya URL: {activeItem.mediaUrl}
              </a>
            ) : null}
          </div>
          <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950 shadow-2xl">
            {activeItem.uploadedImageDataUrl ? (
              <img src={activeItem.uploadedImageDataUrl} alt="" className="max-h-[68vh] w-full object-contain" />
            ) : activeItem.mediaType === "youtube" ? (
              <iframe
                title={activeItem.title}
                src={getYoutubeEmbedUrl(activeItem.mediaUrl)}
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <img src={activeItem.mediaUrl} alt="" className="max-h-[68vh] w-full object-cover" />
            )}
          </div>
        </section>
      ) : null}

      {state.phase === "forkliftChallenge" && activeItem.type === "forkliftChallenge" ? (
        <section className="grid min-h-[68vh] items-center gap-8 xl:grid-cols-[1fr_0.8fr]">
          <div>
            <StageBadge label="Final özel etap" tone="red" />
            <h2 className="mt-6 text-6xl font-black leading-tight text-white md:text-8xl">{activeItem.title}</h2>
            <p className="mt-6 text-3xl font-black text-amber-200">{activeItem.message}</p>
            <p className="mt-5 text-2xl font-semibold leading-relaxed text-slate-300">{activeItem.description}</p>
          </div>
          <div className="rounded-[3rem] border border-emerald-300/30 bg-emerald-400/10 p-8 text-center shadow-2xl">
            <p className="text-sm font-black uppercase tracking-[0.34em] text-emerald-200">Canlı final durumu</p>
            <p className="mt-6 text-8xl font-black text-white">{answeredCount}</p>
            <p className="mt-3 text-3xl font-black text-slate-200">/{state.teams.length} takım parkuru tamamladı</p>
            <div className="mt-8">
              <Leaderboard teams={leaderboard} title="Final Skorları" limit={3} />
            </div>
          </div>
        </section>
      ) : null}

      {state.phase === "finished" ? <Podium teams={leaderboard} settings={state.settings} /> : null}
    </ProjectionFrame>
  );
}
