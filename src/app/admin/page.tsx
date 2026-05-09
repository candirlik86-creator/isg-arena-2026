"use client";

import { ContentFlowEditor } from "@/components/ContentFlowEditor";
import { Leaderboard } from "@/components/Leaderboard";
import { ProjectionFrame } from "@/components/ProjectionFrame";
import { QuestionCard } from "@/components/QuestionCard";
import { StageBadge } from "@/components/StageBadge";
import { useGameState } from "@/hooks/useGameState";
import {
  calculateRemainingSeconds,
  getQuestionLabel,
  getQuizAnswerBreakdown,
  getQuizAnswerStatusLabel,
  getQuizPosition,
  type QuizAnswerBreakdown,
} from "@/lib/game-state";
import { downloadResultsCsv } from "@/lib/game-store";

const controlButton = "rounded-2xl px-5 py-4 text-base font-black shadow-xl transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40";
const amberButton = `${controlButton} bg-amber-300 text-slate-950 shadow-amber-500/20`;
const greenButton = `${controlButton} border border-emerald-300/40 bg-emerald-400/15 text-emerald-100`;
const blueButton = `${controlButton} border border-sky-300/40 bg-sky-400/15 text-sky-100`;
const redButton = `${controlButton} border border-red-300/40 bg-red-400/15 text-red-100`;
const inputClass = "mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-lg font-black text-white outline-none focus:border-amber-300";
const answerOptionIds = ["A", "B", "C", "D"] as const;

function AdminAnswerBreakdown({ breakdown }: { breakdown: QuizAnswerBreakdown }) {
  const statusClass = {
    correct: "border-emerald-300/40 bg-emerald-400/15 text-emerald-100",
    wrong: "border-red-300/40 bg-red-400/15 text-red-100",
    pending: "border-amber-300/40 bg-amber-300/15 text-amber-100",
    unanswered: "border-slate-500/40 bg-slate-700/30 text-slate-200",
  };

  return (
    <section className="rounded-[2.5rem] border border-white/10 bg-slate-950/80 p-6 shadow-2xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.3em] text-emerald-200">Cevap Dökümü</p>
          <h2 className="mt-2 text-3xl font-black text-white">Aktif Quiz Paneli</h2>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-right">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Cevap durumu</p>
          <p className="text-3xl font-black text-white">
            Cevap: {breakdown.answeredTeams} / {breakdown.totalTeams}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Toplam takım", breakdown.totalTeams],
          ["Cevap veren", breakdown.answeredTeams],
          ["Cevap vermeyen", breakdown.unansweredTeams],
          ["Doğru cevap", breakdown.correctAnswers],
          ["Yanlış cevap", breakdown.wrongAnswers],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
            <p className="mt-2 text-3xl font-black tabular-nums text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {answerOptionIds.map((optionId) => (
          <div key={optionId} className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-center">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-100">{optionId} seçeneği</p>
            <p className="mt-2 text-4xl font-black tabular-nums text-white">{breakdown.optionCounts[optionId]}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 max-h-[520px] overflow-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead className="sticky top-0 bg-slate-950 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            <tr>
              <th className="px-4 py-3">Takım</th>
              <th className="px-4 py-3">Cevap</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3 text-right">Soru puanı</th>
              <th className="px-4 py-3 text-right">Toplam puan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {breakdown.rows.length ? (
              breakdown.rows.map((row) => (
                <tr key={row.teamId} className="bg-white/[0.03]">
                  <td className="px-4 py-3 text-base font-black text-white">{row.teamName}</td>
                  <td className="px-4 py-3 text-base font-bold text-slate-100">{row.selectedOptionId ?? "Cevap yok"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-widest ${statusClass[row.status]}`}>
                      {getQuizAnswerStatusLabel(row.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-base font-black tabular-nums text-amber-100">
                    {row.questionScore.toLocaleString("tr-TR")}
                  </td>
                  <td className="px-4 py-3 text-right text-base font-black tabular-nums text-white">
                    {row.totalScore.toLocaleString("tr-TR")}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-center text-base font-bold text-slate-400" colSpan={5}>
                  Henüz takım yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function AdminPage() {
  const {
    state,
    now,
    activeItem,
    leaderboard,
    answeredCount,
    resetGame,
    updateSettings,
    openLobby,
    startActiveItem,
    nextItem,
    lockAnswers,
    revealCorrectAnswer,
    showLeaderboard,
    finishGame,
    addFlowItem,
    updateFlowItem,
    deleteFlowItem,
    duplicateFlowItem,
    moveFlowItem,
    restoreDefaultFlow,
    goToItem,
  } = useGameState();

  const hasFlowItems = state.flowItems.length > 0;
  const remainingSeconds = calculateRemainingSeconds(state, activeItem, now);
  const activeIndexLabel = hasFlowItems ? `${state.activeItemIndex + 1}/${state.flowItems.length}` : "Akış boş";
  const activeQuizPosition = getQuizPosition(state, activeItem);
  const activeQuizBreakdown = hasFlowItems && activeItem.type === "quiz" ? getQuizAnswerBreakdown(state, activeItem) : null;
  const displayedAnsweredCount = hasFlowItems ? activeQuizBreakdown?.answeredTeams ?? answeredCount : 0;
  const displayedTeamCount = hasFlowItems ? activeQuizBreakdown?.totalTeams ?? state.teams.length : state.teams.length;

  return (
    <ProjectionFrame eyebrow="Admin Paneli" title="Yarışma Kontrol Merkezi">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-6">
          <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <StageBadge label="Aktif akış öğesi" tone="green" />
                <h2 className="mt-4 text-4xl font-black text-white">
                  {hasFlowItems ? `${getQuestionLabel(activeItem, state)}: ${activeItem.title}` : "Akışta öğe yok"}
                </h2>
                <p className="mt-2 text-lg font-semibold text-slate-300">
                  Durum: {state.phase} · Akış: {activeIndexLabel}
                  {remainingSeconds !== null ? ` · Kalan süre: ${remainingSeconds} sn` : ""}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">PIN</p>
                  <p className="text-4xl font-black text-amber-300">{state.settings.gamePin}</p>
                </div>
                <div className="rounded-2xl bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Takım</p>
                  <p className="text-4xl font-black text-white">{state.teams.length}</p>
                </div>
                <div className="rounded-2xl bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Cevap durumu</p>
                  <p className="text-3xl font-black text-emerald-200">
                    Cevap: {displayedAnsweredCount} / {displayedTeamCount}
                  </p>
                  {activeQuizBreakdown && state.showCorrectAnswer ? (
                    <p className="mt-2 text-xs font-black text-slate-300">
                      Doğru: {activeQuizBreakdown.correctAnswers} · Yanlış: {activeQuizBreakdown.wrongAnswers} · Cevapsız:{" "}
                      {activeQuizBreakdown.unansweredTeams}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <button type="button" onClick={openLobby} className={blueButton}>Lobiyi Aç</button>
              <button type="button" onClick={startActiveItem} disabled={!hasFlowItems} className={amberButton}>Soruyu/Slaytı Başlat</button>
              <button type="button" onClick={nextItem} disabled={!hasFlowItems} className={greenButton}>Sonraki Öğe</button>
              <button type="button" onClick={lockAnswers} disabled={!hasFlowItems} className={blueButton}>Cevapları Kilitle</button>
              <button type="button" onClick={revealCorrectAnswer} disabled={!hasFlowItems || activeItem.type !== "quiz"} className={greenButton}>Doğru Cevabı Göster</button>
              <button type="button" onClick={showLeaderboard} className={blueButton}>Lider Tablosu Göster</button>
              <button type="button" onClick={finishGame} className={amberButton}>Final Sonuçları</button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Oyunu sıfırlamak ve yeni PIN üretmek istiyor musunuz?")) {
                    resetGame();
                  }
                }}
                className={redButton}
              >
                Oyunu Sıfırla
              </button>
            </div>
          </div>

          {hasFlowItems && activeItem.type === "quiz" ? (
            <QuestionCard
              question={activeItem}
              compact
              showCorrectAnswer={state.showCorrectAnswer}
              quizNumber={activeQuizPosition?.current}
              quizTotal={activeQuizPosition?.total}
            />
          ) : hasFlowItems ? (
            <div className="rounded-[2.5rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl">
              <StageBadge label={getQuestionLabel(activeItem, state)} tone={activeItem.type === "forkliftChallenge" ? "red" : "blue"} />
              <h2 className="mt-5 text-5xl font-black text-white">{activeItem.title}</h2>
              <p className="mt-4 text-2xl font-semibold leading-relaxed text-slate-300">
                {"description" in activeItem ? activeItem.description : "Final etap hazır."}
              </p>
              {activeItem.type === "forkliftChallenge" ? (
                <p className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-5 text-2xl font-black text-amber-100">{activeItem.message}</p>
              ) : null}
            </div>
          ) : (
            <div className="rounded-[2.5rem] border border-red-300/30 bg-red-400/10 p-8 shadow-2xl">
              <StageBadge label="Boş akış" tone="red" />
              <h2 className="mt-5 text-4xl font-black text-white">Yarışma akışında içerik yok</h2>
              <p className="mt-3 text-xl font-semibold text-slate-200">Akış Editörü üzerinden yeni içerik ekleyin veya varsayılan akışı geri yükleyin.</p>
            </div>
          )}

          {activeQuizBreakdown ? <AdminAnswerBreakdown breakdown={activeQuizBreakdown} /> : null}

          <ContentFlowEditor
            state={state}
            onSelectItem={goToItem}
            onAddItem={addFlowItem}
            onUpdateItem={updateFlowItem}
            onDeleteItem={deleteFlowItem}
            onDuplicateItem={duplicateFlowItem}
            onMoveItem={moveFlowItem}
            onRestoreDefaultFlow={restoreDefaultFlow}
          />
        </section>

        <aside className="space-y-6">
          <section className="rounded-[2.5rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.28em] text-amber-200">Yarışma Ayarları</p>
                <h2 className="mt-2 text-3xl font-black text-white">Canlı Düzenle</h2>
              </div>
              <button type="button" onClick={() => downloadResultsCsv(state)} className="rounded-2xl bg-emerald-300 px-4 py-3 text-sm font-black text-slate-950">
                Sonuçları CSV İndir
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Yarışma başlığı</span>
                <textarea
                  value={state.settings.welcomeTitle}
                  onChange={(event) => updateSettings({ welcomeTitle: event.target.value })}
                  className={`${inputClass} min-h-24 resize-none`}
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Maksimum takım</span>
                <input value={state.settings.maxTeams} onChange={(event) => updateSettings({ maxTeams: Number(event.target.value) })} type="number" min={1} className={inputClass} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">1. ödül</span>
                  <input value={state.settings.prizeFirst} onChange={(event) => updateSettings({ prizeFirst: Number(event.target.value) })} type="number" min={0} className={inputClass} />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">2. ödül</span>
                  <input value={state.settings.prizeSecond} onChange={(event) => updateSettings({ prizeSecond: Number(event.target.value) })} type="number" min={0} className={inputClass} />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">3. ödül</span>
                  <input value={state.settings.prizeThird} onChange={(event) => updateSettings({ prizeThird: Number(event.target.value) })} type="number" min={0} className={inputClass} />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Takım kişi sayısı</span>
                  <input value={state.settings.teamSize} onChange={(event) => updateSettings({ teamSize: Number(event.target.value) })} type="number" min={1} className={inputClass} />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Para birimi</span>
                <input value={state.settings.currency} onChange={(event) => updateSettings({ currency: event.target.value.toLocaleUpperCase("tr-TR") })} className={inputClass} />
              </label>
            </div>
          </section>

          <Leaderboard teams={leaderboard} title="Canlı Lider Tablosu" limit={5} />
        </aside>
      </div>
    </ProjectionFrame>
  );
}
