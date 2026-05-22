export type AnswerId = "A" | "B" | "C" | "D";

export type AnswerOption = {
  id: AnswerId;
  text: string;
};

type BaseFlowItem = {
  id: string;
  title: string;
  category?: string;
};

export type QuizFlowItem = BaseFlowItem & {
  type: "quiz";
  quizNumber: number;
  topic: string;
  stage: string;
  imageUrl?: string;
  timeLimitSeconds: number;
  maxScore: number;
  options: AnswerOption[];
  correctOptionId: AnswerId;
  explanation?: string;
};

export type InfoSlideFlowItem = BaseFlowItem & {
  type: "infoSlide";
  description: string;
  imageUrl?: string;
  timeLimitSeconds?: number;
};

export type MediaSlideFlowItem = BaseFlowItem & {
  type: "mediaSlide";
  mediaType: "image" | "youtube";
  mediaUrl: string;
  description: string;
  timeLimitSeconds?: number;
  uploadedImageDataUrl?: string;
};

export type ForkliftChallengeFlowItem = BaseFlowItem & {
  type: "forkliftChallenge";
  description: string;
  timeLimitSeconds: number;
  maxScore: number;
  message: string;
};

export type ContentFlowItem =
  | QuizFlowItem
  | InfoSlideFlowItem
  | MediaSlideFlowItem
  | ForkliftChallengeFlowItem;

export type GamePhase =
  | "lobby"
  | "quizIntro"
  | "quiz"
  | "infoSlide"
  | "mediaSlide"
  | "leaderboard"
  | "forkliftChallenge"
  | "finished";

export type GameSettings = {
  welcomeTitle: string;
  subtitle: string;
  maxTeams: number;
  gamePin: string;
  prizeFirst: number;
  prizeSecond: number;
  prizeThird: number;
  teamSize: number;
  currency: string;
  productBrandName: string;
  customerName: string;
  customerLogoText?: string;
  customerLogoUrl?: string;
  watermarkText: string;
  themeId: string;
};

export type Team = {
  id: string;
  name: string;
  joinedAt: number;
};

export type QuizAnswer = {
  itemId: string;
  optionId: AnswerId;
  isCorrect: boolean;
  score: number;
  answerTimeMs: number;
  submittedAt: number;
};

export type ForkliftPenaltyKey = "pedestrian" | "collision" | "speeding" | "horn";

export type ForkliftPenalties = Record<ForkliftPenaltyKey, number>;

export type ForkliftRun = {
  itemId: string;
  score: number;
  safetyScore: number;
  timeBonus: number;
  durationMs: number;
  completed: boolean;
  penalties: ForkliftPenalties;
  submittedAt: number;
};

export type TeamResponses = {
  answers: Record<string, QuizAnswer>;
  forkliftRuns: Record<string, ForkliftRun>;
};

export type GameState = {
  version: 2;
  settings: GameSettings;
  flowItems: ContentFlowItem[];
  phase: GamePhase;
  activeItemIndex: number;
  activeItemStartedAt: number | null;
  answersLocked: boolean;
  showCorrectAnswer: boolean;
  teams: Team[];
  responses: Record<string, TeamResponses>;
};

export type LeaderboardEntry = {
  id: string;
  name: string;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  missedQuestions: number;
  forkliftScore: number;
  joinedAt: number;
};

export type QuizAnswerRowStatus = "correct" | "wrong" | "pending" | "unanswered";

export type QuizAnswerBreakdownRow = {
  teamId: string;
  teamName: string;
  selectedOptionId: AnswerId | null;
  status: QuizAnswerRowStatus;
  questionScore: number;
  totalScore: number;
  joinedAt: number;
};

export type QuizAnswerBreakdown = {
  totalTeams: number;
  answeredTeams: number;
  unansweredTeams: number;
  correctAnswers: number;
  wrongAnswers: number;
  optionCounts: Record<AnswerId, number>;
  totalAnswers: number;
  rows: QuizAnswerBreakdownRow[];
};

export const leaderboardRevealQuizNumbers = [3, 6, 8] as const;
export const answerIds: AnswerId[] = ["A", "B", "C", "D"];
export const QUIZ_INTRO_SECONDS = 5;

export const DEFAULT_SETTINGS: GameSettings = {
  welcomeTitle: "Hoş geldiniz Beyzer Depo İSG Bilgi Yarışması",
  subtitle: "Bil, Fark Et, Güvenli Karar Ver",
  maxTeams: 50,
  gamePin: "2606",
  prizeFirst: 30000,
  prizeSecond: 24000,
  prizeThird: 18000,
  teamSize: 3,
  currency: "TL",
  productBrandName: "Safety Area",
  customerName: "LC Waikiki",
  customerLogoText: "",
  customerLogoUrl: "",
  watermarkText: "LC Waikiki",
  themeId: "corporate-blue",
};

export const DEFAULT_FLOW: ContentFlowItem[] = [
  {
    id: "q1",
    type: "quiz",
    quizNumber: 1,
    title: "Depo girişinde forklift trafiği yoğunken ilk güvenli davranış hangisidir?",
    topic: "Depo Güvenliği",
    stage: "Isınma Turu",
    timeLimitSeconds: 30,
    maxScore: 1000,
    options: [
      { id: "A", text: "Yaya yolunu kullanıp operatörle göz teması kurmak" },
      { id: "B", text: "Kısa yol olduğu için yükleme alanından geçmek" },
      { id: "C", text: "Forklift arkasından hızlıca geçmek" },
      { id: "D", text: "Telefonla konuşarak yürümeye devam etmek" },
    ],
    correctOptionId: "A",
  },
  {
    id: "q2",
    type: "quiz",
    quizNumber: 2,
    title: "KKD kullanımında en doğru yaklaşım aşağıdakilerden hangisidir?",
    topic: "KKD",
    stage: "Saha Farkındalığı",
    timeLimitSeconds: 30,
    maxScore: 1000,
    options: [
      { id: "A", text: "Sadece denetim günlerinde takmak" },
      { id: "B", text: "Riske göre belirlenmiş KKD'yi doğru ve sürekli kullanmak" },
      { id: "C", text: "Arkadaşın KKD'si uygunsa paylaşmak" },
      { id: "D", text: "Konfor için gevşek kullanmak" },
    ],
    correctOptionId: "B",
  },
  {
    id: "q3",
    type: "quiz",
    quizNumber: 3,
    title: "Ramak kala bildiriminin en önemli faydası nedir?",
    topic: "Ramak Kala",
    stage: "İlk Tabela Öncesi",
    timeLimitSeconds: 30,
    maxScore: 1000,
    options: [
      { id: "A", text: "Sadece olay sayısını artırmak" },
      { id: "B", text: "Kaza olmadan önce tehlikeyi görünür kılmak" },
      { id: "C", text: "Sorumlu aramayı hızlandırmak" },
      { id: "D", text: "Vardiya raporunu kısaltmak" },
    ],
    correctOptionId: "B",
  },
  {
    id: "info-crossing",
    type: "infoSlide",
    title: "Forklift ve Yaya Ayrımı",
    description:
      "Yaya yolu, forklift rotası ve yükleme alanı birbirinden net ayrıldığında karar verme hızı artar. Kesişimlerde dur çizgisi, göz teması, korna ve hız kontrolü birlikte düşünülmelidir.",
  },
  {
    id: "q4",
    type: "quiz",
    quizNumber: 4,
    title: "Forklift ve yaya yolunun kesiştiği noktada hangi kontrol önceliklidir?",
    topic: "Forklift-Yaya Yolu",
    stage: "Kritik Geçiş",
    timeLimitSeconds: 35,
    maxScore: 1000,
    options: [
      { id: "A", text: "Görüşü azaltan malzemeleri kesişime yaklaştırmak" },
      { id: "B", text: "Uyarı, bariyer, dur çizgisi ve hız kontrolünü birlikte kullanmak" },
      { id: "C", text: "Yayaların daha hızlı geçmesini istemek" },
      { id: "D", text: "Sadece korna kullanımına güvenmek" },
    ],
    correctOptionId: "B",
  },
  {
    id: "q5",
    type: "quiz",
    quizNumber: 5,
    title: "Yük taşıyan forklift rampaya yaklaşırken en güvenli karar nedir?",
    topic: "Yük Dengeleme",
    stage: "Yük Kontrolü",
    timeLimitSeconds: 35,
    maxScore: 1000,
    options: [
      { id: "A", text: "Yükü dengede tutup düşük hızla ve görüşü kontrol ederek ilerlemek" },
      { id: "B", text: "Rampaya hızlanarak çıkmak" },
      { id: "C", text: "Yük yukarıdayken ani dönüş yapmak" },
      { id: "D", text: "Uyarı alanlarını dikkate almadan geçmek" },
    ],
    correctOptionId: "A",
  },
  {
    id: "q6",
    type: "quiz",
    quizNumber: 6,
    title: "Tahliye alarmı duyulduğunda en doğru aksiyon hangisidir?",
    topic: "Acil Durum ve Tahliye",
    stage: "İkinci Tabela Öncesi",
    timeLimitSeconds: 30,
    maxScore: 1000,
    options: [
      { id: "A", text: "Kişisel eşyaları toplamak için beklemek" },
      { id: "B", text: "Asansörü kullanarak hızlı çıkmak" },
      { id: "C", text: "En yakın güvenli çıkıştan toplanma alanına gitmek" },
      { id: "D", text: "Alarmın gerçek olup olmadığını araştırmak" },
    ],
    correctOptionId: "C",
  },
  {
    id: "media-forklift",
    type: "mediaSlide",
    title: "Güvenli Sürüş Kısa Ara",
    mediaType: "youtube",
    mediaUrl: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
    description: "Ekranda güvenli sürüş davranışlarını izleyin; hız, görüş ve yaya ayrımına odaklanın.",
  },
  {
    id: "q7",
    type: "quiz",
    quizNumber: 7,
    title: "Risk önceliklendirmede ilk bakılması gereken kombinasyon hangisidir?",
    topic: "Risk Önceliklendirme",
    stage: "Karar Anı",
    timeLimitSeconds: 35,
    maxScore: 1000,
    options: [
      { id: "A", text: "Renk ve form tasarımı" },
      { id: "B", text: "Olasılık, şiddet ve maruziyet" },
      { id: "C", text: "Vardiya başlangıç saati" },
      { id: "D", text: "Ekipteki kişi sayısı" },
    ],
    correctOptionId: "B",
  },
  {
    id: "q8",
    type: "quiz",
    quizNumber: 8,
    title: "Kontrol hiyerarşisinde en etkili yöntem hangisidir?",
    topic: "Kontrol Hiyerarşisi",
    stage: "Üçüncü Tabela Öncesi",
    timeLimitSeconds: 35,
    maxScore: 1000,
    options: [
      { id: "A", text: "Tehlikeyi tamamen ortadan kaldırmak" },
      { id: "B", text: "Sadece talimat panosu asmak" },
      { id: "C", text: "En son KKD vermekle yetinmek" },
      { id: "D", text: "Uyarı e-postası göndermek" },
    ],
    correctOptionId: "A",
  },
  {
    id: "q9",
    type: "quiz",
    quizNumber: 9,
    title: "Depoda dökülme fark edildiğinde doğru ilk müdahale nedir?",
    topic: "Depo Güvenliği",
    stage: "Finale Gidiş",
    timeLimitSeconds: 30,
    maxScore: 1000,
    options: [
      { id: "A", text: "Alanı işaretleyip yetkili ekibe haber vermek" },
      { id: "B", text: "Kimyasalı çıplak elle temizlemek" },
      { id: "C", text: "Üzerinden atlayarak geçmek" },
      { id: "D", text: "Kimse görmeden alanı terk etmek" },
    ],
    correctOptionId: "A",
  },
  {
    id: "q10",
    type: "quiz",
    quizNumber: 10,
    title: "Güvenli karar kültürünün en güçlü göstergesi hangisidir?",
    topic: "İSG Kültürü",
    stage: "Final Sorusu",
    timeLimitSeconds: 40,
    maxScore: 1000,
    options: [
      { id: "A", text: "Risk görüp işi durdurabilmek ve doğru kişiye bildirmek" },
      { id: "B", text: "Hedef yetişsin diye prosedürü esnetmek" },
      { id: "C", text: "Sadece yönetici varken kurallara uymak" },
      { id: "D", text: "Tehlikeyi deneyimli kişilerin çözmesini beklemek" },
    ],
    correctOptionId: "A",
  },
  {
    id: "forklift-final",
    type: "forkliftChallenge",
    title: "Forklift Güvenli Sürüş Etabı",
    description:
      "Finalde takımlar yükü güvenli alana taşır. Yaya yolu, kör nokta, hız limiti ve çarpışma kararları skoru belirler.",
    timeLimitSeconds: 60,
    maxScore: 1000,
    message: "Hızlı olan değil, güvenli süren kazanır.",
  },
];

export function cloneFlowItem<T extends ContentFlowItem>(item: T): T {
  if (item.type === "quiz") {
    return {
      ...item,
      options: item.options.map((option) => ({ ...option })),
    };
  }

  return { ...item };
}

export function createInitialFlowItems() {
  return DEFAULT_FLOW.map(cloneFlowItem);
}

export function createFlowItemId(type: ContentFlowItem["type"]) {
  const prefixByType: Record<ContentFlowItem["type"], string> = {
    quiz: "quiz",
    infoSlide: "info",
    mediaSlide: "media",
    forkliftChallenge: "forklift",
  };

  return `${prefixByType[type]}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function generatePin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function createInitialGameState(settings: Partial<GameSettings> = {}): GameState {
  return {
    version: 2,
    settings: {
      ...DEFAULT_SETTINGS,
      ...settings,
      gamePin: settings.gamePin ?? generatePin(),
    },
    flowItems: createInitialFlowItems(),
    phase: "lobby",
    activeItemIndex: 0,
    activeItemStartedAt: null,
    answersLocked: false,
    showCorrectAnswer: false,
    teams: [],
    responses: {},
  };
}

export function getFlowItems(state: Pick<GameState, "flowItems">) {
  return Array.isArray(state.flowItems) ? state.flowItems : DEFAULT_FLOW;
}

export function getActiveItem(state: GameState) {
  const flowItems = getFlowItems(state);
  return flowItems[state.activeItemIndex] ?? flowItems[0] ?? DEFAULT_FLOW[0];
}

export function getQuizItems(state: Pick<GameState, "flowItems">) {
  return getFlowItems(state).filter((item): item is QuizFlowItem => item.type === "quiz");
}

export function getQuizPosition(state: Pick<GameState, "flowItems">, item: ContentFlowItem) {
  if (item.type !== "quiz") {
    return null;
  }

  const quizItems = getQuizItems(state);
  const quizIndex = quizItems.findIndex((quizItem) => quizItem.id === item.id);

  return {
    current: quizIndex >= 0 ? quizIndex + 1 : item.quizNumber,
    total: quizItems.length,
  };
}

export function getQuestionLabel(item: ContentFlowItem, state?: Pick<GameState, "flowItems">) {
  if (item.type === "quiz") {
    const position = state ? getQuizPosition(state, item) : null;
    return `Soru ${position?.current ?? item.quizNumber}`;
  }

  if (item.type === "infoSlide") {
    return "Bilgi";
  }

  if (item.type === "mediaSlide") {
    return "Medya";
  }

  return "Final";
}

export function getItemCategory(item: ContentFlowItem) {
  if (item.type === "quiz") {
    return item.topic;
  }

  return item.category ?? "";
}

export function getItemDurationSeconds(item: ContentFlowItem) {
  return "timeLimitSeconds" in item && typeof item.timeLimitSeconds === "number" ? item.timeLimitSeconds : null;
}

export function inferMediaType(url: string): MediaSlideFlowItem["mediaType"] {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.includes("youtube.com") || parsedUrl.hostname.includes("youtu.be") ? "youtube" : "image";
  } catch {
    return url.includes("youtube.com") || url.includes("youtu.be") ? "youtube" : "image";
  }
}

export function getItemPhase(item: ContentFlowItem): GamePhase {
  return item.type;
}

export function getItemStartPhase(item: ContentFlowItem): GamePhase {
  return item.type === "quiz" ? "quizIntro" : getItemPhase(item);
}

export function shouldRevealLeaderboardAfter(state: Pick<GameState, "flowItems">, item: ContentFlowItem) {
  const position = getQuizPosition(state, item);
  return Boolean(position && leaderboardRevealQuizNumbers.includes(position.current as 3 | 6 | 8));
}

export function getTeamResponses(state: GameState, teamId: string): TeamResponses {
  return state.responses[teamId] ?? { answers: {}, forkliftRuns: {} };
}

export function pruneResponsesForFlowItems(
  responses: Record<string, TeamResponses>,
  flowItems: ContentFlowItem[],
): Record<string, TeamResponses> {
  const quizIds = new Set(flowItems.filter((item) => item.type === "quiz").map((item) => item.id));
  const forkliftIds = new Set(flowItems.filter((item) => item.type === "forkliftChallenge").map((item) => item.id));

  return Object.fromEntries(
    Object.entries(responses).map(([teamId, teamResponses]) => {
      const safeResponses =
        teamResponses && typeof teamResponses === "object" ? teamResponses : { answers: {}, forkliftRuns: {} };

      return [
        teamId,
        {
          answers: Object.fromEntries(Object.entries(safeResponses.answers ?? {}).filter(([itemId]) => quizIds.has(itemId))),
          forkliftRuns: Object.fromEntries(
            Object.entries(safeResponses.forkliftRuns ?? {}).filter(([itemId]) => forkliftIds.has(itemId)),
          ),
        },
      ];
    }),
  );
}

export function calculateRemainingSeconds(state: GameState, item: ContentFlowItem, now = Date.now()) {
  if (state.phase === "quizIntro" && item.type === "quiz") {
    return null;
  }

  if (!("timeLimitSeconds" in item) || typeof item.timeLimitSeconds !== "number" || !state.activeItemStartedAt) {
    return null;
  }

  const elapsedSeconds = Math.floor((now - state.activeItemStartedAt) / 1000);
  return Math.max(0, item.timeLimitSeconds - elapsedSeconds);
}

export function calculateQuizIntroRemainingSeconds(state: GameState, item: ContentFlowItem, now = Date.now()) {
  if (state.phase !== "quizIntro" || item.type !== "quiz" || !state.activeItemStartedAt) {
    return null;
  }

  const remainingMs = QUIZ_INTRO_SECONDS * 1000 - (now - state.activeItemStartedAt);
  return Math.min(QUIZ_INTRO_SECONDS, Math.max(1, Math.ceil(remainingMs / 1000)));
}

export function getAnsweredCount(state: GameState, item = getActiveItem(state)) {
  if (item.type === "quiz") {
    return state.teams.filter((team) => Boolean(getTeamResponses(state, team.id).answers[item.id])).length;
  }

  if (item.type === "forkliftChallenge") {
    return state.teams.filter((team) => Boolean(getTeamResponses(state, team.id).forkliftRuns[item.id])).length;
  }

  return 0;
}

export function getQuizAnswerDistribution(state: GameState, item: QuizFlowItem) {
  const counts: Record<AnswerId, number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
  };

  state.teams.forEach((team) => {
    const answer = getTeamResponses(state, team.id).answers[item.id];

    if (answer) {
      counts[answer.optionId] += 1;
    }
  });

  return {
    counts,
    totalAnswers: Object.values(counts).reduce((sum, count) => sum + count, 0),
  };
}

export function getTeamTotalScore(state: GameState, teamId: string) {
  const responses = getTeamResponses(state, teamId);
  const quizScore = getQuizItems(state).reduce((sum, item) => sum + (responses.answers[item.id]?.score ?? 0), 0);
  const forkliftScore = Object.values(responses.forkliftRuns).reduce((sum, run) => sum + run.score, 0);

  return quizScore + forkliftScore;
}

export function getQuizAnswerStatusLabel(status: QuizAnswerRowStatus) {
  if (status === "correct") {
    return "Doğru";
  }

  if (status === "wrong") {
    return "Yanlış";
  }

  if (status === "pending") {
    return "Bekliyor";
  }

  return "Cevapsız";
}

export function getQuizAnswerBreakdown(
  state: GameState,
  item: QuizFlowItem,
  showCorrectAnswer = state.showCorrectAnswer,
): QuizAnswerBreakdown {
  const optionCounts: Record<AnswerId, number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
  };
  let correctAnswers = 0;
  let wrongAnswers = 0;

  const rows = state.teams
    .map((team) => {
      const answer = getTeamResponses(state, team.id).answers[item.id];

      if (answer) {
        optionCounts[answer.optionId] += 1;

        if (answer.isCorrect) {
          correctAnswers += 1;
        } else {
          wrongAnswers += 1;
        }
      }

      const status: QuizAnswerRowStatus = !answer
        ? "unanswered"
        : showCorrectAnswer
          ? answer.isCorrect
            ? "correct"
            : "wrong"
          : "pending";

      return {
        teamId: team.id,
        teamName: team.name,
        selectedOptionId: answer?.optionId ?? null,
        status,
        questionScore: answer?.score ?? 0,
        totalScore: getTeamTotalScore(state, team.id),
        joinedAt: team.joinedAt,
      };
    })
    .sort((a, b) => a.joinedAt - b.joinedAt);

  const totalAnswers = Object.values(optionCounts).reduce((sum, count) => sum + count, 0);

  return {
    totalTeams: state.teams.length,
    answeredTeams: totalAnswers,
    unansweredTeams: Math.max(0, state.teams.length - totalAnswers),
    correctAnswers,
    wrongAnswers,
    optionCounts,
    totalAnswers,
    rows,
  };
}

type LeaderboardOptions = {
  excludeQuizItemId?: string;
};

export function deriveLeaderboard(state: GameState, options: LeaderboardOptions = {}): LeaderboardEntry[] {
  const quizItems = getQuizItems(state).filter((item) => item.id !== options.excludeQuizItemId);

  return state.teams
    .map((team) => {
      const responses = getTeamResponses(state, team.id);
      const answers = quizItems.map((item) => responses.answers[item.id]).filter(Boolean);
      const forkliftRuns = Object.values(responses.forkliftRuns);
      const quizScore = answers.reduce((sum, answer) => sum + answer.score, 0);
      const forkliftScore = forkliftRuns.reduce((sum, run) => sum + run.score, 0);
      const correctAnswers = answers.filter((answer) => answer.isCorrect).length;
      const wrongAnswers = answers.filter((answer) => !answer.isCorrect).length;

      return {
        id: team.id,
        name: team.name,
        score: quizScore + forkliftScore,
        correctAnswers,
        wrongAnswers,
        missedQuestions: Math.max(0, quizItems.length - answers.length),
        forkliftScore,
        joinedAt: team.joinedAt,
      };
    })
    .sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt);
}

export function formatPrize(value: number, currency: string) {
  return `${value.toLocaleString("tr-TR")} ${currency}`;
}

function csvEscape(value: string | number) {
  const text = String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function formatSecondsFromMs(valueMs: number) {
  return (valueMs / 1000).toFixed(2);
}

export function buildResultsCsv(state: GameState) {
  const quizItems = getQuizItems(state);
  const leaderboard = deriveLeaderboard(state);
  const headers = [
    "sira",
    "takim_adi",
    "toplam_puan",
    "dogru_cevap_sayisi",
    "yanlis_cevap_sayisi",
    "cevapsiz_quiz_sayisi",
    "ortalama_cevap_suresi_sn",
    ...quizItems.flatMap((_, index) => [
      `quiz_${index + 1}_soru_basligi`,
      `quiz_${index + 1}_dogru_cevap`,
      `quiz_${index + 1}_dogru_cevap_metni`,
      `quiz_${index + 1}_verilen_cevap`,
      `quiz_${index + 1}_verilen_cevap_metni`,
      `quiz_${index + 1}_cevap_suresi_sn`,
      `quiz_${index + 1}_durum`,
      `quiz_${index + 1}_puan`,
    ]),
    "forklift_puan",
  ];

  const rows = leaderboard.map((entry, index) => {
    const responses = getTeamResponses(state, entry.id);
    const answeredQuizTimes = quizItems
      .map((item) => responses.answers[item.id]?.answerTimeMs)
      .filter((answerTimeMs): answerTimeMs is number => typeof answerTimeMs === "number");
    const averageAnswerTimeMs = answeredQuizTimes.length
      ? answeredQuizTimes.reduce((sum, answerTimeMs) => sum + answerTimeMs, 0) / answeredQuizTimes.length
      : 0;
    const questionColumns = quizItems.flatMap((item) => {
      const answer = responses.answers[item.id];
      const answerStatus = answer ? (answer.isCorrect ? "dogru" : "yanlis") : "cevapsiz";
      const correctOption = item.options.find((option) => option.id === item.correctOptionId);
      const selectedOption = answer ? item.options.find((option) => option.id === answer.optionId) : undefined;

      return [
        item.title,
        item.correctOptionId,
        correctOption?.text ?? "",
        answer?.optionId ?? "Cevap yok",
        selectedOption?.text ?? "Cevap yok",
        answer ? formatSecondsFromMs(answer.answerTimeMs) : "",
        answerStatus,
        answer?.score ?? 0,
      ];
    });

    return [
      index + 1,
      entry.name,
      entry.score,
      entry.correctAnswers,
      entry.wrongAnswers,
      entry.missedQuestions,
      formatSecondsFromMs(averageAnswerTimeMs),
      ...questionColumns,
      entry.forkliftScore,
    ];
  });

  return [headers, ...rows].map((row) => row.map(csvEscape).join(";")).join("\n");
}

export function getYoutubeEmbedUrl(url: string) {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes("youtu.be")) {
      const id = parsedUrl.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }

    if (parsedUrl.pathname.includes("/embed/")) {
      return url;
    }

    const videoId = parsedUrl.searchParams.get("v");
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  } catch {
    return url;
  }
}
