"use client";

import { useEffect, useMemo, useState, type DragEvent } from "react";
import { useGameState } from "@/hooks/useGameState";

type Screen = "library" | "editor" | "lobby" | "projection";
type EditorTab = "competition" | "settings" | "theme" | "library";
type QuizItemType =
  | "quiz"
  | "true-false"
  | "info-slide"
  | "media-slide"
  | "forklift-stage"
  | "hazard-count"
  | "image-analysis";
type MediaLayout = "standard" | "large" | "fullscreen";
type ProjectionStep = "question" | "media-question" | "answers" | "correct" | "leaderboard" | "final";

type Competition = {
  id: string;
  name: string;
  customerName: string;
  themeName: string;
  questionCount: number;
  lastUpdated: string;
  status: "draft" | "ready" | "live";
};

type QuizOption = {
  id: string;
  text: string;
  isCorrect: boolean;
};

type QuizItem = {
  id: string;
  order: number;
  type: QuizItemType;
  title: string;
  question?: string;
  options?: QuizOption[];
  media?: {
    type: "image" | "video" | "youtube";
    url: string;
  };
  mediaLayout?: MediaLayout;
  timeLimit: number;
  points: number;
};

type Theme = {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  accentColor: string;
  preview: string;
};

const warehouseImageUrl = "/images/warehouse-hazards.jpg";

const competitionsSeed: Competition[] = [
  {
    id: "1",
    name: "Beyzer Depo ISG Bilgi Yarismasi",
    customerName: "LC Waikiki",
    themeName: "Kurumsal Mavi",
    questionCount: 25,
    lastUpdated: "2024-01-15",
    status: "ready",
  },
  {
    id: "2",
    name: "Forklift Guvenligi Egitimi",
    customerName: "Beyzer Depo",
    themeName: "Depo",
    questionCount: 18,
    lastUpdated: "2024-01-14",
    status: "draft",
  },
  {
    id: "3",
    name: "Yangin Guvenligi Bilgi Yarismasi",
    customerName: "Migros",
    themeName: "Guvenlik Sarisi",
    questionCount: 20,
    lastUpdated: "2024-01-12",
    status: "ready",
  },
  {
    id: "4",
    name: "Kimyasal Madde Guvenligi",
    customerName: "BASF Turkiye",
    themeName: "Neon",
    questionCount: 15,
    lastUpdated: "2024-01-10",
    status: "draft",
  },
];

const quizItemsSeed: QuizItem[] = [
  {
    id: "1",
    order: 1,
    type: "info-slide",
    title: "Hos Geldiniz",
    question: "Beyzer Depo ISG Bilgi Yarismasina Hos Geldiniz!",
    timeLimit: 10,
    points: 0,
  },
  {
    id: "2",
    order: 2,
    type: "quiz",
    title: "Kisisel Koruyucu Donanim",
    question: "Forklift operatoru hangi kisisel koruyucu donanimi mutlaka kullanmalidir?",
    options: [
      { id: "a", text: "Baret", isCorrect: false },
      { id: "b", text: "Emniyet kemeri", isCorrect: true },
      { id: "c", text: "Gozluk", isCorrect: false },
      { id: "d", text: "Eldiven", isCorrect: false },
    ],
    timeLimit: 30,
    points: 100,
  },
  {
    id: "3",
    order: 3,
    type: "hazard-count",
    title: "Tehlike Sayma",
    question: "Gorselde kac tehlikeli durum var?",
    media: { type: "image", url: warehouseImageUrl },
    mediaLayout: "large",
    options: [
      { id: "a", text: "1", isCorrect: false },
      { id: "b", text: "2", isCorrect: false },
      { id: "c", text: "3", isCorrect: false },
      { id: "d", text: "4", isCorrect: true },
    ],
    timeLimit: 45,
    points: 150,
  },
  {
    id: "4",
    order: 4,
    type: "true-false",
    title: "Dogru/Yanlis",
    question: "Forklift ile yuk tasirken catallar yere yakin tutulmalidir.",
    options: [
      { id: "a", text: "Dogru", isCorrect: true },
      { id: "b", text: "Yanlis", isCorrect: false },
    ],
    timeLimit: 20,
    points: 50,
  },
  {
    id: "5",
    order: 5,
    type: "media-slide",
    title: "Guvenlik Videosu",
    question: "Forklift Guvenlik Kurallari",
    media: { type: "video", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    mediaLayout: "fullscreen",
    timeLimit: 60,
    points: 0,
  },
  {
    id: "6",
    order: 6,
    type: "image-analysis",
    title: "Gorsel Analiz",
    question: "Gorseldeki isaretlerin anlami nedir?",
    media: { type: "image", url: warehouseImageUrl },
    mediaLayout: "large",
    options: [
      { id: "a", text: "Yangin cikisi ve toplanma noktasi", isCorrect: true },
      { id: "b", text: "Acil durum ve ilk yardim", isCorrect: false },
      { id: "c", text: "Tehlikeli alan ve yasak bolge", isCorrect: false },
      { id: "d", text: "Koruyucu ekipman gerekliligi", isCorrect: false },
    ],
    timeLimit: 40,
    points: 125,
  },
  {
    id: "7",
    order: 7,
    type: "forklift-stage",
    title: "Forklift Etabi",
    question: "Forklift kullanirken hangi durumda emniyet kemeri takilmalidir?",
    options: [
      { id: "a", text: "Sadece hizli giderken", isCorrect: false },
      { id: "b", text: "Sadece yuk tasirken", isCorrect: false },
      { id: "c", text: "Her zaman", isCorrect: true },
      { id: "d", text: "Sadece disarida calisirken", isCorrect: false },
    ],
    timeLimit: 30,
    points: 100,
  },
];

const itemTypes: { id: QuizItemType; name: string; description: string; icon: string }[] = [
  { id: "quiz", name: "Quiz", description: "Coktan secmeli soru", icon: "?" },
  { id: "true-false", name: "Dogru/Yanlis", description: "Iki secenekli soru", icon: "✓" },
  { id: "info-slide", name: "Bilgi Slayti", description: "Bilgilendirme ekrani", icon: "i" },
  { id: "media-slide", name: "Medya Slayti", description: "Video veya gorsel", icon: "▶" },
  { id: "forklift-stage", name: "Forklift Etabi", description: "Forklift guvenligi sorusu", icon: "▣" },
  { id: "hazard-count", name: "Tehlike Sayma", description: "Gorselde tehlike sayma", icon: "!" },
  { id: "image-analysis", name: "Gorsel Analiz", description: "Gorsel analiz sorusu", icon: "◉" },
];

const themes: Theme[] = [
  {
    id: "corporate-blue",
    name: "Kurumsal Mavi",
    primaryColor: "#1e40af",
    secondaryColor: "#3b82f6",
    backgroundColor: "#f8fafc",
    accentColor: "#eab308",
    preview: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
  },
  {
    id: "warehouse",
    name: "Depo",
    primaryColor: "#78350f",
    secondaryColor: "#d97706",
    backgroundColor: "#fef3c7",
    accentColor: "#059669",
    preview: "linear-gradient(135deg, #78350f 0%, #d97706 100%)",
  },
  {
    id: "light",
    name: "Acik Tema",
    primaryColor: "#0f172a",
    secondaryColor: "#475569",
    backgroundColor: "#ffffff",
    accentColor: "#0ea5e9",
    preview: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
  },
  {
    id: "dark",
    name: "Koyu Tema",
    primaryColor: "#f8fafc",
    secondaryColor: "#94a3b8",
    backgroundColor: "#0f172a",
    accentColor: "#22d3ee",
    preview: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  },
  {
    id: "neon",
    name: "Neon",
    primaryColor: "#a855f7",
    secondaryColor: "#ec4899",
    backgroundColor: "#18181b",
    accentColor: "#22d3ee",
    preview: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
  },
  {
    id: "lc-waikiki",
    name: "LC Waikiki",
    primaryColor: "#e11d48",
    secondaryColor: "#fb7185",
    backgroundColor: "#fff1f2",
    accentColor: "#0d9488",
    preview: "linear-gradient(135deg, #e11d48 0%, #fb7185 100%)",
  },
  {
    id: "minimal",
    name: "Minimal Egitim",
    primaryColor: "#059669",
    secondaryColor: "#34d399",
    backgroundColor: "#ecfdf5",
    accentColor: "#0891b2",
    preview: "linear-gradient(135deg, #059669 0%, #34d399 100%)",
  },
  {
    id: "safety-yellow",
    name: "Guvenlik Sarisi",
    primaryColor: "#ca8a04",
    secondaryColor: "#facc15",
    backgroundColor: "#fefce8",
    accentColor: "#dc2626",
    preview: "linear-gradient(135deg, #ca8a04 0%, #facc15 100%)",
  },
];


const leaderboard = [
  { name: "Ahmet Y.", score: 2450, streak: 5, correct: true },
  { name: "Zeynep T.", score: 2380, streak: 4, correct: true },
  { name: "Mehmet K.", score: 2250, streak: 3, correct: false },
  { name: "Elif N.", score: 2100, streak: 2, correct: true },
  { name: "Ali R.", score: 1950, streak: 4, correct: true },
  { name: "Fatma D.", score: 1820, streak: 1, correct: false },
  { name: "Hasan O.", score: 1750, streak: 3, correct: true },
  { name: "Ayse S.", score: 1680, streak: 2, correct: false },
  { name: "Mustafa B.", score: 1520, streak: 0, correct: false },
  { name: "Hatice A.", score: 1400, streak: 1, correct: true },
];

const answerColors = ["bg-red-500", "bg-blue-500", "bg-amber-500", "bg-emerald-500"];

function cloneItems() {
  return quizItemsSeed.map((item) => ({
    ...item,
    options: item.options?.map((option) => ({ ...option })),
    media: item.media ? { ...item.media } : undefined,
  }));
}

function statusBadge(status: Competition["status"]) {
  if (status === "live") {
    return "bg-red-100 text-red-700";
  }
  if (status === "ready") {
    return "bg-emerald-100 text-emerald-700";
  }
  return "bg-slate-100 text-slate-700";
}

function statusLabel(status: Competition["status"]) {
  if (status === "live") {
    return "Canli";
  }
  if (status === "ready") {
    return "Hazir";
  }
  return "Taslak";
}

function itemTypeName(type: QuizItemType) {
  return itemTypes.find((item) => item.id === type)?.name ?? type;
}

function itemIcon(type: QuizItemType) {
  return itemTypes.find((item) => item.id === type)?.icon ?? "•";
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm ${
          compact ? "h-9 w-9" : "h-10 w-10"
        }`}
      >
        <span className="text-lg font-black">S</span>
      </div>
      <div>
        <p className={`${compact ? "text-base" : "text-xl"} font-bold leading-tight text-slate-950`}>Safety Area</p>
        {!compact ? <p className="text-xs text-slate-500">Kurumsal ISG Egitim Platformu</p> : null}
      </div>
    </div>
  );
}

function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  disabled?: boolean;
  className?: string;
}) {
  const variants = {
    primary: "bg-blue-600 text-white shadow-sm hover:bg-blue-700",
    secondary: "bg-slate-950 text-white shadow-sm hover:bg-slate-800",
    outline: "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:border-blue-200",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
    danger: "border border-red-200 bg-white text-red-600 hover:bg-red-50",
  };
  const sizes = {
    sm: "rounded-lg px-3 py-2 text-xs",
    md: "rounded-lg px-4 py-2.5 text-sm",
    lg: "rounded-xl px-6 py-4 text-base",
    icon: "h-9 w-9 rounded-lg text-sm",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

function AdminV0Header({
  activeTab,
  customerName,
  onTabChange,
  onBack,
  onLobby,
  onExit,
  gamePin,
}: {
  activeTab: EditorTab;
  customerName: string;
  onTabChange: (tab: EditorTab) => void;
  onBack: () => void;
  onLobby: () => void;
  onExit: () => void;
  gamePin: string;
}) {
  const tabs: { id: EditorTab; label: string }[] = [
    { id: "competition", label: "Yarisma" },
    { id: "settings", label: "Ayarlar" },
    { id: "theme", label: "Tema" },
    { id: "library", label: "Kutuphane" },
  ];

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 text-slate-950">
      <button type="button" onClick={onBack} className="flex min-w-0 items-center gap-4 rounded-lg pr-2 transition hover:bg-slate-50">
        <BrandMark compact />
        <span className="hidden h-6 w-px bg-slate-200 md:block" />
        <span className="hidden truncate text-sm font-medium text-slate-500 md:block">{customerName}</span>
      </button>

      <nav className="hidden items-center rounded-lg bg-slate-100 p-1 md:flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`rounded-md px-4 py-1.5 text-sm font-semibold transition ${
              activeTab === tab.id ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="flex shrink-0 items-center gap-2">
        <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-sm font-bold text-slate-700">
          # {gamePin}
        </span>
        <Button variant="ghost" size="sm">
          Goz
          <span className="hidden sm:inline">On Izle</span>
        </Button>
        <Button variant="outline" size="sm" onClick={onLobby}>
          ▶ Lobi
        </Button>
        <Button size="sm">Kaydet</Button>
        <Button variant="ghost" size="icon" onClick={onExit}>
          ×
        </Button>
      </div>
    </header>
  );
}

export function AdminV0App() {
  const [screen, setScreen] = useState<Screen>("library");
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string | null>(null);
  const selectedCompetition = competitionsSeed.find((competition) => competition.id === selectedCompetitionId);
  const competitionName = selectedCompetition?.name ?? "Yeni Yarisma";
  const customerName = selectedCompetition?.customerName ?? "LC Waikiki";

  return (
    <>
      {screen === "library" ? (
        <LibraryScreen
          onOpenCompetition={(id) => {
            setSelectedCompetitionId(id);
            setScreen("editor");
          }}
        />
      ) : null}

      {screen === "editor" && selectedCompetitionId ? (
        <EditorScreen
          competitionName={competitionName}
          customerName={customerName}
          onBack={() => {
            setSelectedCompetitionId(null);
            setScreen("library");
          }}
          onStartLobby={() => setScreen("lobby")}
        />
      ) : null}

      {screen === "lobby" ? (
        <LobbyScreen
          competitionName={competitionName}
          customerName={customerName}
          onBack={() => setScreen("editor")}
          onStart={() => setScreen("projection")}
        />
      ) : null}

      {screen === "projection" ? <ProjectionScreen customerName={customerName} onEnd={() => setScreen("library")} /> : null}
    </>
  );
}

function LibraryScreen({ onOpenCompetition }: { onOpenCompetition: (id: string) => void }) {
  const [competitions, setCompetitions] = useState<Competition[]>(competitionsSeed);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newCompetitionName, setNewCompetitionName] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");

  const createCompetition = () => {
    if (!newCompetitionName.trim()) {
      return;
    }

    const nextCompetition: Competition = {
      id: `new-${Date.now()}`,
      name: newCompetitionName.trim(),
      customerName: newCustomerName.trim() || "Yeni Musteri",
      themeName: "Kurumsal Mavi",
      questionCount: 0,
      lastUpdated: new Date().toISOString().slice(0, 10),
      status: "draft",
    };

    setCompetitions([nextCompetition, ...competitions]);
    setNewCompetitionName("");
    setNewCustomerName("");
    setNewDialogOpen(false);
  };

  const duplicateCompetition = (competition: Competition) => {
    setCompetitions([
      { ...competition, id: `copy-${Date.now()}`, name: `${competition.name} (Kopya)`, status: "draft" },
      ...competitions,
    ]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <BrandMark />
          <Button onClick={() => setNewDialogOpen(true)}>+ Yeni Yarisma Olustur</Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-950">Yarisma Kutuphanesi</h1>
          <p className="mt-1 text-slate-500">Kayitli yarismalarinizi yonetin ve duzenleyin.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {competitions.map((competition) => (
            <article
              key={competition.id}
              className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-blue-300 hover:shadow-lg"
            >
              <div className="p-5 pb-3">
                <div className="mb-4 flex items-start justify-between">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(competition.status)}`}>
                    {statusLabel(competition.status)}
                  </span>
                  <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <Button variant="ghost" size="icon" onClick={() => onOpenCompetition(competition.id)}>
                      Ac
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => duplicateCompetition(competition)}>
                      ⧉
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCompetitions(competitions.filter((entry) => entry.id !== competition.id))}
                    >
                      ×
                    </Button>
                  </div>
                </div>
                <h2 className="text-lg font-semibold leading-tight text-slate-950">{competition.name}</h2>
                <p className="mt-2 text-sm text-slate-500">👥 {competition.customerName}</p>
              </div>
              <div className="px-5 pb-5">
                <div className="space-y-2 text-sm text-slate-500">
                  <p>🎨 {competition.themeName}</p>
                  <p>❔ {competition.questionCount} soru</p>
                  <p>📅 {new Date(competition.lastUpdated).toLocaleDateString("tr-TR")}</p>
                </div>
                <Button variant="outline" className="mt-4 w-full" onClick={() => onOpenCompetition(competition.id)}>
                  📂 Duzenle
                </Button>
              </div>
            </article>
          ))}
        </div>
      </main>

      {newDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <section className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-950">Yeni Yarisma Olustur</h2>
            <p className="mt-1 text-sm text-slate-500">Yeni bir ISG bilgi yarismasi olusturun.</p>
            <label className="mt-5 block">
              <span className="text-sm font-medium text-slate-700">Yarisma Adi</span>
              <input
                value={newCompetitionName}
                onChange={(event) => setNewCompetitionName(event.target.value)}
                placeholder="Orn: Forklift Guvenligi Yarismasi"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">Musteri Adi</span>
              <input
                value={newCustomerName}
                onChange={(event) => setNewCustomerName(event.target.value)}
                placeholder="Orn: LC Waikiki"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setNewDialogOpen(false)}>
                Iptal
              </Button>
              <Button onClick={createCompetition}>Olustur</Button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function EditorScreen({
  competitionName,
  customerName,
  onBack,
  onStartLobby,
}: {
  competitionName: string;
  customerName: string;
  onBack: () => void;
  onStartLobby: () => void;
}) {
  const { state } = useGameState();
  const [items, setItems] = useState<QuizItem[]>(cloneItems);
  const [selectedItemId, setSelectedItemId] = useState(quizItemsSeed[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<EditorTab>("competition");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<Theme>(themes[0]);
  const [editedCustomerName, setEditedCustomerName] = useState(customerName);
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

  const selectedItem = items.find((item) => item.id === selectedItemId) ?? items[0];
  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase("tr-TR");
    if (!query) {
      return items;
    }
    return items.filter((item) => `${item.title} ${item.question ?? ""} ${itemTypeName(item.type)}`.toLocaleLowerCase("tr-TR").includes(query));
  }, [items, searchTerm]);

  const updateSelectedItem = (updates: Partial<QuizItem>) => {
    setItems((current) => current.map((item) => (item.id === selectedItem?.id ? { ...item, ...updates } : item)));
  };

  const updateOption = (optionId: string, updates: Partial<QuizOption>) => {
    if (!selectedItem?.options) {
      return;
    }
    updateSelectedItem({
      options: selectedItem.options.map((option) => (option.id === optionId ? { ...option, ...updates } : option)),
    });
  };

  const addItem = (type: QuizItemType) => {
    const nextItem: QuizItem = {
      id: `item-${Date.now()}`,
      order: items.length + 1,
      type,
      title: `Yeni ${itemTypeName(type)}`,
      question: "",
      options:
        type === "info-slide" || type === "media-slide"
          ? undefined
          : type === "true-false"
            ? [
                { id: "a", text: "Dogru", isCorrect: true },
                { id: "b", text: "Yanlis", isCorrect: false },
              ]
            : [
                { id: "a", text: "", isCorrect: false },
                { id: "b", text: "", isCorrect: false },
                { id: "c", text: "", isCorrect: false },
                { id: "d", text: "", isCorrect: false },
              ],
      media: type === "hazard-count" || type === "image-analysis" ? { type: "image", url: warehouseImageUrl } : undefined,
      mediaLayout: type === "hazard-count" || type === "image-analysis" ? "large" : "standard",
      timeLimit: type === "info-slide" ? 10 : 30,
      points: type === "info-slide" || type === "media-slide" ? 0 : 100,
    };
    setItems([...items, nextItem]);
    setSelectedItemId(nextItem.id);
    setAddDialogOpen(false);
    setActiveTab("competition");
  };

  const deleteItem = (id: string) => {
    const nextItems = items.filter((item) => item.id !== id).map((item, index) => ({ ...item, order: index + 1 }));
    setItems(nextItems);
    if (selectedItemId === id) {
      setSelectedItemId(nextItems[0]?.id ?? "");
    }
  };

  const duplicateItem = (item: QuizItem) => {
    const copy = {
      ...item,
      id: `copy-${Date.now()}`,
      order: items.length + 1,
      title: `${item.title} (Kopya)`,
      options: item.options?.map((option) => ({ ...option })),
      media: item.media ? { ...item.media } : undefined,
    };
    setItems([...items, copy]);
    setSelectedItemId(copy.id);
  };

  const dragStart = (event: DragEvent<HTMLDivElement>, id: string) => {
    setDraggedItemId(id);
    event.dataTransfer.effectAllowed = "move";
  };

  const dragOver = (event: DragEvent<HTMLDivElement>, id: string) => {
    event.preventDefault();
    setDragOverItemId(id);
  };

  const dragEnd = () => {
    if (draggedItemId && dragOverItemId && draggedItemId !== dragOverItemId) {
      const from = items.findIndex((item) => item.id === draggedItemId);
      const to = items.findIndex((item) => item.id === dragOverItemId);
      if (from >= 0 && to >= 0) {
        const nextItems = [...items];
        const [removed] = nextItems.splice(from, 1);
        nextItems.splice(to, 0, removed);
        setItems(nextItems.map((item, index) => ({ ...item, order: index + 1 })));
      }
    }
    setDraggedItemId(null);
    setDragOverItemId(null);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-950">
      <AdminV0Header
        activeTab={activeTab}
        customerName={editedCustomerName}
        onTabChange={setActiveTab}
        onBack={onBack}
        onLobby={onStartLobby}
        onExit={() => setUnsavedDialogOpen(true)}
        gamePin={state.settings.gamePin}
      />

      <div className="flex flex-1 overflow-hidden">
        <aside className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-3">
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500/15">
              <span className="text-slate-400">⌕</span>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Ara..."
                className="min-w-0 flex-1 border-none bg-transparent text-sm outline-none"
              />
            </label>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(event) => dragStart(event, item.id)}
                onDragOver={(event) => dragOver(event, item.id)}
                onDragEnd={dragEnd}
                onDrop={dragEnd}
                onClick={() => setSelectedItemId(item.id)}
                className={`group mb-2 flex cursor-pointer items-center gap-2 rounded-lg border p-2 transition hover:border-blue-300 hover:bg-slate-50 ${
                  selectedItemId === item.id ? "border-blue-500 bg-blue-50 shadow-sm" : "border-transparent"
                } ${draggedItemId === item.id ? "opacity-50" : ""} ${dragOverItemId === item.id ? "ring-2 ring-blue-300" : ""}`}
              >
                <div className="cursor-grab text-slate-400 active:cursor-grabbing">⋮⋮</div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-bold">
                  {item.order}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                      {itemIcon(item.type)} {itemTypeName(item.type)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-500">{item.title}</p>
                </div>
                <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    className="h-6 w-6 rounded-md text-xs text-slate-500 hover:bg-slate-100"
                    onClick={(event) => {
                      event.stopPropagation();
                      duplicateItem(item);
                    }}
                  >
                    ⧉
                  </button>
                  <button
                    type="button"
                    className="h-6 w-6 rounded-md text-xs text-red-600 hover:bg-red-50"
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteItem(item.id);
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-white p-3">
            <Button className="w-full" onClick={() => setAddDialogOpen(true)}>
              + Oge Ekle / Duzenle
            </Button>
          </div>
        </aside>

        <main className="flex flex-1 flex-col overflow-hidden">
          {activeTab === "competition" && selectedItem ? (
            <EditorCanvas item={selectedItem} updateItem={updateSelectedItem} updateOption={updateOption} />
          ) : null}

          {activeTab === "settings" ? (
            <SettingsPanel
              competitionName={competitionName}
              customerName={editedCustomerName}
              setCustomerName={setEditedCustomerName}
            />
          ) : null}

          {activeTab === "theme" ? (
            <ThemePanel
              themes={themes}
              selectedTheme={selectedTheme}
              setSelectedTheme={setSelectedTheme}
              customerName={editedCustomerName}
            />
          ) : null}

          {activeTab === "library" ? <QuestionLibrary /> : null}
        </main>

        <Inspector item={selectedItem} updateItem={updateSelectedItem} />
      </div>

      {addDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <section className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-950">Oge Ekle</h2>
            <p className="mt-1 text-sm text-slate-500">Yarismaniza eklemek istediginiz oge turunu secin.</p>
            <div className="grid gap-3 py-5 sm:grid-cols-2">
              {itemTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => addItem(type.id)}
                  className="flex items-start gap-4 rounded-lg border border-slate-200 p-4 text-left transition hover:border-blue-500 hover:bg-blue-50"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-lg font-black text-blue-700">
                    {type.icon}
                  </span>
                  <span>
                    <span className="block font-semibold text-slate-950">{type.name}</span>
                    <span className="text-sm text-slate-500">{type.description}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Kapat
              </Button>
            </div>
          </section>
        </div>
      ) : null}

      {unsavedDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <section className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-950">Kaydedilmemis degisiklikler var</h2>
            <p className="mt-2 text-sm text-slate-500">Cikarsaniz son degisiklikler kaybolabilir. Ne yapmak istersiniz?</p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setUnsavedDialogOpen(false)}>
                Duzenlemeye Don
              </Button>
              <Button variant="outline" onClick={onBack}>
                Kaydetmeden Cik
              </Button>
              <Button onClick={onBack}>Kaydet ve Cik</Button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function EditorCanvas({
  item,
  updateItem,
  updateOption,
}: {
  item: QuizItem;
  updateItem: (updates: Partial<QuizItem>) => void;
  updateOption: (optionId: string, updates: Partial<QuizOption>) => void;
}) {
  const visualQuestion = item.type === "hazard-count" || item.type === "image-analysis";
  const hasMediaArea = visualQuestion || item.type === "media-slide";

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {visualQuestion ? (
        <div className="flex h-full min-h-[760px] flex-col">
          <div className="mb-4 rounded-xl bg-gradient-to-r from-blue-100 via-blue-50 to-transparent p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              {item.type === "hazard-count" ? "Tehlike Sayma Sorusu" : "Gorsel Analiz Sorusu"}
            </p>
            <textarea
              value={item.question ?? ""}
              onChange={(event) => updateItem({ question: event.target.value })}
              placeholder={item.type === "hazard-count" ? "Gorselde kac tehlikeli durum var?" : "Bu gorselde hangi ISG ihlali bulunmaktadir?"}
              className="min-h-16 w-full resize-none border-0 bg-transparent p-0 text-xl font-semibold leading-snug text-slate-950 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className={`flex flex-1 gap-4 ${item.mediaLayout === "fullscreen" ? "flex-col" : "flex-row"}`}>
            <div className={`${item.mediaLayout === "fullscreen" ? "w-full" : item.mediaLayout === "large" ? "flex-[3]" : "flex-[2]"} min-w-0`}>
              <HazardMedia item={item} updateItem={updateItem} />
            </div>

            {item.options ? (
              <AnswerOptions item={item} updateOption={updateOption} updateItem={updateItem} compact={item.mediaLayout !== "fullscreen"} />
            ) : null}
          </div>
        </div>
      ) : (
        <>
          {hasMediaArea ? <StandardMedia item={item} updateItem={updateItem} /> : null}

          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Soru / Baslik</label>
            <textarea
              value={item.question ?? ""}
              onChange={(event) => updateItem({ question: event.target.value })}
              placeholder="Sorunuzu veya basliginizi yazin..."
              className="min-h-24 w-full resize-none rounded-xl border border-slate-200 bg-white p-4 text-lg text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {item.type === "info-slide" ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-600">Bilgi Slayti</p>
              <p className="mt-4 text-4xl font-bold leading-tight text-slate-950">{item.question || item.title}</p>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-500">Katilimcilara yarisma oncesi gosterilecek bilgilendirme alani.</p>
            </div>
          ) : null}

          {item.options ? <AnswerOptions item={item} updateOption={updateOption} updateItem={updateItem} /> : null}
        </>
      )}
    </div>
  );
}

function HazardMedia({ item, updateItem }: { item: QuizItem; updateItem: (updates: Partial<QuizItem>) => void }) {
  const layout = item.mediaLayout ?? "standard";
  const aspect = layout === "fullscreen" ? "aspect-video" : layout === "large" ? "aspect-[16/10]" : "aspect-[4/3]";

  return (
    <div className={`relative w-full overflow-hidden rounded-xl border-2 border-slate-200 bg-slate-100 shadow-lg ${aspect}`}>
      {item.media?.url ? (
        <>
          <img src={item.media.url} alt="Depo tehlike gorseli" className="h-full w-full object-cover" />
          {item.type === "hazard-count" ? <HazardMarkers /> : null}
          <MediaControlOverlay updateItem={updateItem} layout={layout} />
        </>
      ) : (
        <EmptyMediaState title="Gorsel Ekleyin" />
      )}
    </div>
  );
}

function HazardMarkers() {
  const markers = [
    { left: "15%", top: "70%", label: "Zemin sivisi" },
    { left: "40%", top: "65%", label: "Yerde kablo" },
    { left: "70%", top: "25%", label: "Yuksek istif" },
    { left: "55%", top: "45%", label: "Forklift gorus riski" },
  ];

  return (
    <div className="absolute inset-0">
      {markers.map((marker, index) => (
        <div key={marker.label} className="group absolute" style={{ left: marker.left, top: marker.top }}>
          <div className="flex h-8 w-8 animate-pulse items-center justify-center rounded-full bg-red-600/90 text-sm font-bold text-white shadow-lg ring-4 ring-red-500/30">
            {index + 1}
          </div>
          <div className="absolute left-10 top-0 hidden whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-xs text-white group-hover:block">
            {marker.label}
          </div>
        </div>
      ))}
      <div className="absolute bottom-3 right-3 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
        Tehlike isaretlerinin uzerine gelin
      </div>
    </div>
  );
}

function MediaControlOverlay({
  updateItem,
  layout,
}: {
  updateItem: (updates: Partial<QuizItem>) => void;
  layout: MediaLayout;
}) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
      <div className="flex flex-wrap items-center gap-2">
        {["Degistir", "Onizle", "Kaldir"].map((label) => (
          <Button key={label} size="sm" variant="outline" className="bg-white/90">
            {label}
          </Button>
        ))}
        <div className="ml-auto flex items-center gap-1 text-xs text-white/80">
          <span>Yerlesim:</span>
          {(["standard", "large", "fullscreen"] as MediaLayout[]).map((nextLayout) => (
            <button
              key={nextLayout}
              type="button"
              onClick={() => updateItem({ mediaLayout: nextLayout })}
              className={`rounded-md px-2 py-1 text-xs font-semibold ${
                layout === nextLayout ? "bg-white text-slate-950" : "text-white/80 hover:bg-white/20"
              }`}
            >
              {nextLayout === "standard" ? "Standart" : nextLayout === "large" ? "Buyuk" : "Tam Ekran"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyMediaState({ title }: { title: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-sm">
          <span className="text-4xl text-slate-400">▧</span>
        </div>
        <p className="mb-6 text-xl font-medium text-slate-500">{title}</p>
        <div className="flex flex-wrap justify-center gap-3">
          {["Gorsel Ekle", "Video Ekle", "YouTube Linki", "AI ile Olustur"].map((label) => (
            <Button key={label} variant="outline">
              {label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StandardMedia({ item, updateItem }: { item: QuizItem; updateItem: (updates: Partial<QuizItem>) => void }) {
  const layout = item.mediaLayout ?? "standard";
  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-500">Yerlesim:</span>
        {(["standard", "large", "fullscreen"] as MediaLayout[]).map((nextLayout) => (
          <Button
            key={nextLayout}
            size="sm"
            variant={layout === nextLayout ? "primary" : "outline"}
            onClick={() => updateItem({ mediaLayout: nextLayout })}
          >
            {nextLayout === "standard" ? "Standart" : nextLayout === "large" ? "Buyuk" : "Tam Ekran"}
          </Button>
        ))}
      </div>

      <div
        className={`relative overflow-hidden rounded-xl border-2 border-dashed bg-gradient-to-br from-slate-50 to-slate-100 ${
          layout === "fullscreen" ? "aspect-video min-h-[400px]" : layout === "large" ? "aspect-[16/10] min-h-[350px]" : "aspect-[16/9] min-h-[280px]"
        }`}
      >
        {item.media?.url && item.media.type === "image" ? (
          <>
            <img src={item.media.url} alt="Medya onizlemesi" className="h-full w-full object-cover" />
            <MediaControlOverlay updateItem={updateItem} layout={layout} />
          </>
        ) : item.media?.url ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-3xl text-blue-600">▶</div>
              <p className="text-xl font-semibold text-slate-950">{item.question}</p>
              <p className="mt-2 break-all text-sm text-slate-500">{item.media.url}</p>
            </div>
            <MediaControlOverlay updateItem={updateItem} layout={layout} />
          </div>
        ) : (
          <EmptyMediaState title="Gorsel veya Video Ekleyin" />
        )}
      </div>
    </div>
  );
}

function AnswerOptions({
  item,
  updateOption,
  updateItem,
  compact,
}: {
  item: QuizItem;
  updateOption: (optionId: string, updates: Partial<QuizOption>) => void;
  updateItem: (updates: Partial<QuizItem>) => void;
  compact?: boolean;
}) {
  if (!item.options) {
    return null;
  }

  const setCorrect = (optionId: string) => {
    updateItem({ options: item.options?.map((option) => ({ ...option, isCorrect: option.id === optionId })) });
  };

  return (
    <div className={`${compact ? "w-56 shrink-0" : "w-full"} space-y-3`}>
      <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Cevap Secenekleri</p>
      <div className={`grid gap-3 ${compact ? "grid-cols-1" : "sm:grid-cols-2"}`}>
        {item.options.map((option, index) => (
          <div
            key={option.id}
            className={`relative rounded-lg border-2 p-4 transition ${
              option.isCorrect ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold text-white ${answerColors[index] ?? "bg-slate-500"}`}>
                {String.fromCharCode(65 + index)}
              </span>
              <button
                type="button"
                onClick={() => setCorrect(option.id)}
                className={`rounded-md px-2 py-1 text-xs font-bold ${option.isCorrect ? "bg-emerald-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}
              >
                {option.isCorrect ? "Dogru" : "Dogru Yap"}
              </button>
            </div>
            <textarea
              value={option.text}
              onChange={(event) => updateOption(option.id, { text: event.target.value })}
              placeholder={`Secenek ${String.fromCharCode(65 + index)}`}
              rows={2}
              className="w-full resize-none border-0 bg-transparent p-0 text-base font-semibold text-slate-950 outline-none placeholder:text-slate-400"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function Inspector({ item, updateItem }: { item: QuizItem | undefined; updateItem: (updates: Partial<QuizItem>) => void }) {
  return (
    <aside className="w-80 shrink-0 border-l border-slate-200 bg-white">
      <div className="flex h-full flex-col overflow-hidden">
        <div className="shrink-0 border-b border-slate-200 p-4">
          <h3 className="font-semibold text-slate-950">Oge Ayarlari</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {item ? (
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Soru Tipi</span>
                <select
                  value={item.type}
                  onChange={(event) => updateItem({ type: event.target.value as QuizItemType })}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                >
                  {itemTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Sure Limiti</span>
                <select
                  value={String(item.timeLimit)}
                  onChange={(event) => updateItem({ timeLimit: Number(event.target.value) })}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                >
                  {[10, 15, 20, 30, 45, 60, 90, 120].map((time) => (
                    <option key={time} value={time}>
                      {time} saniye
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Puan</span>
                <select
                  value={String(item.points)}
                  onChange={(event) => updateItem({ points: Number(event.target.value) })}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                >
                  {[0, 50, 75, 100, 125, 150, 200].map((point) => (
                    <option key={point} value={point}>
                      {point} puan
                    </option>
                  ))}
                </select>
              </label>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="mb-4 font-semibold text-slate-950">Canli Kontroller</h4>
                <div className="space-y-2">
                  {["Soruyu Baslat", "Sonraki Oge", "Cevaplari Kilitle", "Dogru Cevabi Goster", "Lider Tablosu", "Final Sonuclari"].map((label) => (
                    <Button key={label} variant="outline" className="w-full justify-start">
                      {label}
                    </Button>
                  ))}
                  <Button variant="danger" className="w-full justify-start">
                    Oturumu Sifirla
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

function SettingsPanel({
  competitionName,
  customerName,
  setCustomerName,
}: {
  competitionName: string;
  customerName: string;
  setCustomerName: (value: string) => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl p-6">
        <h2 className="mb-6 text-lg font-semibold text-slate-950">Yarisma Ayarlari</h2>
        <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Yarisma Adi</span>
            <input defaultValue={competitionName} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Musteri Adi</span>
            <input
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
            />
            <p className="mt-2 text-xs text-slate-500">Bu ad projeksiyon ekraninda sag ustte ve watermark olarak gorunur.</p>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Musteri Logosu URL</span>
            <input placeholder="https://example.com/logo.png" className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" />
          </label>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="mb-2 font-medium text-slate-950">Watermark Onizleme</h3>
            <div className="relative aspect-video overflow-hidden rounded-lg bg-blue-700">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="select-none text-[8vw] font-bold leading-none text-white/10">{customerName}</span>
              </div>
              <div className="absolute left-4 top-4 flex items-center gap-2 text-white/80">
                <span className="font-black">S</span>
                <span className="text-sm font-semibold">Safety Area</span>
              </div>
              <div className="absolute right-4 top-4 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white">{customerName}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThemePanel({
  themes: themeOptions,
  selectedTheme,
  setSelectedTheme,
  customerName,
}: {
  themes: Theme[];
  selectedTheme: Theme;
  setSelectedTheme: (theme: Theme) => void;
  customerName: string;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h2 className="mb-2 text-lg font-semibold text-slate-950">Tema Secimi</h2>
      <p className="mb-6 text-sm text-slate-500">Tema secilince admin-v0 onizlemesinde arka plan, watermark ve vurgu renkleri degisir.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {themeOptions.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => setSelectedTheme(theme)}
            className={`cursor-pointer overflow-hidden rounded-xl border-2 bg-white text-left transition hover:shadow-lg ${
              selectedTheme.id === theme.id ? "border-blue-600 shadow-md ring-4 ring-blue-600/20" : "border-transparent hover:border-slate-200"
            }`}
          >
            <div className="relative aspect-video" style={{ background: theme.preview }}>
              <div className="absolute inset-2 flex flex-col items-center justify-center rounded-lg bg-black/20 backdrop-blur-[1px]">
                <span className="text-[8px] font-bold text-white/80">WATERMARK</span>
                <span className="mt-1 text-[10px] font-semibold text-white/70">{customerName}</span>
              </div>
              {selectedTheme.id === theme.id ? (
                <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">✓</div>
              ) : null}
            </div>
            <div className="p-3">
              <p className="font-medium text-slate-950">{theme.name}</p>
              <div className="mt-2 flex gap-1">
                {[theme.primaryColor, theme.secondaryColor, theme.accentColor, theme.backgroundColor].map((color) => (
                  <span key={color} className="h-5 w-5 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function QuestionLibrary() {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h2 className="mb-4 text-lg font-semibold text-slate-950">Soru Kutuphanesi</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {quizItemsSeed
          .filter((item) => item.options)
          .map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{itemTypeName(item.type)}</span>
                <span className="text-xs font-semibold text-slate-400">{item.points} puan</span>
              </div>
              <p className="font-semibold leading-snug text-slate-950">{item.question}</p>
            </article>
          ))}
      </div>
    </div>
  );
}

function LobbyScreen({
  competitionName,
  customerName,
  onStart,
  onBack,
}: {
  competitionName: string;
  customerName: string;
  onStart: () => void;
  onBack: () => void;
}) {
  const { state } = useGameState();
  const [showPin, setShowPin] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);

  if (!showPin) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 text-white">
        <Watermark text={customerName} />
        <ProjectionBrand customerName={customerName} />
        <div className="relative z-10 text-center">
          <div className="mb-8 inline-flex items-center justify-center rounded-3xl bg-white/10 p-8 backdrop-blur-sm">
            <span className="text-8xl font-black">S</span>
          </div>
          <h1 className="mb-4 text-7xl font-bold tracking-tight md:text-9xl">Safety Area</h1>
          <p className="mb-2 text-2xl text-white/80 md:text-3xl">Kurumsal ISG Egitim Platformu</p>
          <p className="mb-16 text-xl text-white/60">{competitionName}</p>
          <Button variant="outline" className="h-16 border-white/20 bg-white px-10 text-xl text-blue-700 hover:bg-white/95" onClick={() => setShowPin(true)}>
            ▶ Yarismayi Baslat
          </Button>
        </div>
        <Button variant="ghost" className="absolute bottom-8 left-8 text-white hover:bg-white/10 hover:text-white" onClick={onBack}>
          ← Editore Don
        </Button>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 text-white">
      <Watermark text={customerName} />
      <ProjectionHeader customerName={customerName} />
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-8">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xl text-white/70">Yarismaya katilmak icin:</p>
          <p className="text-3xl font-bold md:text-4xl">safetyarea.app/join</p>
        </div>
        <div className="mb-10 rounded-3xl bg-white/10 px-12 py-10 backdrop-blur-sm">
          <p className="mb-3 text-center text-lg font-semibold uppercase tracking-widest text-white/70">Oyun PIN Kodu</p>
          <p className="text-center font-mono text-8xl font-bold tracking-[0.2em] md:text-[10rem]">{state.settings.gamePin}</p>
        </div>
        <div className="mb-10 flex items-center gap-8">
          <div className="grid h-40 w-40 grid-cols-5 gap-1 rounded-2xl bg-white p-5 shadow-2xl">
            {Array.from({ length: 25 }).map((_, index) => (
              <span key={index} className={`rounded-sm ${index % 3 === 0 || index % 7 === 0 ? "bg-blue-700" : "bg-blue-100"}`} />
            ))}
          </div>
          <div className="text-center text-white/80">
            <p className="text-lg font-medium">veya</p>
            <p className="text-lg">QR kodu tarayin</p>
          </div>
        </div>
        <div className="w-full max-w-3xl rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">👥</span>
              <span className="text-xl font-semibold">{state.teams.length} Katilimci</span>
            </div>
            <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={() => setMusicPlaying(!musicPlaying)}>
              {musicPlaying ? "Sessiz" : "Lobi Muzigi"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {state.teams.length ? (
              state.teams.map((team) => (
                <span key={team.id} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-blue-700">
                  {team.name}
                </span>
              ))
            ) : (
              <p className="w-full py-4 text-center text-white/60">Katilimcilar bekleniyor...</p>
            )}
          </div>
        </div>
        <Button variant="outline" className="mt-8 h-14 border-white/20 bg-white px-8 text-lg text-blue-700 hover:bg-white/95" onClick={onStart}>
          Yarismayi Baslat →
        </Button>
      </main>
    </div>
  );
}

function ProjectionScreen({ customerName, onEnd }: { customerName: string; onEnd: () => void }) {
  const [step, setStep] = useState<ProjectionStep>("question");
  const [timeLeft, setTimeLeft] = useState(30);
  const selectedAnswers = { A: 12, B: 45, C: 8, D: 15 };
  const question = {
    text: "Forklift operatoru hangi kisisel koruyucu donanimi mutlaka kullanmalidir?",
    options: [
      { id: "A", text: "Baret", color: "bg-red-500" },
      { id: "B", text: "Emniyet kemeri", color: "bg-blue-500" },
      { id: "C", text: "Gozluk", color: "bg-amber-500" },
      { id: "D", text: "Eldiven", color: "bg-emerald-500" },
    ],
    correctAnswer: "B",
  };
  const totalAnswers = Object.values(selectedAnswers).reduce((sum, value) => sum + value, 0);

  useEffect(() => {
    if (step !== "question" && step !== "media-question") {
      return;
    }
    const interval = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          setStep("answers");
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [step]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 text-white">
      <Watermark text={customerName} />
      <ProjectionHeader customerName={customerName} />
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-8">
        {step === "question" ? (
          <div className="w-full max-w-6xl">
            <Timer timeLeft={timeLeft} />
            <div className="mb-10 rounded-3xl bg-white/10 p-10 backdrop-blur-sm">
              <p className="text-center text-4xl font-semibold leading-relaxed md:text-5xl">{question.text}</p>
            </div>
            <ProjectionOptions options={question.options} />
            <p className="mt-10 text-center text-xl text-white/70">👥 80 katilimci cevap verdi</p>
          </div>
        ) : null}

        {step === "media-question" ? (
          <div className="w-full max-w-6xl">
            <div className="absolute right-8 top-24 z-20">
              <Timer timeLeft={timeLeft} small />
            </div>
            <div className="mb-6 rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
              <p className="text-center text-3xl font-semibold md:text-4xl">Gorselde kac tehlikeli durum var?</p>
            </div>
            <div className="mb-6 overflow-hidden rounded-3xl bg-slate-100 shadow-2xl">
              <div className="relative aspect-video">
                <img src={warehouseImageUrl} alt="Depo tehlike gorseli" className="h-full w-full object-cover" />
                <HazardMarkers />
              </div>
            </div>
            <ProjectionOptions
              compact
              options={[
                { id: "A", text: "3", color: "bg-red-500" },
                { id: "B", text: "5", color: "bg-blue-500" },
                { id: "C", text: "7", color: "bg-amber-500" },
                { id: "D", text: "4", color: "bg-emerald-500" },
              ]}
            />
          </div>
        ) : null}

        {step === "answers" ? (
          <div className="w-full max-w-5xl">
            <h2 className="mb-10 text-center text-4xl font-bold">Cevap Dagilimi</h2>
            <div className="space-y-4">
              {question.options.map((option) => {
                const count = selectedAnswers[option.id as keyof typeof selectedAnswers] ?? 0;
                const percentage = Math.round((count / totalAnswers) * 100);
                return (
                  <div key={option.id} className={`overflow-hidden rounded-2xl ${option.color} shadow-lg`}>
                    <div className="flex items-center gap-6 p-5">
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/20 text-2xl font-bold">{option.id}</span>
                      <span className="flex-1 text-2xl font-semibold">{option.text}</span>
                      <span className="text-3xl font-bold">{percentage}%</span>
                      <span className="text-lg text-white/70">({count})</span>
                    </div>
                    <div className="h-2 bg-black/20">
                      <div className="h-full bg-white/40" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {step === "correct" ? (
          <div className="w-full max-w-4xl text-center">
            <div className="mb-6 inline-flex h-32 w-32 items-center justify-center rounded-full bg-emerald-500 text-7xl shadow-2xl">✓</div>
            <h2 className="mb-10 text-5xl font-bold">Dogru Cevap!</h2>
            <div className="rounded-3xl bg-emerald-500 p-10 shadow-2xl">
              <span className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 text-4xl font-bold">{question.correctAnswer}</span>
              <p className="text-4xl font-bold">Emniyet kemeri</p>
            </div>
          </div>
        ) : null}

        {step === "leaderboard" ? <ProjectionLeaderboard /> : null}
        {step === "final" ? <FinalScreen onEnd={onEnd} /> : null}
      </main>

      <div className="absolute bottom-6 right-6 z-20 flex flex-wrap gap-2">
        {(["question", "media-question", "answers", "correct", "leaderboard", "final"] as ProjectionStep[]).map((nextStep) => (
          <Button
            key={nextStep}
            size="sm"
            variant={step === nextStep ? "outline" : "ghost"}
            className={step === nextStep ? "bg-white text-blue-700" : "text-white hover:bg-white/10 hover:text-white"}
            onClick={() => {
              setStep(nextStep);
              if (nextStep === "question" || nextStep === "media-question") {
                setTimeLeft(30);
              }
            }}
          >
            {nextStep === "media-question" ? "medya" : nextStep}
          </Button>
        ))}
      </div>
    </div>
  );
}

function ProjectionHeader({ customerName }: { customerName: string }) {
  return (
    <header className="relative z-10 flex items-center justify-between p-6 md:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-2xl font-black backdrop-blur-sm">S</div>
        <div>
          <span className="text-xl font-bold">Safety Area</span>
          <p className="text-xs text-white/60">Kurumsal ISG Platformu</p>
        </div>
      </div>
      <span className="rounded-full bg-white px-4 py-2 text-base font-bold text-blue-700">{customerName}</span>
    </header>
  );
}

function ProjectionBrand({ customerName }: { customerName: string }) {
  return (
    <>
      <div className="absolute left-8 top-8 z-20 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-2xl font-black backdrop-blur-sm">S</div>
        <div>
          <span className="text-xl font-bold">Safety Area</span>
          <p className="text-xs text-white/60">Kurumsal ISG Platformu</p>
        </div>
      </div>
      <div className="absolute right-8 top-8 z-20 rounded-full bg-white px-4 py-2 text-base font-bold text-blue-700">{customerName}</div>
    </>
  );
}

function Watermark({ text }: { text: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      <span className="select-none whitespace-nowrap text-[20vw] font-bold leading-none text-white/[0.04]">{text}</span>
    </div>
  );
}

function Timer({ timeLeft, small }: { timeLeft: number; small?: boolean }) {
  return (
    <div className={`mb-10 flex items-center justify-center ${small ? "mb-0" : ""}`}>
      <div className={`${small ? "h-20 w-20" : "h-28 w-28"} flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm`}>
        <span className={`${small ? "text-4xl" : "text-6xl"} font-bold ${timeLeft <= 5 ? "text-red-300" : "text-white"}`}>{timeLeft}</span>
      </div>
    </div>
  );
}

function ProjectionOptions({ options, compact }: { options: { id: string; text: string; color: string }[]; compact?: boolean }) {
  return (
    <div className={`grid gap-4 ${compact ? "grid-cols-4" : "md:grid-cols-2"}`}>
      {options.map((option) => (
        <div key={option.id} className={`flex items-center gap-6 rounded-2xl ${option.color} p-6 shadow-lg`}>
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white/20 text-3xl font-bold">{option.id}</span>
          <span className="text-3xl font-semibold">{option.text}</span>
        </div>
      ))}
    </div>
  );
}

function ProjectionLeaderboard() {
  return (
    <div className="w-full max-w-3xl">
      <div className="mb-10 flex items-center justify-center gap-4">
        <span className="text-5xl">🏆</span>
        <h2 className="text-5xl font-bold">Lider Tablosu</h2>
      </div>
      <div className="space-y-3">
        {leaderboard.slice(0, 10).map((participant, index) => (
          <div key={participant.name} className={`flex items-center gap-4 rounded-2xl p-5 ${index < 3 ? "bg-white text-blue-700 shadow-xl" : "bg-white/10 text-white backdrop-blur-sm"}`}>
            <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-bold ${index === 0 ? "bg-amber-400 text-white" : index === 1 ? "bg-slate-300 text-slate-700" : index === 2 ? "bg-amber-700 text-white" : "bg-white/15"}`}>
              {index + 1}
            </span>
            <span className="flex-1 text-xl font-semibold">{participant.name}</span>
            {participant.streak > 2 ? <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-700">★ {participant.streak}x</span> : null}
            <span className="text-2xl font-bold">{participant.score.toLocaleString("tr-TR")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FinalScreen({ onEnd }: { onEnd: () => void }) {
  return (
    <div className="w-full max-w-4xl text-center">
      <div className="mb-8 inline-flex h-40 w-40 items-center justify-center rounded-full bg-amber-400 text-8xl shadow-2xl">🏆</div>
      <h2 className="text-6xl font-bold">Yarisma Sona Erdi!</h2>
      <p className="mt-4 text-2xl text-white/70">Tebrikler! Iste final sonuclari:</p>
      <div className="my-14 flex items-end justify-center gap-6">
        <Podium place={2} name={leaderboard[1].name} score={leaderboard[1].score} height="h-28" tone="bg-slate-300/60" />
        <Podium place={1} name={leaderboard[0].name} score={leaderboard[0].score} height="h-40" tone="bg-amber-400/60" />
        <Podium place={3} name={leaderboard[2].name} score={leaderboard[2].score} height="h-24" tone="bg-amber-700/50" />
      </div>
      <div className="flex justify-center gap-6">
        <Button variant="outline" className="h-16 bg-white px-8 text-xl text-blue-700">
          Tekrar Oyna
        </Button>
        <Button variant="ghost" className="h-16 border border-white/30 px-8 text-xl text-white hover:bg-white/10 hover:text-white" onClick={onEnd}>
          Yarismayi Bitir
        </Button>
      </div>
    </div>
  );
}

function Podium({ place, name, score, height, tone }: { place: number; name: string; score: number; height: string; tone: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-white/20 text-4xl font-bold shadow-lg">{place}</div>
      <div className={`flex w-40 flex-col items-center justify-center rounded-t-2xl ${height} ${tone}`}>
        <p className="text-lg font-semibold">{name}</p>
        <p className="text-2xl font-bold">{score.toLocaleString("tr-TR")}</p>
      </div>
    </div>
  );
}
