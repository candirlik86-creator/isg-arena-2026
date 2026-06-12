"use client";

import { useGameState } from "@/hooks/useGameState";
import {
  createFlowItemId,
  getFlowItemMedia,
  getQuestionLabel,
  getQuizAnswerBreakdown,
  getQuizAnswerStatusLabel,
  getYoutubeEmbedUrl,
  inferMediaSource,
  inferMediaType,
  type AnswerId,
  type ContentFlowItem,
  type FinalRoundFlowItem,
  type GamePhase,
  type GameSettings,
  type MediaType,
  type QuizAnswerBreakdown,
  type QuizFlowItem,
} from "@/lib/game-state";
import { getProductBrandInitials, resolveBrandSettings, THEME_OPTIONS } from "@/lib/brand-theme";
import {
  duplicateSavedCompetition,
  listSavedCompetitions,
  listTrashedCompetitions,
  moveSavedCompetitionToTrash,
  permanentlyDeleteSavedCompetition,
  restoreSavedCompetition,
  type SavedCompetition,
} from "@/lib/competition-library";
import { downloadResultsCsv } from "@/lib/game-store";
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";

const answerOptionIds: AnswerId[] = ["A", "B", "C", "D"];
type AdminTab = "competition" | "settings" | "library";
type QuizDraft = {
  itemId: string;
  title: string;
  mediaUrl: string;
  options: Record<AnswerId, string>;
};
type SlideDraft = {
  itemId: string;
  title: string;
  description: string;
  mediaUrl: string;
  message: string;
};

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
  finalRound: "Final Round",
  finished: "Oturum bitti",
};

const flowTypeLabels: Record<ContentFlowItem["type"], string> = {
  quiz: "Soru",
  infoSlide: "Bilgi Slaytı",
  mediaSlide: "Medya Slaytı",
  forkliftChallenge: "Forklift Etabı",
  finalRound: "Final Round",
};

const flowThumbnails: Record<ContentFlowItem["type"], string> = {
  quiz: "❓",
  infoSlide: "📋",
  mediaSlide: "🎬",
  forkliftChallenge: "🏁",
  finalRound: "FINAL",
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

const emptyQuizDraft: QuizDraft = {
  itemId: "",
  title: "",
  mediaUrl: "",
  options: {
    A: "",
    B: "",
    C: "",
    D: "",
  },
};
const emptySlideDraft: SlideDraft = {
  itemId: "",
  title: "",
  description: "",
  mediaUrl: "",
  message: "",
};

function createDefaultFinalRound(): FinalRoundFlowItem {
  const itemId = createFlowItemId("finalRound");

  return {
    id: itemId,
    type: "finalRound",
    title: "Final Round",
    category: "Final",
    introTitle: "FINAL ROUND",
    introMessage: "Artık bireysel hız değil, takımların ortak doğru karar alma gücü ölçülüyor.",
    questions: [0, 1, 2].map((index) => ({
      id: `${itemId}-question-${index + 1}`,
      scenarioText: `Final senaryo ${index + 1}`,
      scenarioDurationSeconds: 10,
      questionText: `Final soru ${index + 1}`,
      options: answerOptionIds.map((id) => ({ id, text: `${id} seçeneği` })),
      correctOptionId: "A",
      timeLimitSeconds: 30,
      mediaType: "none",
      mediaSource: "none",
    })) as FinalRoundFlowItem["questions"],
  };
}

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

type UploadedMedia = { path: string; mediaType: "image" | "video" };

async function uploadMediaFile(file: File): Promise<UploadedMedia> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/uploads", {
    method: "POST",
    body: formData,
  });
  const body = (await response.json()) as { ok?: boolean; path?: string; mediaType?: "image" | "video"; message?: string };

  if (!response.ok || !body.ok || !body.path || !body.mediaType) {
    throw new Error(body.message ?? "Dosya yüklenemedi.");
  }

  return { path: body.path, mediaType: body.mediaType };
}

function AdminMediaPreview({ mediaUrl, title }: { mediaUrl: string; title: string }) {
  const [imageError, setImageError] = useState(false);
  const cleanUrl = mediaUrl.trim();
  const mediaType = inferMediaType(cleanUrl);

  if (!cleanUrl) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-blue-300/50 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 p-4 text-center">
        <p className="text-base font-semibold text-slate-600">Medya alanı</p>
        <p className="mt-1 text-sm text-slate-400">Görsel, video veya YouTube bağlantısı ekleyin.</p>
      </div>
    );
  }

  if (mediaType === "none") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-sm font-semibold text-red-700">
        Bağlantı desteklenen görsel, video veya YouTube formatı değil.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-blue-200 bg-slate-950 shadow-lg">
      {mediaType === "image" ? (
        imageError ? (
          <div className="flex min-h-56 items-center justify-center p-4 text-center text-sm font-semibold text-amber-200">
            Görsel yüklenemedi. URL: {cleanUrl}
          </div>
        ) : (
          <img src={cleanUrl} alt="" className="max-h-44 w-full object-contain" onError={() => setImageError(true)} />
        )
      ) : mediaType === "video" ? (
        <video src={cleanUrl} controls className="max-h-44 w-full" />
      ) : (
        <iframe
          title={title}
          src={getYoutubeEmbedUrl(cleanUrl)}
          className="aspect-video max-h-44 w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}
    </div>
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

export function AdminPageClient() {
  const [activeTab, setActiveTab] = useState<AdminTab>("library");
  const [draggedFlowItemId, setDraggedFlowItemId] = useState<string | null>(null);
  const [activeQuizDraft, setActiveQuizDraft] = useState<QuizDraft>(emptyQuizDraft);
  const [activeSlideDraft, setActiveSlideDraft] = useState<SlideDraft>(emptySlideDraft);
  const [activeFinalRoundDraft, setActiveFinalRoundDraft] = useState<FinalRoundFlowItem | null>(null);
  const [finalRoundAddRequested, setFinalRoundAddRequested] = useState(false);
  const [competitionSaveName, setCompetitionSaveName] = useState("");
  const [savedCompetitions, setSavedCompetitions] = useState<SavedCompetition[]>([]);
  const [trashedCompetitions, setTrashedCompetitions] = useState<SavedCompetition[]>([]);
  const [editingCompetitionId, setEditingCompetitionId] = useState<string | null>(null);
  const [libraryMessage, setLibraryMessage] = useState<string | null>(null);
  const [mediaMessage, setMediaMessage] = useState<string | null>(null);
  const isSettingsDraftDirty = useRef(false);

  const {
    state,
    activeItem,
    leaderboard,
    answeredCount,
    resetGame,
    updateSettings,
    startActiveItem,
    nextItem,
    advanceFinalRound,
    lockAnswers,
    revealCorrectAnswer,
    showLeaderboard,
    finishGame,
    addFlowItem,
    updateFlowItem,
    deleteFlowItem,
    duplicateFlowItem,
    moveFlowItem,
    reorderFlowItem,
    createBlankCompetition,
    goToItem,
    saveCompetitionToLibrary,
    openSavedCompetition,
  } = useGameState();
  const [settingsDraft, setSettingsDraft] = useState<GameSettings>(() => state.settings);

  const refreshSavedCompetitions = () => {
    setSavedCompetitions(listSavedCompetitions());
    setTrashedCompetitions(listTrashedCompetitions());
  };

  useEffect(() => {
    if (activeTab === "library") {
      refreshSavedCompetitions();
    }
  }, [activeTab]);

  const handleSaveCompetition = () => {
    try {
      const fallbackName = state.settings.welcomeTitle || `${state.settings.customerName} Yarışması`;
      const savedCompetition = saveCompetitionToLibrary(competitionSaveName.trim() || fallbackName, editingCompetitionId ?? undefined);
      setEditingCompetitionId(savedCompetition.id);
      setCompetitionSaveName(savedCompetition.name);
      setLibraryMessage(editingCompetitionId ? "Yarışma güncellendi." : "Yarışma kaydedildi.");
      refreshSavedCompetitions();
    } catch (error) {
      setLibraryMessage(error instanceof Error ? error.message : "Kayıt başarısız.");
    }
  };

  const handleCreateBlankCompetition = async () => {
    if (
      (state.flowItems.length || state.teams.length) &&
      !window.confirm("Boş yarışma oluşturulacak. Aktif oturum, takımlar ve cevaplar sıfırlansın mı?")
    ) {
      return;
    }

    const result = await createBlankCompetition();
    setLibraryMessage(result.ok ? "Boş yarışma oluşturuldu." : result.message ?? "Yeni yarışma oluşturulamadı.");
    if (result.ok) {
      setEditingCompetitionId(null);
      setCompetitionSaveName("");
      setActiveTab("competition");
    }
  };

  const handlePlaySavedCompetition = async (id: string) => {
    if (
      !window.confirm(
        "Yarışma canlı oyun için yüklenecek. PIN, takımlar, cevaplar ve skorlar sıfırlanır. Devam edilsin mi?",
      )
    ) {
      return;
    }

    const result = await openSavedCompetition(id);
    setLibraryMessage(result.ok ? "Yarışma yüklendi." : result.message ?? "Yükleme başarısız.");
    if (result.ok) {
      setEditingCompetitionId(null);
      setCompetitionSaveName("");
      setActiveTab("competition");
    }
  };

  const handleEditSavedCompetition = async (entry: SavedCompetition) => {
    const result = await openSavedCompetition(entry.id);
    setLibraryMessage(result.ok ? "Yarışma editöre yüklendi." : result.message ?? "Yükleme başarısız.");
    if (result.ok) {
      setEditingCompetitionId(entry.id);
      setCompetitionSaveName(entry.name);
      setActiveTab("competition");
    }
  };

  const handleDuplicateSavedCompetition = (id: string) => {
    try {
      duplicateSavedCompetition(id);
      setLibraryMessage("Yarışma kopyalandı.");
      refreshSavedCompetitions();
    } catch (error) {
      setLibraryMessage(error instanceof Error ? error.message : "Kopyalama başarısız.");
    }
  };

  const handleDeleteSavedCompetition = (entry: SavedCompetition) => {
    if (!window.confirm(`"${entry.name}" Çöp Kutusu'na taşınsın mı?`)) {
      return;
    }

    moveSavedCompetitionToTrash(entry.id);
    if (editingCompetitionId === entry.id) {
      setEditingCompetitionId(null);
      setCompetitionSaveName("");
    }
    setLibraryMessage("Yarışma Çöp Kutusu'na taşındı.");
    refreshSavedCompetitions();
  };

  const handleRestoreSavedCompetition = (entry: SavedCompetition) => {
    restoreSavedCompetition(entry.id);
    setLibraryMessage(`"${entry.name}" geri yüklendi.`);
    refreshSavedCompetitions();
  };

  const handlePermanentlyDeleteSavedCompetition = (entry: SavedCompetition) => {
    if (!window.confirm(`"${entry.name}" kalıcı olarak silinsin mi? Bu işlem geri alınamaz.`)) {
      return;
    }

    permanentlyDeleteSavedCompetition(entry.id);
    setLibraryMessage("Yarışma kalıcı olarak silindi.");
    refreshSavedCompetitions();
  };

  const hasFlowItems = state.flowItems.length > 0;
  const activeIndexLabel = hasFlowItems ? `${state.activeItemIndex + 1} / ${state.flowItems.length}` : "—";
  const activeQuizBreakdown = hasFlowItems && activeItem.type === "quiz" ? getQuizAnswerBreakdown(state, activeItem) : null;
  const displayedAnsweredCount = hasFlowItems ? activeQuizBreakdown?.answeredTeams ?? answeredCount : 0;
  const displayedTeamCount = hasFlowItems ? activeQuizBreakdown?.totalTeams ?? state.teams.length : state.teams.length;
  const waitingCount = Math.max(displayedTeamCount - displayedAnsweredCount, 0);
  const isLiveSession = state.phase !== "lobby" && state.phase !== "finished";
  const formattedPin = formatPin(state.settings.gamePin);
  const brand = resolveBrandSettings(settingsDraft);
  const rankedLeaderboard = [...leaderboard].sort((a, b) => b.score - a.score).slice(0, 5);
  const quizItemCount = state.flowItems.filter((item) => item.type === "quiz").length;
  const contentItemCount = state.flowItems.length - quizItemCount;
  const hasFinalRound = state.flowItems.some((item) => item.type === "finalRound");
  const isFinalRoundSelected = hasFlowItems && activeItem.type === "finalRound";
  const activeFinalRoundRuntime =
    isFinalRoundSelected && state.phase === "finalRound" && state.finalRoundRuntime?.itemId === activeItem.id
      ? state.finalRoundRuntime
      : null;
  const finalRoundAdvanceLabel =
    activeFinalRoundRuntime?.step === "intro"
      ? "Senaryo 1'e Geç"
      : activeFinalRoundRuntime?.step === "risk" && activeFinalRoundRuntime.questionIndex < 2
        ? `Senaryo ${activeFinalRoundRuntime.questionIndex + 2}'ye Geç`
        : activeFinalRoundRuntime?.step === "risk"
          ? "Final Sonuçlarına Geç"
          : activeFinalRoundRuntime?.step === "results"
            ? "Sonraki Akış Öğesine Geç"
            : "Süreli Adım Devam Ediyor";
  const activeItemMedia = hasFlowItems ? getFlowItemMedia(activeItem) : { mediaUrl: "", mediaType: "none" as MediaType, mediaSource: "none" as const };
  const activeQuizMediaUrl = hasFlowItems && activeItem.type === "quiz" && activeQuizDraft.itemId === activeItem.id ? activeQuizDraft.mediaUrl : activeItemMedia.mediaUrl;
  const activeQuizMediaType = inferMediaType(activeQuizMediaUrl);
  const activeSlideMediaUrl =
    hasFlowItems && activeItem.type !== "quiz" && activeSlideDraft.itemId === activeItem.id ? activeSlideDraft.mediaUrl : activeItemMedia.mediaUrl;
  const activeSlideMediaType = inferMediaType(activeSlideMediaUrl);

  useEffect(() => {
    if (hasFinalRound) {
      setFinalRoundAddRequested(false);
      return;
    }

    if (!finalRoundAddRequested) {
      return;
    }

    const timer = window.setTimeout(() => setFinalRoundAddRequested(false), 2000);
    return () => window.clearTimeout(timer);
  }, [finalRoundAddRequested, hasFinalRound]);

  useEffect(() => {
    if (!isSettingsDraftDirty.current) {
      setSettingsDraft(state.settings);
    }
  }, [state.settings]);

  useEffect(() => {
    if (!isSettingsDraftDirty.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      updateSettings(settingsDraft);
      isSettingsDraftDirty.current = false;
    }, 500);

    return () => window.clearTimeout(timer);
  }, [settingsDraft, updateSettings]);

  useEffect(() => {
    if (!hasFlowItems || activeItem.type !== "quiz") {
      setActiveQuizDraft(emptyQuizDraft);
      return;
    }

    setActiveQuizDraft({
      itemId: activeItem.id,
      title: activeItem.title,
      mediaUrl: activeItem.mediaUrl ?? activeItem.imageUrl ?? "",
      options: Object.fromEntries(activeItem.options.map((option) => [option.id, option.text])) as Record<AnswerId, string>,
    });
  }, [hasFlowItems, activeItem.id]);

  useEffect(() => {
    if (!hasFlowItems || activeItem.type !== "quiz" || activeQuizDraft.itemId !== activeItem.id) {
      return;
    }

    const hasTitleChange = activeQuizDraft.title !== activeItem.title;
    const hasMediaChange = activeQuizDraft.mediaUrl !== (activeItem.mediaUrl ?? activeItem.imageUrl ?? "");
    const hasOptionChange = activeItem.options.some((option) => activeQuizDraft.options[option.id] !== option.text);

    if (!hasTitleChange && !hasMediaChange && !hasOptionChange) {
      return;
    }

    const timer = window.setTimeout(() => {
      const cleanUrl = activeQuizDraft.mediaUrl.trim();
      const mediaType = inferMediaType(cleanUrl);
      updateFlowItem({
        ...activeItem,
        title: activeQuizDraft.title,
        mediaUrl: cleanUrl || undefined,
        mediaType,
        mediaSource: inferMediaSource(cleanUrl),
        imageUrl: mediaType === "image" ? cleanUrl || undefined : undefined,
        options: activeItem.options.map((option) => ({
          ...option,
          text: activeQuizDraft.options[option.id],
        })),
      });
    }, 450);

    return () => window.clearTimeout(timer);
  }, [activeItem, activeQuizDraft, hasFlowItems, updateFlowItem]);

  useEffect(() => {
    if (!hasFlowItems || activeItem.type === "quiz" || activeItem.type === "finalRound") {
      setActiveSlideDraft(emptySlideDraft);
      return;
    }

    setActiveSlideDraft({
      itemId: activeItem.id,
      title: activeItem.title,
      description: "description" in activeItem ? activeItem.description : "",
      mediaUrl: activeItemMedia.mediaUrl,
      message: activeItem.type === "forkliftChallenge" ? activeItem.message : "",
    });
  }, [hasFlowItems, activeItem.id]);

  useEffect(() => {
    if (
      !hasFlowItems ||
      activeItem.type === "quiz" ||
      activeItem.type === "finalRound" ||
      activeSlideDraft.itemId !== activeItem.id
    ) {
      return;
    }

    const currentDescription = "description" in activeItem ? activeItem.description : "";
    const currentMessage = activeItem.type === "forkliftChallenge" ? activeItem.message : "";
    const hasTitleChange = activeSlideDraft.title !== activeItem.title;
    const hasDescriptionChange = activeSlideDraft.description !== currentDescription;
    const hasMediaChange =
      (activeItem.type === "infoSlide" || activeItem.type === "mediaSlide") &&
      activeSlideDraft.mediaUrl !== activeItemMedia.mediaUrl;
    const hasMessageChange = activeItem.type === "forkliftChallenge" && activeSlideDraft.message !== currentMessage;

    if (!hasTitleChange && !hasDescriptionChange && !hasMediaChange && !hasMessageChange) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (activeItem.type === "infoSlide") {
        const cleanUrl = activeSlideDraft.mediaUrl.trim();
        const mediaType = inferMediaType(cleanUrl);
        updateFlowItem({
          ...activeItem,
          title: activeSlideDraft.title,
          description: activeSlideDraft.description,
          imageUrl: mediaType === "image" ? cleanUrl || undefined : undefined,
          mediaUrl: cleanUrl || undefined,
          mediaType,
          mediaSource: inferMediaSource(cleanUrl),
        });
        return;
      }

      if (activeItem.type === "mediaSlide") {
        const cleanUrl = activeSlideDraft.mediaUrl.trim();
        const mediaType = inferMediaType(cleanUrl);
        updateFlowItem({
          ...activeItem,
          title: activeSlideDraft.title,
          description: activeSlideDraft.description,
          mediaUrl: cleanUrl,
          mediaType,
          mediaSource: inferMediaSource(cleanUrl),
        });
        return;
      }

      updateFlowItem({
        ...activeItem,
        title: activeSlideDraft.title,
        description: activeSlideDraft.description,
        message: activeSlideDraft.message,
      });
    }, 450);

    return () => window.clearTimeout(timer);
  }, [activeItem, activeSlideDraft, hasFlowItems, updateFlowItem]);

  useEffect(() => {
    if (!hasFlowItems || activeItem.type !== "finalRound") {
      setActiveFinalRoundDraft(null);
      return;
    }

    setActiveFinalRoundDraft({
      ...activeItem,
      questions: activeItem.questions.map((question) => ({
        ...question,
        options: question.options.map((option) => ({ ...option })),
      })) as FinalRoundFlowItem["questions"],
    });
  }, [hasFlowItems, activeItem.id]);

  useEffect(() => {
    if (
      !hasFlowItems ||
      activeItem.type !== "finalRound" ||
      !activeFinalRoundDraft ||
      activeFinalRoundDraft.id !== activeItem.id ||
      JSON.stringify(activeFinalRoundDraft) === JSON.stringify(activeItem)
    ) {
      return;
    }

    const timer = window.setTimeout(() => updateFlowItem(activeFinalRoundDraft), 450);
    return () => window.clearTimeout(timer);
  }, [activeFinalRoundDraft, activeItem, hasFlowItems, updateFlowItem]);

  const addQuickFlowItem = (type: ContentFlowItem["type"]) => {
    if (type === "quiz") {
      addFlowItem({
        id: createFlowItemId("quiz"),
        type: "quiz",
        quizNumber: quizItemCount + 1,
        title: "Yeni soru",
        topic: "Genel",
        stage: "Admin Eklenen Quiz",
        timeLimitSeconds: 30,
        maxScore: 1000,
        mediaType: "none",
        mediaSource: "none",
        options: [
          { id: "A", text: "A seçeneği" },
          { id: "B", text: "B seçeneği" },
          { id: "C", text: "C seçeneği" },
          { id: "D", text: "D seçeneği" },
        ],
        correctOptionId: "A",
      });
      return;
    }

    if (type === "infoSlide") {
      addFlowItem({
        id: createFlowItemId("infoSlide"),
        type: "infoSlide",
        title: "Yeni bilgi slaytı",
        category: "Genel",
        description: "Kısa açıklama yazın.",
        timeLimitSeconds: 20,
      });
      return;
    }

    if (type === "mediaSlide") {
      addFlowItem({
        id: createFlowItemId("mediaSlide"),
        type: "mediaSlide",
        title: "Yeni medya slaytı",
        category: "Genel",
        description: "Medya açıklaması yazın.",
        mediaUrl: "/images/warehouse-hazards.jpg",
        mediaType: "image",
        mediaSource: "public-path",
        timeLimitSeconds: 20,
      });
      return;
    }

    if (type === "finalRound") {
      if (!hasFinalRound && !finalRoundAddRequested) {
        setFinalRoundAddRequested(true);
        addFlowItem(createDefaultFinalRound());
      }
      return;
    }

    addFlowItem({
      id: createFlowItemId("forkliftChallenge"),
      type: "forkliftChallenge",
      title: "Forklift finali",
      category: "Final",
      description: "Final etabı açıklaması.",
      timeLimitSeconds: 60,
      maxScore: 1000,
      message: "Hızlı olan değil, güvenli süren kazanır.",
    });
  };

  const handleDropFlowItem = (targetIndex: number) => {
    if (!draggedFlowItemId) {
      return;
    }

    reorderFlowItem(draggedFlowItemId, targetIndex);
    setDraggedFlowItemId(null);
  };

  const patchActiveQuiz = (patch: Partial<QuizFlowItem>) => {
    if (!hasFlowItems || activeItem.type !== "quiz") {
      return;
    }
    updateFlowItem({ ...activeItem, ...patch });
  };

  const patchActiveQuizMedia = (mediaUrl: string, uploadedMediaType?: "image" | "video") => {
    if (!hasFlowItems || activeItem.type !== "quiz") {
      return;
    }

    setActiveQuizDraft((current) => ({
      ...current,
      itemId: activeItem.id,
      mediaUrl,
    }));
  };

  const handleActiveQuizMediaUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setMediaMessage("Sadece görsel veya video dosyası seçilebilir.");
      event.currentTarget.value = "";
      return;
    }

    setMediaMessage(null);
    try {
      const uploaded = await uploadMediaFile(file);
      patchActiveQuizMedia(uploaded.path, uploaded.mediaType);
      setMediaMessage(null);
    } catch (error) {
      setMediaMessage(error instanceof Error ? error.message : "Dosya yüklenemedi.");
    } finally {
      event.currentTarget.value = "";
    }
  };

  const handleActiveSlideMediaUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];

    if (!file || !hasFlowItems || (activeItem.type !== "infoSlide" && activeItem.type !== "mediaSlide")) {
      return;
    }

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setMediaMessage("Sadece görsel veya video dosyası seçilebilir.");
      event.currentTarget.value = "";
      return;
    }

    setMediaMessage(null);
    try {
      const uploaded = await uploadMediaFile(file);
      setActiveSlideDraft((current) => ({
        ...current,
        itemId: activeItem.id,
        mediaUrl: uploaded.path,
      }));
      setMediaMessage(null);
    } catch (error) {
      setMediaMessage(error instanceof Error ? error.message : "Dosya yüklenemedi.");
    } finally {
      event.currentTarget.value = "";
    }
  };

  const setQuizOptionText = (optionId: AnswerId, text: string) => {
    if (!hasFlowItems || activeItem.type !== "quiz") {
      return;
    }
    setActiveQuizDraft((current) => ({
      ...current,
      itemId: activeItem.id,
      options: {
        ...current.options,
        [optionId]: text,
      },
    }));
  };

  const patchActiveFinalRound = (patch: Partial<FinalRoundFlowItem>) => {
    setActiveFinalRoundDraft((current) => (current ? { ...current, ...patch } : current));
  };

  const patchFinalRoundQuestion = (
    questionIndex: number,
    patch: Partial<FinalRoundFlowItem["questions"][number]>,
  ) => {
    setActiveFinalRoundDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        questions: current.questions.map((question, index) =>
          index === questionIndex ? { ...question, ...patch } : question,
        ) as FinalRoundFlowItem["questions"],
      };
    });
  };

  const setFinalRoundOptionText = (questionIndex: number, optionId: AnswerId, text: string) => {
    setActiveFinalRoundDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        questions: current.questions.map((question, index) =>
          index === questionIndex
            ? {
                ...question,
                options: question.options.map((option) => (option.id === optionId ? { ...option, text } : option)),
              }
            : question,
        ) as FinalRoundFlowItem["questions"],
      };
    });
  };

  const updateSettingsDraft = (patch: Partial<GameSettings>) => {
    isSettingsDraftDirty.current = true;
    setSettingsDraft((current) => ({ ...current, ...patch }));
  };

  return (
    <div className="flex h-screen overflow-hidden flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 text-slate-950">
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
            onClick={() => downloadResultsCsv(state)}
            className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white xl:block"
          >
            CSV
          </button>
          <form action="/api/admin/logout" method="post" className="hidden md:block">
            <button
              type="submit"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              Çıkış
            </button>
          </form>
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
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Left — flow */}
          <aside className="hidden h-full w-[20rem] shrink-0 overflow-hidden flex-col border-r border-blue-200/40 bg-gradient-to-b from-white to-slate-50 shadow-lg lg:flex">
            <div className="border-b border-blue-100/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">Yarışma Akışı</p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">{state.flowItems.length} öğe</h2>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-50 to-indigo-50 p-3 shadow-sm">
                  <p className="text-xl font-bold text-blue-900">{quizItemCount}</p>
                  <p className="text-[11px] font-semibold text-blue-600">Soru</p>
                </div>
                <div className="rounded-2xl border border-purple-200/70 bg-gradient-to-br from-purple-50 to-pink-50 p-3 shadow-sm">
                  <p className="text-xl font-bold text-purple-900">{contentItemCount}</p>
                  <p className="text-[11px] font-semibold text-purple-600">İçerik</p>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
              {state.flowItems.length ? (
                state.flowItems.map((item, index) => {
                  const isActive = index === state.activeItemIndex;
                  return (
                    <article
                      key={item.id}
                      draggable
                      onDragStart={() => setDraggedFlowItemId(item.id)}
                      onDragEnd={() => setDraggedFlowItemId(null)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => handleDropFlowItem(index)}
                      className={`cursor-grab rounded-2xl border transition-all shadow-sm active:cursor-grabbing ${
                        isActive
                          ? "border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md ring-4 ring-blue-100"
                          : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"
                      }`}
                    >
                      <button type="button" onClick={() => goToItem(index)} className="block w-full p-3 text-left">
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg shadow-sm ${
                              isActive ? "border-blue-300 bg-white" : "border-slate-200 bg-slate-50"
                            }`}
                          >
                            {flowThumbnails[item.type]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                                  isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {String(index + 1).padStart(2, "0")}
                              </span>
                              <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                                  isActive ? "bg-white text-blue-700 shadow-sm" : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {flowTypeLabels[item.type]}
                              </span>
                            </div>
                            <p className={`mt-2 line-clamp-2 text-sm font-bold leading-snug ${isActive ? "text-blue-950" : "text-slate-800"}`}>
                              {item.title}
                            </p>
                          </div>
                        </div>
                      </button>
                      <div className="grid grid-cols-4 gap-1 border-t border-slate-100 px-2 py-1.5">
                        <button
                          type="button"
                          title="Yukarı"
                          disabled={index === 0}
                          onClick={() => moveFlowItem(item.id, -1)}
                          className="rounded-lg py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          title="Aşağı"
                          disabled={index === state.flowItems.length - 1}
                          onClick={() => moveFlowItem(item.id, 1)}
                          className="rounded-lg py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          title="Çoğalt"
                          disabled={item.type === "finalRound"}
                          onClick={() => duplicateFlowItem(item.id)}
                          className="rounded-lg py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
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
                          className="rounded-lg py-2 text-xs font-bold text-red-500 hover:bg-red-50"
                        >
                          ✕
                        </button>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-center">
                  <p className="text-sm font-bold text-slate-700">Akış boş</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Yarışma sekmesinden ilk içeriği ekleyin.</p>
                  <button
                    type="button"
                    onClick={() => addQuickFlowItem("quiz")}
                    className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
                  >
                    Soru ekle
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 bg-white/90 p-3">
              <div className="mb-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => addQuickFlowItem("quiz")}
                  className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
                >
                  + Soru
                </button>
                <button
                  type="button"
                  onClick={() => addQuickFlowItem("infoSlide")}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  + Slayt
                </button>
                <button
                  type="button"
                  onClick={() => addQuickFlowItem("forkliftChallenge")}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  + Forklift
                </button>
                <button
                  type="button"
                  disabled={hasFinalRound || finalRoundAddRequested}
                  onClick={() => addQuickFlowItem("finalRound")}
                  className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {hasFinalRound || finalRoundAddRequested ? "Final Round eklendi" : "+ Final Round"}
                </button>
              </div>
            </div>
          </aside>

          {/* Center — canvas */}
          <main className="min-h-0 flex-1 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 p-2 lg:p-3">
            <div className="mx-auto flex h-full max-w-5xl flex-col">
              {!hasFlowItems ? (
                <div className="rounded-2xl border border-blue-200/50 bg-gradient-to-br from-white to-blue-50/30 p-12 text-center shadow-xl">
                  <h2 className="text-2xl font-bold text-slate-950">Yarışma akışında içerik yok</h2>
                  <p className="mt-3 text-base text-slate-500">Yarışma sekmesinden öğe ekleyin veya Kütüphane ekranından örnek yarışmayı açın.</p>
                </div>
              ) : activeItem.type === "quiz" ? (
                <>
                  <div className="mb-2 shrink-0">
                    <h2 className="text-lg font-bold text-slate-950">{getQuestionLabel(activeItem, state)}</h2>
                  </div>

                  <div className="mb-2 shrink-0 rounded-2xl border border-blue-200/50 bg-gradient-to-br from-white to-blue-50/20 p-3 shadow-lg">
                    <input
                      type="text"
                      value={activeQuizDraft.itemId === activeItem.id ? activeQuizDraft.title : activeItem.title}
                      onChange={(event) =>
                        setActiveQuizDraft((current) => ({
                          ...current,
                          itemId: activeItem.id,
                          title: event.target.value,
                        }))
                      }
                      className="w-full border-none bg-transparent text-2xl font-bold leading-tight text-slate-950 outline-none placeholder:text-slate-400"
                      placeholder="Sorunuzu buraya yazın..."
                    />
                    {activeItem.explanation && state.showCorrectAnswer ? (
                      <p className="mt-5 rounded-xl border border-emerald-300/50 bg-gradient-to-r from-emerald-50 to-green-50 p-4 text-base font-medium text-emerald-800 shadow-sm">
                        {activeItem.explanation}
                      </p>
                    ) : null}
                  </div>

                  <div className="mb-2 shrink-0 rounded-2xl border border-blue-200/50 bg-gradient-to-br from-white to-blue-50/20 p-2 shadow-lg">
                    <div className="rounded-2xl border-2 border-dashed border-blue-300/50 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 p-2">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Medya Ekle</p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            Görsel, video veya YouTube bağlantısı
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                          {activeQuizMediaType === "none" ? "Medya yok" : activeQuizMediaType}
                        </span>
                      </div>
                      <AdminMediaPreview mediaUrl={activeQuizMediaUrl} title={activeQuizDraft.title || activeItem.title} />
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-blue-600">Bilgisayardan Dosya Seç</span>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={(event) => void handleActiveQuizMediaUpload(event)}
                            className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1 file:text-sm file:font-bold file:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-blue-600">Link / YouTube URL</span>
                          <input
                            type="text"
                            value={activeQuizMediaUrl}
                            onChange={(event) => patchActiveQuizMedia(event.target.value)}
                            placeholder="/images/warehouse-hazards.jpg"
                            className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          />
                        </label>
                      </div>
                      {mediaMessage ? <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{mediaMessage}</p> : null}
                      {activeQuizMediaType === "none" && activeQuizMediaUrl ? (
                        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                          Bağlantı desteklenen görsel, video veya YouTube formatı değil.
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-2">
                    {answerOptionIds.map((optionId) => {
                      const optionText =
                        activeQuizDraft.itemId === activeItem.id
                          ? activeQuizDraft.options[optionId]
                          : activeItem.options.find((entry) => entry.id === optionId)?.text;
                      const isCorrect = activeItem.correctOptionId === optionId;
                      const styles = answerBlockStyles[optionId];
                      return (
                        <div
                          key={optionId}
                          className={`relative min-h-20 rounded-2xl p-4 text-left shadow-lg transition-all ${isCorrect ? styles.active : styles.base}`}
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
                              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-xl font-bold text-white shadow-lg"
                            >
                              {optionId}
                            </button>
                            <input
                              type="text"
                              value={optionText ?? ""}
                              onChange={(event) => setQuizOptionText(optionId, event.target.value)}
                              className="flex-1 border-none bg-transparent text-lg font-semibold text-white outline-none placeholder:text-white/60"
                              placeholder={`${optionId} seçeneği`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : activeItem.type === "finalRound" && activeFinalRoundDraft ? (
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                  <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-sm">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Final Round</p>
                        <h2 className="mt-1 text-2xl font-black text-slate-950">Intro içeriği</h2>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-amber-800 shadow-sm">
                        3 final sorusu
                      </span>
                    </div>
                    <div className="grid gap-3">
                      <label className="block">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-600">Akış başlığı</span>
                        <input
                          type="text"
                          value={activeFinalRoundDraft.title}
                          onChange={(event) => patchActiveFinalRound({ title: event.target.value })}
                          className="mt-2 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-lg font-bold text-slate-950 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-600">Intro başlığı</span>
                        <input
                          type="text"
                          value={activeFinalRoundDraft.introTitle}
                          onChange={(event) => patchActiveFinalRound({ introTitle: event.target.value })}
                          className="mt-2 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-lg font-bold text-slate-950 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-600">Intro mesajı</span>
                        <textarea
                          value={activeFinalRoundDraft.introMessage}
                          onChange={(event) => patchActiveFinalRound({ introMessage: event.target.value })}
                          className="mt-2 min-h-24 w-full resize-none rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                        />
                      </label>
                    </div>
                  </section>

                  {activeFinalRoundDraft.questions.map((question, questionIndex) => (
                    <section key={question.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-xl font-black text-slate-950">Final Soru {questionIndex + 1}</h3>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          {question.id}
                        </span>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="block md:col-span-2">
                          <span className="text-xs font-bold uppercase tracking-wide text-slate-600">Senaryo metni</span>
                          <textarea
                            value={question.scenarioText}
                            onChange={(event) => patchFinalRoundQuestion(questionIndex, { scenarioText: event.target.value })}
                            className="mt-2 min-h-24 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          />
                        </label>
                        <label className="block">
                          <span className="text-xs font-bold uppercase tracking-wide text-slate-600">Senaryo süresi</span>
                          <input
                            type="number"
                            min={1}
                            value={question.scenarioDurationSeconds}
                            onChange={(event) =>
                              patchFinalRoundQuestion(questionIndex, {
                                scenarioDurationSeconds: Math.max(1, Number(event.target.value) || 1),
                              })
                            }
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          />
                        </label>
                        <label className="block">
                          <span className="text-xs font-bold uppercase tracking-wide text-slate-600">Soru süresi</span>
                          <input
                            type="number"
                            min={1}
                            value={question.timeLimitSeconds}
                            onChange={(event) =>
                              patchFinalRoundQuestion(questionIndex, {
                                timeLimitSeconds: Math.max(1, Number(event.target.value) || 1),
                              })
                            }
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          />
                        </label>
                        <label className="block md:col-span-2">
                          <span className="text-xs font-bold uppercase tracking-wide text-slate-600">Soru metni</span>
                          <textarea
                            value={question.questionText}
                            onChange={(event) => patchFinalRoundQuestion(questionIndex, { questionText: event.target.value })}
                            className="mt-2 min-h-20 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          />
                        </label>
                        {question.options.map((option) => (
                          <label key={option.id} className="block">
                            <span className="text-xs font-bold uppercase tracking-wide text-slate-600">{option.id} şıkkı</span>
                            <input
                              type="text"
                              value={option.text}
                              onChange={(event) => setFinalRoundOptionText(questionIndex, option.id, event.target.value)}
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            />
                          </label>
                        ))}
                        <div className="md:col-span-2">
                          <span className="text-xs font-bold uppercase tracking-wide text-slate-600">Doğru cevap</span>
                          <div className="mt-2 flex gap-2">
                            {answerOptionIds.map((optionId) => (
                              <button
                                key={optionId}
                                type="button"
                                onClick={() => patchFinalRoundQuestion(questionIndex, { correctOptionId: optionId })}
                                className={`h-11 w-11 rounded-xl text-sm font-black transition ${
                                  question.correctOptionId === optionId
                                    ? correctAnswerChipStyles[optionId]
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                              >
                                {optionId}
                              </button>
                            ))}
                          </div>
                        </div>
                        <label className="block md:col-span-2">
                          <span className="text-xs font-bold uppercase tracking-wide text-slate-600">Medya linki</span>
                          <input
                            type="text"
                            value={question.mediaUrl ?? ""}
                            onChange={(event) => {
                              const mediaUrl = event.target.value;
                              patchFinalRoundQuestion(questionIndex, {
                                mediaUrl: mediaUrl || undefined,
                                mediaType: inferMediaType(mediaUrl),
                                mediaSource: inferMediaSource(mediaUrl),
                              });
                            }}
                            placeholder="/api/media/uploads/gorsel.jpg veya https://youtu.be/..."
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          />
                          <span className="mt-1 block text-xs font-semibold text-slate-500">
                            Tür: {question.mediaType === "none" || !question.mediaType ? "medya yok" : question.mediaType}
                          </span>
                        </label>
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        {flowTypeLabels[activeItem.type]}
                      </span>
                      <span className="text-xs text-slate-400">Akış {activeIndexLabel}</span>
                    </div>
                    <input
                      type="text"
                      value={activeSlideDraft.itemId === activeItem.id ? activeSlideDraft.title : activeItem.title}
                      onChange={(event) =>
                        setActiveSlideDraft((current) => ({
                          ...current,
                          itemId: activeItem.id,
                          title: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-2xl font-bold text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      placeholder="Başlık yazın"
                    />
                    {"description" in activeItem ? (
                      <textarea
                        value={activeSlideDraft.itemId === activeItem.id ? activeSlideDraft.description : activeItem.description}
                        onChange={(event) =>
                          setActiveSlideDraft((current) => ({
                            ...current,
                            itemId: activeItem.id,
                            description: event.target.value,
                          }))
                        }
                        className="mt-3 min-h-28 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold leading-relaxed text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        placeholder="Açıklama yazın"
                      />
                    ) : null}
                    {activeItem.type === "forkliftChallenge" ? (
                      <input
                        type="text"
                        value={activeSlideDraft.itemId === activeItem.id ? activeSlideDraft.message : activeItem.message}
                        onChange={(event) =>
                          setActiveSlideDraft((current) => ({
                            ...current,
                            itemId: activeItem.id,
                            message: event.target.value,
                          }))
                        }
                        className="mt-3 w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-base font-semibold text-amber-800 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                        placeholder="Final ekran mesajı"
                      />
                    ) : null}
                    {activeItem.type === "infoSlide" || activeItem.type === "mediaSlide" ? (
                      <div className="mt-4 rounded-2xl border-2 border-dashed border-blue-300/50 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 p-3">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Medya Ekle</p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              {activeItem.type === "infoSlide" ? "Bilgi slaytı için opsiyonel görsel, video veya YouTube bağlantısı" : "Görsel, video veya YouTube bağlantısı"}
                            </p>
                          </div>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                            {activeSlideMediaType === "none" ? "Medya yok" : activeSlideMediaType}
                          </span>
                        </div>
                        <AdminMediaPreview mediaUrl={activeSlideMediaUrl} title={activeSlideDraft.title || activeItem.title} />
                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                          <label className="block">
                            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-blue-600">Bilgisayardan Dosya Seç</span>
                            <input
                              type="file"
                              accept="image/*,video/*"
                              onChange={(event) => void handleActiveSlideMediaUpload(event)}
                              className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1 file:text-sm file:font-bold file:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            />
                          </label>
                          <label className="block">
                            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-blue-600">Link / YouTube URL</span>
                            <input
                              type="text"
                              value={activeSlideMediaUrl}
                              onChange={(event) =>
                                setActiveSlideDraft((current) => ({
                                  ...current,
                                  itemId: activeItem.id,
                                  mediaUrl: event.target.value,
                                }))
                              }
                              placeholder="/api/media/uploads/video.mp4 veya https://youtu.be/..."
                              className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            />
                          </label>
                        </div>
                        {mediaMessage ? <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{mediaMessage}</p> : null}
                        {activeSlideMediaType === "none" && activeSlideMediaUrl ? (
                          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                            Bağlantı desteklenen görsel, video veya YouTube formatı değil.
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <p className="text-center text-sm text-slate-500">
                    Değişiklikler kısa süre içinde otomatik kaydedilir.
                  </p>
                </div>
              )}
            </div>
          </main>

          {/* Right — inspector */}
          <aside className="hidden h-full min-h-0 w-96 shrink-0 flex-col overflow-y-auto border-l border-blue-200/30 bg-gradient-to-b from-white to-blue-50/20 shadow-lg xl:flex">
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

                  <div>
                    <label className="mb-2.5 block text-xs font-semibold text-slate-600">Medya linki</label>
                    <input
                      type="text"
                      value={activeQuizMediaUrl}
                      onChange={(event) => patchActiveQuizMedia(event.target.value)}
                      placeholder="/images/warehouse-hazards.jpg veya https://youtu.be/..."
                      className="w-full rounded-xl border border-blue-200/60 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      Tür: {activeQuizMediaType === "none" ? "medya yok" : activeQuizMediaType}
                    </p>
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
              {isFinalRoundSelected ? (
                <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold leading-relaxed text-amber-900">
                  <p>Final Round runtime aktif. Senaryo ve soru süreleri dolduğunda projeksiyon ekranı otomatik ilerler.</p>
                  {activeFinalRoundRuntime ? (
                    <p className="mt-2 text-xs uppercase tracking-wide text-amber-700">
                      Adım: {activeFinalRoundRuntime.step} · Soru: {activeFinalRoundRuntime.questionIndex + 1} · Risk: %
                      {activeFinalRoundRuntime.riskLevel}
                    </p>
                  ) : null}
                </div>
              ) : null}
              <div className="space-y-2.5">
                {isFinalRoundSelected ? (
                  <>
                    <ControlButton variant="primary" onClick={startActiveItem} disabled={Boolean(activeFinalRoundRuntime)}>
                      Final Round'u Başlat
                    </ControlButton>
                    <ControlButton
                      variant="secondary"
                      onClick={advanceFinalRound}
                      disabled={
                        !activeFinalRoundRuntime ||
                        activeFinalRoundRuntime.step === "scenario" ||
                        activeFinalRoundRuntime.step === "question"
                      }
                    >
                      {finalRoundAdvanceLabel}
                    </ControlButton>
                  </>
                ) : (
                  <>
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
                  </>
                )}
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
        <main className="min-h-0 flex-1 overflow-y-auto bg-[#f5f7fb] p-4 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Yarışma Kütüphanesi</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">Kayıtlı Yarışmalar</h2>
                <p className="mt-1 max-w-2xl text-sm text-slate-500">
                  Yarışma seçin, kopyalayın veya boş bir yarışma oluşturarak başlayın.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleCreateBlankCompetition()}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Yeni Yarışma Oluştur
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
                {editingCompetitionId ? (
                  <p className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                    Düzenlenen kayıt güncellenecek.
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={handleSaveCompetition}
                  className="mt-3 w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Yarışmayı Kaydet
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
                          <div className="mt-4 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => void handlePlaySavedCompetition(entry.id)}
                              className="rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                            >
                              Oyna
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleEditSavedCompetition(entry)}
                              className="rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                              Düzenle
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateSavedCompetition(entry.id)}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
                            >
                              Kopyala
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSavedCompetition(entry)}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                            >
                              Sil
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                    <p className="text-base font-bold text-slate-800">Henüz kayıtlı yarışma yok</p>
                    <p className="mt-2 text-sm text-slate-500">Yeni yarışma oluşturabilir veya mevcut yarışmayı kaydedebilirsiniz.</p>
                  </div>
                )}
              </section>
            </div>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-950">Çöp Kutusu</h3>
                  <p className="mt-1 text-sm text-slate-500">{trashedCompetitions.length} silinmiş kayıt</p>
                </div>
                <button
                  type="button"
                  onClick={refreshSavedCompetitions}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Yenile
                </button>
              </div>

              {trashedCompetitions.length ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {trashedCompetitions.map((entry) => {
                    const entryQuizCount = entry.flowItems.filter((item) => item.type === "quiz").length;

                    return (
                      <article key={entry.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-base font-bold text-slate-950">{entry.name}</p>
                            <p className="mt-1 text-xs font-medium text-slate-500">
                              Silinme: {formatSavedDate(entry.deletedAt ?? entry.updatedAt)}
                            </p>
                          </div>
                          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-100">
                            Çöp
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
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleRestoreSavedCompetition(entry)}
                            className="rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                          >
                            Geri Yükle
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePermanentlyDeleteSavedCompetition(entry)}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                          >
                            Kalıcı Sil
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <p className="text-sm font-semibold text-slate-600">Çöp Kutusu boş.</p>
                </div>
              )}
            </section>
          </div>
        </main>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto bg-[#f5f7fb] p-6 lg:p-8">
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
                    onChange={(event) => updateSettingsDraft({ productBrandName: event.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">Müşteri adı</span>
                  <input
                    value={brand.customerName}
                    onChange={(event) => updateSettingsDraft({ customerName: event.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-medium text-slate-500">Watermark metni</span>
                  <input
                    value={brand.watermarkText}
                    onChange={(event) => updateSettingsDraft({ watermarkText: event.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">Müşteri logo metni (opsiyonel)</span>
                  <input
                    value={brand.customerLogoText ?? ""}
                    onChange={(event) => updateSettingsDraft({ customerLogoText: event.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">Müşteri logo URL (opsiyonel)</span>
                  <input
                    value={brand.customerLogoUrl ?? ""}
                    onChange={(event) => updateSettingsDraft({ customerLogoUrl: event.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-medium text-slate-500">Tema</span>
                  <select
                    value={brand.themeId}
                    onChange={(event) => updateSettingsDraft({ themeId: event.target.value })}
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
                    value={settingsDraft.welcomeTitle}
                    onChange={(event) => updateSettingsDraft({ welcomeTitle: event.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    rows={3}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">Maksimum takım</span>
                  <input
                    value={settingsDraft.maxTeams}
                    onChange={(event) => updateSettingsDraft({ maxTeams: Number(event.target.value) })}
                    type="number"
                    min={1}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">Takım kişi sayısı</span>
                  <input
                    value={settingsDraft.teamSize}
                    onChange={(event) => updateSettingsDraft({ teamSize: Number(event.target.value) })}
                    type="number"
                    min={1}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">1. ödül</span>
                  <input
                    value={settingsDraft.prizeFirst}
                    onChange={(event) => updateSettingsDraft({ prizeFirst: Number(event.target.value) })}
                    type="number"
                    min={0}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">2. ödül</span>
                  <input
                    value={settingsDraft.prizeSecond}
                    onChange={(event) => updateSettingsDraft({ prizeSecond: Number(event.target.value) })}
                    type="number"
                    min={0}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">3. ödül</span>
                  <input
                    value={settingsDraft.prizeThird}
                    onChange={(event) => updateSettingsDraft({ prizeThird: Number(event.target.value) })}
                    type="number"
                    min={0}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">Para birimi</span>
                  <input
                    value={settingsDraft.currency}
                    onChange={(event) => updateSettingsDraft({ currency: event.target.value.toLocaleUpperCase("tr-TR") })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <span className="font-medium text-slate-700">PIN:</span> {formattedPin} ·{" "}
                <span className="font-medium text-slate-700">Faz:</span> {phaseLabels[state.phase]}
              </div>
            </section>

          </div>
        </div>
      )}
    </div>
  );
}
