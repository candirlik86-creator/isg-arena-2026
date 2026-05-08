"use client";

import { Countdown } from "@/components/Countdown";
import { Leaderboard } from "@/components/Leaderboard";
import { Podium } from "@/components/Podium";
import { ProjectionFrame } from "@/components/ProjectionFrame";
import { QuestionCard } from "@/components/QuestionCard";
import { QuizResultDistribution } from "@/components/QuizResultDistribution";
import { StageBadge } from "@/components/StageBadge";
import { useGameState } from "@/hooks/useGameState";
import { calculateRemainingSeconds, getAnsweredCount, getQuizPosition, getYoutubeEmbedUrl } from "@/lib/game-state";

export default function ScreenPage() {
  const { state, now, activeItem, leaderboard } = useGameState();
  const remainingSeconds = calculateRemainingSeconds(state, activeItem, now);
  const answeredCount = getAnsweredCount(state, activeItem);
  const activeQuizPosition = getQuizPosition(state, activeItem);

  return (
    <ProjectionFrame eyebrow="Projeksiyon Ekranı" title="Canlı Yarışma Sahnesi">
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

      {state.phase === "quiz" && activeItem.type === "quiz" ? (
        <div className={`grid gap-6 ${state.showCorrectAnswer ? "xl:grid-cols-[0.95fr_1.05fr]" : "xl:grid-cols-[1fr_380px]"}`}>
          <div className="space-y-6">
            <QuestionCard
              question={activeItem}
              compact
              showCorrectAnswer={state.showCorrectAnswer}
              quizNumber={activeQuizPosition?.current}
              quizTotal={activeQuizPosition?.total}
            />
            {!state.showCorrectAnswer ? <Countdown seconds={remainingSeconds ?? activeItem.timeLimitSeconds} totalSeconds={activeItem.timeLimitSeconds} /> : null}
          </div>
          {state.showCorrectAnswer ? (
            <QuizResultDistribution state={state} question={activeItem} />
          ) : (
            <aside className="space-y-6">
              <div className="rounded-[2.5rem] border border-emerald-300/30 bg-emerald-400/10 p-6 text-center shadow-2xl">
                <p className="text-sm font-black uppercase tracking-[0.3em] text-emerald-100">Cevap Sayısı</p>
                <p className="mt-5 text-7xl font-black text-white">{answeredCount}</p>
                <p className="mt-3 text-xl font-bold text-slate-200">/{state.teams.length} takım</p>
              </div>
              <Leaderboard teams={leaderboard} title="Anlık Skor" limit={3} />
            </aside>
          )}
        </div>
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
          </div>
          <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950 shadow-2xl">
            {activeItem.mediaType === "youtube" ? (
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

      {state.phase === "leaderboard" ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_0.7fr]">
          <Leaderboard teams={leaderboard} title="Lider Tablosu" limit={10} />
          <div className="rounded-[2.5rem] border border-amber-300/30 bg-amber-300/10 p-8 shadow-2xl">
            <StageBadge label="Ara sonuç" />
            <h2 className="mt-6 text-5xl font-black leading-tight text-white">Sıralama güncellendi</h2>
            <p className="mt-5 text-2xl font-semibold text-slate-200">Bir sonraki akış öğesi için admin panelden devam edin.</p>
          </div>
        </div>
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
