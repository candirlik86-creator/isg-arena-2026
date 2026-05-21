"use client";

import { ContentFlowEditor } from "@/components/ContentFlowEditor";
import { useGameState } from "@/hooks/useGameState";
import {
  calculateQuizIntroRemainingSeconds,
  calculateRemainingSeconds,
  getQuestionLabel,
  getQuizAnswerBreakdown,
  getQuizAnswerStatusLabel,
  getQuizPosition,
  type AnswerId,
  type ContentFlowItem,
  type GamePhase,
  type QuizAnswerBreakdown,
  type QuizFlowItem,
} from "@/lib/game-state";
import { getProductBrandInitials, resolveBrandSettings, THEME_OPTIONS } from "@/lib/brand-theme";
import { listSavedCompetitions, type SavedCompetition } from "@/lib/competition-library";
import { downloadResultsCsv } from "@/lib/game-store";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

const answerOptionIds: AnswerId[] = ["A", "B", "C", "D"];
type AdminTab = "competition" | "settings" | "library";

const adminTabs: { id: AdminTab; label: string }[] = [
  { id: "competition", label: "Yarışma" },
  { id: "settings", label: "Ayarlar" },
  { id: "library", label: "Kütüphane" },
];

const phaseLabels: Record<GamePhase, string> = {
  lobby: "Lobi",
  quizIntro: "Soru hazırlığı",
  quiz: "Aktif soru",
  infoSlide: "Bilgi slaytı",
  mediaSlide: "Medya slaytı",
  leaderboard: "Lider tablosu",
  forkliftChallenge: "Forklift finali",
  finished: "Oturum bitti",
};

const flowTypeLabels: Record<ContentFlowItem["type"], string> = {
  quiz: "Soru",
  infoSlide: "Bilgi Slaytı",
  mediaSlide: "Medya Slaytı",
  forkliftChallenge: "Forklift Etabı",
};

const flowThumbnails: Record<ContentFlowItem["type"], string> = {
  quiz: "❓",
  infoSlide: "📋",
  mediaSlide: "🎬",
  forkliftChallenge: "🏁",
};

const answerBlockStyles: Record<
  AnswerId,
  { base: string; active: string; badge: string; check: string }
> = {
  A: {
    base: "bg-amber-400 hover:bg-amber-500 hover:shadow-md",
    active: "bg-amber-500 shadow-lg shadow-amber-500/25 scale-[1.02]",
    badge: "text-amber-500",
    check: "text-amber-500",
  },
  B: {
    base: "bg-blue-500 hover:bg-blue-600 hover:shadow-md",
    active: "bg-blue-600 shadow-lg shadow-blue-600/25 scale-[1.02]",
    badge: "text-blue-600",
    check: "text-blue-600",
  },
  C: {
    base: "bg-emerald-500 hover:bg-emerald-600 hover:shadow-md",
    active: "bg-emerald-600 shadow-lg shadow-emerald-600/25 scale-[1.02]",
    badge: "text-emerald-600",
    check: "text-emerald-600",
  },
  D: {
    base: "bg-rose-500 hover:bg-rose-600 hover:shadow-md",
    active: "bg-rose-600 shadow-lg shadow-rose-600/25 scale-[1.02]",
    badge: "text-rose-600",
    check: "text-rose-600",
  },
};

const correctAnswerChipStyles: Record<AnswerId, string> = {
  A: "bg-amber-500 text-white",
  B: "bg-blue-600 text-white",
  C: "bg-emerald-500 text-white",
  D: "bg-rose-500 text-white",
};

function formatPin(pin: string) {
  return pin.replace(/\s/g, "").replace(/(\d{3})(?=\d)/g, "$1 ").trim();
}

function CheckIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden>
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function AdminAnswerBreakdown({ breakdown }: { breakdown: QuizAnswerBreakdown }) {
  const statusClass = {
    correct: "bg-emerald-50 text-emerald-700 border-emerald-200",
    wrong: "bg-red-50 text-red-700 border-red-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    unanswered: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-slate-800">Cevap dökümü</h4>
        <span className="text-xs font-medium text-slate-500">
          {breakdown.answeredTeams}/{breakdown.totalTeams}
        </span>
      </div>
      <div className="mb-3 grid grid-cols-4 gap-1.5">
        {answerOptionIds.map((optionId) => (
          <div key={optionId} className="rounded-lg bg-white p-2 text-center border border-slate-200">
            <p className="text-[10px] font-bold text-slate-400">{optionId}</p>
            <p className="text-lg font-bold text-slate-800">{breakdown.optionCounts[optionId]}</p>
          </div>
        ))}
      </div>
      <div className="max-h-40 space-y-1 overflow-y-auto">
        {breakdown.rows.map((row) => (
          <div key={row.teamId} className="flex items-center justify-between gap-2 rounded-lg bg-white px-2 py-1.5 text-xs border border-slate-100">
            <span className="truncate font-medium text-slate-700">{row.teamName}</span>
            <span className={`rounded-full border px-2 py-0.5 font-bold ${statusClass[row.status]}`}>
              {getQuizAnswerStatusLabel(row.status)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ControlButton({
  children,
  onClick,
  disabled,
  variant = "secondary",
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "success" | "danger";
  className?: string;
}) {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-700",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm",
    danger: "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function formatSavedDate(timestamp: number) {
  return new Date(timestamp).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("competition");
  const [competitionSaveName, setCompetitionSaveName] = useState("");
  const [savedCompetitions, setSavedCompetitions] = useState<SavedCompetition[]>([]);
  const [libraryMessage, setLibraryMessage] = useState<string | null>(null);

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
    saveCompetitionToLibrary,
    openSavedCompetition,
  } = useGameState();

  const refreshSavedCompetitions = () => {
    setSavedCompetitions(listSavedCompetitions());
  };

  useEffect(() => {
    if (activeTab === "library") {
      refreshSavedCompetitions();
    }
  }, [activeTab]);

  const handleSaveCompetition = () => {
    try {
      const fallbackName = state.settings.welcomeTitle || `${state.settings.customerName} Yarışması`;
      saveCompetitionToLibrary(competitionSaveName.trim() || fallbackName);
      setLibraryMessage("Yarışma kaydedildi.");
      setCompetitionSaveName("");
      refreshSavedCompetitions();
    } catch (error) {
      setLibraryMessage(error instanceof Error ? error.message : "Kayıt başarısız.");
    }
  };

  const handleOpenSavedCompetition = async (id: string) => {
    if (
      !window.confirm(
        "Kayıtlı yarışma yüklenecek. Takımlar, cevaplar ve skorlar sıfırlanır; yeni bir PIN oluşur. Devam edilsin mi?",
      )
    ) {
      return;
    }

    const result = await openSavedCompetition(id);
    setLibraryMessage(result.ok ? "Yarışma yüklendi." : result.message ?? "Yükleme başarısız.");
    if (result.ok) {
      setActiveTab("competition");
    }
  };

  const hasFlowItems = state.flowItems.length > 0;
  const remainingSeconds = calculateRemainingSeconds(state, activeItem, now);
  const introRemainingSeconds = calculateQuizIntroRemainingSeconds(state, activeItem, now);
  const activeIndexLabel = hasFlowItems ? `${state.activeItemIndex + 1} / ${state.flowItems.length}` : "—";
  const activeQuizPosition = getQuizPosition(state, activeItem);
  const activeQuizBreakdown = hasFlowItems && activeItem.type === "quiz" ? getQuizAnswerBreakdown(state, activeItem) : null;
  const displayedAnsweredCount = hasFlowItems ? activeQuizBreakdown?.answeredTeams ?? answeredCount : 0;
  const displayedTeamCount = hasFlowItems ? activeQuizBreakdown?.totalTeams ?? state.teams.length : state.teams.length;
  const waitingCount = Math.max(displayedTeamCount - displayedAnsweredCount, 0);
  const isLiveSession = state.phase !== "lobby" && state.phase !== "finished";
  const formattedPin = formatPin(state.settings.gamePin);
  const brand = resolveBrandSettings(state.settings);
  const rankedLeaderboard = [...leaderboard].sort((a, b) => b.score - a.score).slice(0, 5);
  const quizItemCount = state.flowItems.filter((item) => item.type === "quiz").length;
  const contentItemCount = state.flowItems.length - quizItemCount;

  const patchActiveQuiz = (patch: Partial<QuizFlowItem>) => {
    if (!hasFlowItems || activeItem.type !== "quiz") {
      return;
    }
    updateFlowItem({ ...activeItem, ...patch });
  };

  const setQuizOptionText = (optionId: AnswerId, text: string) => {
    if (!hasFlowItems || activeItem.type !== "quiz") {
      return;
    }
    updateFlowItem({
      ...activeItem,
      options: activeItem.options.map((option) => (option.id === optionId ? { ...option, text } : option)),
    });
  };

  const timerHint =
    remainingSeconds !== null
      ? `Süre: ${remainingSeconds} sn`
      : introRemainingSeconds !== null
        ? `Hazırlık: ${introRemainingSeconds} sn`
        : null;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 text-slate-950">
      <header className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-blue-200/50 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-4 py-3 shadow-xl backdrop-blur lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 shadow-lg backdrop-blur-sm">
            <span className="text-base font-bold text-white">{getProductBrandInitials(brand.productBrandName)}</span>
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-xl font-bold leading-tight text-white">{brand.productBrandName}</h1>
              <span className="hidden rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-semibold text-white sm:inline-flex backdrop-blur-sm">
                {brand.customerName}
              </span>
            </div>
            <p className="truncate text-xs text-blue-100">ISG Arena · Premium quiz creator</p>
          </div>
        </div>

        <nav className="hidden items-center rounded-xl border border-white/20 bg-white/10 p-1.5 backdrop-blur-sm md:flex">
          {adminTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-all ${
                activeTab === tab.id ? "bg-white text-blue-700 shadow-lg" : "text-white/90 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <div
            className={`hidden items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold lg:flex backdrop-blur-sm ${
              isLiveSession ? "border-emerald-300/50 bg-emerald-500/20 text-emerald-100" : "border-amber-300/50 bg-amber-500/20 text-amber-100"
            }`}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${isLiveSession ? "animate-pulse bg-emerald-400" : "bg-amber-400"}`} />
            {isLiveSession ? "Canlı" : state.phase === "finished" ? "Kapalı" : "Hazırlık"}
          </div>
          <div className="rounded-xl border border-white/30 bg-white/20 px-4 py-2 font-mono text-sm font-bold tracking-wider text-white backdrop-blur-sm shadow-lg">
            PIN {formattedPin}
          </div>
          <button
            type="button"
            onClick={() => window.open("/screen", "_blank")}
            className="hidden rounded-xl border border-white/30 bg-white/20 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-sm transition hover:bg-white/30 sm:block"
          >
            Ön İzle
          </button>
          <button
            type="button"
            onClick={handleSaveCompetition}
            className="hidden rounded-xl border border-white/30 bg-white/20 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-sm transition hover:bg-white/30 lg:block"
          >
            Kaydet
          </button>
          <button
            type="button"
            onClick={openLobby}
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 shadow-xl transition hover:bg-blue-50"
          >
            Lobiyi Aç
          </button>
          <button
            type="button"
            onClick={() => downloadResultsCsv(state)}
            className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white xl:block"
          >
            CSV
          </button>
          <Link
            href="/"
            className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white md:block"
          >
            Çık
          </Link>
        </div>
      </header>

      <nav className="flex shrink-0 border-b border-slate-200 bg-white px-2 py-2 md:hidden">
        {adminTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
              activeTab === tab.id ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "competition" ? (
        <div className="flex flex-1 overflow-hidden">
          {/* Left — flow */}
          <aside className="hidden w-80 shrink-0 flex-col border-r border-blue-200/30 bg-gradient-to-b from-white to-blue-50/30 shadow-lg lg:flex">
            <div className="border-b border-blue-100/50 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-blue-600">Yarışma Akışı</p>
                  <h2 className="mt-1 text-lg font-bold text-slate-950">{state.flowItems.length} öğe</h2>
                </div>
                <span className="rounded-full border border-blue-200 bg-gradient-to-r from-blue-100 to-indigo-100 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm">
                  {phaseLabels[state.phase]}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-blue-200/50 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-sm">
                  <p className="text-xl font-bold text-blue-900">{quizItemCount}</p>
                  <p className="text-[11px] font-semibold text-blue-600">Soru</p>
                </div>
                <div className="rounded-xl border border-purple-200/50 bg-gradient-to-br from-purple-50 to-pink-50 p-4 shadow-sm">
                  <p className="text-xl font-bold text-purple-900">{contentItemCount}</p>
                  <p className="text-[11px] font-semibold text-purple-600">İçerik</p>
                </div>
              </div>
              {timerHint ? <p className="mt-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg">{timerHint}</p> : null}
            </div>

            <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
              {state.flowItems.length ? (
                state.flowItems.map((item, index) => {
                  const isActive = index === state.activeItemIndex;
                  return (
                    <div
                      key={item.id}
                      className={`group rounded-xl border transition-all shadow-sm ${
                        isActive ? "border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md" : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30"
                      }`}
                    >
                      <button type="button" onClick={() => goToItem(index)} className="w-full p-4 text-left">
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-xl border text-xl shadow-sm ${
                              isActive ? "border-blue-300 bg-white" : "border-slate-200 bg-slate-50"
                            }`}
                          >
                            {flowThumbnails[item.type]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold ${isActive ? "text-blue-700" : "text-slate-400"}`}>
                                {index + 1}
                              </span>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                  isActive ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-600"
                                }`}
                              >
                                {flowTypeLabels[item.type]}
                              </span>
                            </div>
                            <p className={`mt-1.5 truncate text-sm font-semibold ${isActive ? "text-blue-900" : "text-slate-700"}`}>
                              {item.title}
                            </p>
                          </div>
                        </div>
                      </button>
                      <div className="flex gap-1 border-t border-slate-100/50 px-3 py-2">
                        <button
                          type="button"
                          title="Yukarı"
                          disabled={index === 0}
                          onClick={() => moveFlowItem(item.id, -1)}
                          className="flex-1 rounded-lg py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          title="Aşağı"
                          disabled={index === state.flowItems.length - 1}
                          onClick={() => moveFlowItem(item.id, 1)}
                          className="flex-1 rounded-lg py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          title="Çoğalt"
                          onClick={() => duplicateFlowItem(item.id)}
                          className="flex-1 rounded-lg py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                        >
                          ⧉
                        </button>
                        <button
                          type="button"
                          title="Sil"
                          onClick={() => {
                            if (window.confirm("Bu akış öğesini silmek istiyor musunuz?")) {
                              deleteFlowItem(item.id);
                            }
                          }}
                          className="flex-1 rounded-md py-1 text-xs font-semibold text-red-500 hover:bg-red-50"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center">
                  <p className="text-sm font-medium text-slate-600">Akış boş</p>
                  <button
                    type="button"
                    onClick={() => {
                      restoreDefaultFlow();
                    }}
                    className="mt-3 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    Varsayılan akışı yükle
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 p-3">
              <button
                type="button"
                onClick={() => setActiveTab("settings")}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <span className="text-lg">+</span>
                Öğe Ekle / Düzenle
              </button>
            </div>
          </aside>

          {/* Center — canvas */}
          <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 p-4 lg:p-6">
            <div className="mx-auto max-w-5xl">
              {!hasFlowItems ? (
                <div className="rounded-2xl border border-blue-200/50 bg-gradient-to-br from-white to-blue-50/30 p-12 text-center shadow-xl">
                  <h2 className="text-2xl font-bold text-slate-950">Yarışma akışında içerik yok</h2>
                  <p className="mt-3 text-base text-slate-500">Sol panelden varsayılan akışı yükleyin veya Ayarlar sekmesinden öğe ekleyin.</p>
                </div>
              ) : activeItem.type === "quiz" ? (
                <>
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Editör Canvas</p>
                      <h2 className="mt-1 text-2xl font-bold text-slate-950">{getQuestionLabel(activeItem, state)}</h2>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-blue-200/50 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-md">
                      <span>Akış {activeIndexLabel}</span>
                      <span className="text-blue-300">/</span>
                      <span>{activeItem.timeLimitSeconds} sn</span>
                    </div>
                  </div>

                  <div className="mb-6 rounded-2xl border border-blue-200/50 bg-gradient-to-br from-white to-blue-50/20 p-7 shadow-lg">
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <span className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-3 py-1.5 text-xs font-bold text-white shadow-md">
                        {activeQuizPosition ? `SORU ${activeQuizPosition.current}` : getQuestionLabel(activeItem, state).toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-semibold text-slate-600">{activeItem.topic}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-semibold text-slate-600">Akış {activeIndexLabel}</span>
                    </div>
                    <input
                      type="text"
                      value={activeItem.title}
                      onChange={(event) => patchActiveQuiz({ title: event.target.value })}
                      className="w-full border-none bg-transparent text-3xl font-bold leading-tight text-slate-950 outline-none placeholder:text-slate-400"
                      placeholder="Sorunuzu buraya yazın..."
                    />
                    {activeItem.explanation && state.showCorrectAnswer ? (
                      <p className="mt-5 rounded-xl border border-emerald-300/50 bg-gradient-to-r from-emerald-50 to-green-50 p-4 text-base font-medium text-emerald-800 shadow-sm">
                        {activeItem.explanation}
                      </p>
                    ) : null}
                  </div>

                  <div className="mb-6 rounded-2xl border border-blue-200/50 bg-gradient-to-br from-white to-blue-50/20 p-6 shadow-lg">
                    <div className="rounded-2xl border-2 border-dashed border-blue-300/50 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 p-10 text-center">
                      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-lg">
                        <svg className="h-10 w-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <p className="mb-2 text-lg font-semibold text-slate-600">Medya alanı</p>
                      <p className="text-base text-slate-400">Görsel veya video için Ayarlar → Akış Editörü</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {answerOptionIds.map((optionId) => {
                      const option = activeItem.options.find((entry) => entry.id === optionId);
                      const isCorrect = activeItem.correctOptionId === optionId;
                      const styles = answerBlockStyles[optionId];
                      return (
                        <div
                          key={optionId}
                          className={`relative min-h-32 rounded-2xl p-6 text-left shadow-lg transition-all ${isCorrect ? styles.active : styles.base}`}
                        >
                          {isCorrect ? (
                            <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg">
                              <CheckIcon className={`h-5 w-5 ${styles.check}`} />
                            </div>
                          ) : null}
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => patchActiveQuiz({ correctOptionId: optionId })}
                              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold text-white shadow-lg"
                            >
                              {optionId}
                            </button>
                            <input
                              type="text"
                              value={option?.text ?? ""}
                              onChange={(event) => setQuizOptionText(optionId, event.target.value)}
                              className="flex-1 border-none bg-transparent text-xl font-semibold text-white outline-none placeholder:text-white/60"
                              placeholder={`${optionId} seçeneği`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        {flowTypeLabels[activeItem.type]}
                      </span>
                      <span className="text-xs text-slate-400">Akış {activeIndexLabel}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-950">{activeItem.title}</h2>
                    <p className="mt-4 text-base leading-relaxed text-slate-600">
                      {"description" in activeItem ? activeItem.description : "Final etap hazır."}
                    </p>
                    {activeItem.type === "forkliftChallenge" ? (
                      <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-base font-semibold text-amber-800">
                        {activeItem.message}
                      </p>
                    ) : null}
                    {activeItem.type === "mediaSlide" && (activeItem.mediaUrl || activeItem.uploadedImageDataUrl) ? (
                      <p className="mt-4 break-all rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                        {activeItem.mediaUrl || "Yüklenen görsel"}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-center text-sm text-slate-500">
                    Detaylı düzenleme için <button type="button" onClick={() => setActiveTab("settings")} className="font-medium text-blue-600 hover:underline">Ayarlar</button> sekmesindeki akış editörünü kullanın.
                  </p>
                </div>
              )}
            </div>
          </main>

          {/* Right — inspector */}
          <aside className="hidden w-96 shrink-0 flex-col overflow-y-auto border-l border-blue-200/30 bg-gradient-to-b from-white to-blue-50/20 shadow-lg xl:flex">
            {hasFlowItems && activeItem.type === "quiz" ? (
              <div className="border-b border-blue-100/50 p-6">
                <div className="mb-5">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-blue-600">Sağ Panel</p>
                  <h3 className="mt-1 text-lg font-bold text-slate-950">Soru Ayarları</h3>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="mb-2.5 block text-xs font-semibold text-slate-600">Soru tipi</label>
                    <div className="rounded-xl border border-blue-200/50 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 text-sm font-semibold text-blue-900 shadow-sm">Çoktan seçmeli</div>
                  </div>

                  <div>
                    <label className="mb-2.5 block text-xs font-semibold text-slate-600">Süre limiti</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={10}
                        max={120}
                        value={activeItem.timeLimitSeconds}
                        onChange={(event) => patchActiveQuiz({ timeLimitSeconds: Number(event.target.value) })}
                        className="h-2.5 flex-1 cursor-pointer appearance-none rounded-full bg-gradient-to-r from-blue-200 to-indigo-200 accent-blue-600"
                      />
                      <span className="w-20 text-right text-sm font-bold text-blue-900">{activeItem.timeLimitSeconds} sn</span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2.5 block text-xs font-semibold text-slate-600">Puan</label>
                    <div className="flex gap-2">
                      {[500, 1000, 2000].map((points) => (
                        <button
                          key={points}
                          type="button"
                          onClick={() => patchActiveQuiz({ maxScore: points })}
                          className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all shadow-md ${
                            activeItem.maxScore === points
                              ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {points}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2.5 block text-xs font-semibold text-slate-600">Doğru cevap</label>
                    <div className="flex gap-2">
                      {answerOptionIds.map((answer) => (
                        <button
                          key={answer}
                          type="button"
                          onClick={() => patchActiveQuiz({ correctOptionId: answer })}
                          className={`h-12 w-12 rounded-xl font-bold transition-all shadow-md ${
                            activeItem.correctOptionId === answer
                              ? correctAnswerChipStyles[answer]
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {answer}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-b border-blue-100/50 p-6">
                <h3 className="text-base font-bold text-slate-950">Aktif öğe</h3>
                <p className="mt-2.5 text-sm text-slate-500">
                  {hasFlowItems ? `${flowTypeLabels[activeItem.type]} · ${activeItem.title}` : "Öğe seçilmedi"}
                </p>
              </div>
            )}

            <div className="border-b border-blue-100/50 p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-slate-950">Canlı Kontroller</h3>
                <span className="rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm">
                  {phaseLabels[state.phase]}
                </span>
              </div>
              <div className="space-y-2.5">
                <ControlButton variant="primary" onClick={startActiveItem} disabled={!hasFlowItems}>
                  Soruyu / Slaytı Başlat
                </ControlButton>
                <ControlButton variant="secondary" onClick={nextItem} disabled={!hasFlowItems}>
                  Sonraki Öğe
                </ControlButton>
                <ControlButton variant="secondary" onClick={lockAnswers} disabled={!hasFlowItems}>
                  Cevapları Kilitle
                </ControlButton>
                <ControlButton
                  variant="secondary"
                  onClick={revealCorrectAnswer}
                  disabled={!hasFlowItems || activeItem.type !== "quiz"}
                >
                  Doğru Cevabı Göster
                </ControlButton>
                <ControlButton variant="secondary" onClick={showLeaderboard}>
                  Lider Tablosu
                </ControlButton>
                <ControlButton variant="success" onClick={finishGame}>
                  Final Sonuçları
                </ControlButton>
                <ControlButton
                  variant="danger"
                  onClick={() => {
                    if (window.confirm("Oyunu sıfırlamak ve yeni PIN üretmek istiyor musunuz?")) {
                      resetGame();
                    }
                  }}
                >
                  Oturumu Sıfırla
                </ControlButton>
              </div>
            </div>

            <div className="border-b border-slate-100 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-950">Katılımcılar</h3>
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  {state.teams.length} takım
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-emerald-50 p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{displayedAnsweredCount}</p>
                  <p className="text-xs text-emerald-700">Cevapladı</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-3 text-center">
                  <p className="text-2xl font-bold text-amber-600">{waitingCount}</p>
                  <p className="text-xs text-amber-700">Bekliyor</p>
                </div>
              </div>
              {activeQuizBreakdown ? (
                <div className="mt-4">
                  <AdminAnswerBreakdown breakdown={activeQuizBreakdown} />
                </div>
              ) : null}
            </div>

            <div className="flex-1 p-5">
              <h3 className="mb-4 text-sm font-bold text-slate-950">Lider Tablosu</h3>
              {rankedLeaderboard.length ? (
                <div className="space-y-2">
                  {rankedLeaderboard.map((player, index) => {
                    const rank = index + 1;
                    const initials = player.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();
                    return (
                      <div
                        key={player.id}
                        className={`flex items-center gap-3 rounded-lg p-2.5 transition-all ${rank <= 3 ? "bg-slate-50" : ""}`}
                      >
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            rank === 1
                              ? "bg-amber-400 text-white"
                              : rank === 2
                                ? "bg-slate-400 text-white"
                                : rank === 3
                                  ? "bg-amber-600 text-white"
                                  : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {rank}
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-700">{player.name}</p>
                        </div>
                        <span className="text-sm font-semibold text-slate-800">{player.score.toLocaleString("tr-TR")}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-sm text-slate-400">Henüz takım yok.</p>
              )}
            </div>
          </aside>
        </div>
      ) : activeTab === "library" ? (
        <main className="flex-1 overflow-y-auto bg-[#f5f7fb] p-4 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Yarışma Kütüphanesi</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">Creator taslakları</h2>
                <p className="mt-1 max-w-2xl text-sm text-slate-500">
                  Kayıtlı yarışmaları açabilir veya mevcut akışı yerel kütüphaneye ekleyebilirsiniz.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  restoreDefaultFlow();
                  setActiveTab("competition");
                }}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
              >
                Varsayılan akışı yükle
              </button>
            </div>

            <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-950">Mevcut yarışma</h3>
                    <p className="mt-1 text-sm text-slate-500">{brand.customerName}</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    {state.flowItems.length} öğe
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-2xl font-bold text-slate-950">{quizItemCount}</p>
                    <p className="text-xs font-semibold text-slate-500">Soru</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-2xl font-bold text-slate-950">{contentItemCount}</p>
                    <p className="text-xs font-semibold text-slate-500">İçerik</p>
                  </div>
                </div>

                <label className="mt-5 block">
                  <span className="text-xs font-semibold text-slate-500">Kayıt adı</span>
                  <input
                    value={competitionSaveName}
                    onChange={(event) => setCompetitionSaveName(event.target.value)}
                    placeholder={state.settings.welcomeTitle || "Yarışma adı"}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleSaveCompetition}
                  className="mt-3 w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Mevcut yarışmayı kaydet
                </button>
                {libraryMessage ? <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">{libraryMessage}</p> : null}
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-950">Kayıtlı yarışmalar</h3>
                    <p className="mt-1 text-sm text-slate-500">{savedCompetitions.length} kayıt</p>
                  </div>
                  <button
                    type="button"
                    onClick={refreshSavedCompetitions}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Yenile
                  </button>
                </div>

                {savedCompetitions.length ? (
                  <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                    {savedCompetitions.map((entry) => {
                      const entryQuizCount = entry.flowItems.filter((item) => item.type === "quiz").length;
                      return (
                        <article key={entry.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-white hover:shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-base font-bold text-slate-950">{entry.name}</p>
                              <p className="mt-1 text-xs font-medium text-slate-500">{formatSavedDate(entry.updatedAt)}</p>
                            </div>
                            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                              Taslak
                            </span>
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-2">
                            <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                              <p className="text-lg font-bold text-slate-950">{entryQuizCount}</p>
                              <p className="text-xs text-slate-500">Soru</p>
                            </div>
                            <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                              <p className="text-lg font-bold text-slate-950">{entry.flowItems.length}</p>
                              <p className="text-xs text-slate-500">Toplam öğe</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleOpenSavedCompetition(entry.id)}
                            className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                          >
                            Düzenle
                          </button>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                    <p className="text-base font-bold text-slate-800">Henüz kayıtlı yarışma yok</p>
                    <p className="mt-2 text-sm text-slate-500">Mevcut yarışmayı kaydederek bu alanda listeleyebilirsiniz.</p>
                  </div>
                )}
              </section>
            </div>
          </div>
        </main>
      ) : (
        <div className="flex-1 overflow-y-auto bg-[#f5f7fb] p-6 lg:p-8">
          <div className="mx-auto max-w-5xl space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Marka & Tema</h2>
                <p className="mt-1 text-sm text-slate-500">Ürün markası, müşteri adı ve projeksiyon teması</p>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">Ürün markası</span>
                  <input
                    value={brand.productBrandName}
                    onChange={(event) => updateSettings({ productBrandName: event.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">Müşteri adı</span>
                  <input
                    value={brand.customerName}
                    onChange={(event) => updateSettings({ customerName: event.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-medium text-slate-500">Watermark metni</span>
                  <input
                    value={brand.watermarkText}
                    onChange={(event) => updateSettings({ watermarkText: event.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">Müşteri logo metni (opsiyonel)</span>
                  <input
                    value={brand.customerLogoText ?? ""}
                    onChange={(event) => updateSettings({ customerLogoText: event.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">Müşteri logo URL (opsiyonel)</span>
                  <input
                    value={brand.customerLogoUrl ?? ""}
                    onChange={(event) => updateSettings({ customerLogoUrl: event.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-medium text-slate-500">Tema</span>
                  <select
                    value={brand.themeId}
                    onChange={(event) => updateSettings({ themeId: event.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    {THEME_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-800">Yarışma Ayarları</h2>
                  <p className="mt-1 text-sm text-slate-500">Başlık, ödüller ve katılım limitleri</p>
                </div>
                <button
                  type="button"
                  onClick={() => downloadResultsCsv(state)}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Sonuçları CSV İndir
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="text-xs font-medium text-slate-500">Yarışma başlığı</span>
                  <textarea
                    value={state.settings.welcomeTitle}
                    onChange={(event) => updateSettings({ welcomeTitle: event.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    rows={3}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">Maksimum takım</span>
                  <input
                    value={state.settings.maxTeams}
                    onChange={(event) => updateSettings({ maxTeams: Number(event.target.value) })}
                    type="number"
                    min={1}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">Takım kişi sayısı</span>
                  <input
                    value={state.settings.teamSize}
                    onChange={(event) => updateSettings({ teamSize: Number(event.target.value) })}
                    type="number"
                    min={1}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">1. ödül</span>
                  <input
                    value={state.settings.prizeFirst}
                    onChange={(event) => updateSettings({ prizeFirst: Number(event.target.value) })}
                    type="number"
                    min={0}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">2. ödül</span>
                  <input
                    value={state.settings.prizeSecond}
                    onChange={(event) => updateSettings({ prizeSecond: Number(event.target.value) })}
                    type="number"
                    min={0}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">3. ödül</span>
                  <input
                    value={state.settings.prizeThird}
                    onChange={(event) => updateSettings({ prizeThird: Number(event.target.value) })}
                    type="number"
                    min={0}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">Para birimi</span>
                  <input
                    value={state.settings.currency}
                    onChange={(event) => updateSettings({ currency: event.target.value.toLocaleUpperCase("tr-TR") })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <span className="font-medium text-slate-700">PIN:</span> {formattedPin} ·{" "}
                <span className="font-medium text-slate-700">Faz:</span> {phaseLabels[state.phase]}
              </div>
            </section>

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
          </div>
        </div>
      )}
    </div>
  );
}
