export type AnswerOption = {
  id: "A" | "B" | "C" | "D";
  text: string;
};

export type ArenaQuestion = {
  id: number;
  title: string;
  topic: string;
  stage: string;
  timeLimitSeconds: number;
  maxScore: number;
  options: AnswerOption[];
  correctOptionId: AnswerOption["id"];
  note?: string;
};

export type Team = {
  id: string;
  name: string;
  depot: string;
  members: string[];
  score: number;
  trend: "up" | "same" | "down";
};

export const leaderboardRevealQuestions = [3, 6, 8] as const;

export const questions: ArenaQuestion[] = [
  {
    id: 1,
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
    id: 2,
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
    id: 3,
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
    id: 4,
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
    id: 5,
    title: "Forklift Güvenli Sürüş Etabı",
    topic: "Forklift",
    stage: "Placeholder Etap",
    timeLimitSeconds: 45,
    maxScore: 1000,
    options: [
      { id: "A", text: "Yükü görüşü kapatmayacak ve dengeli taşıma" },
      { id: "B", text: "Boş alanda hız limitini aşma" },
      { id: "C", text: "Rampada yükü kuralsız konumlandırma" },
      { id: "D", text: "Dönüşlerde ani manevra yapma" },
    ],
    correctOptionId: "A",
    note: "Bu etap sonraki fazda interaktif forklift güvenli sürüş senaryosuna dönüşecek.",
  },
  {
    id: 6,
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
    id: 7,
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
    id: 8,
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
    id: 9,
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
    id: 10,
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
];

export const demoTeams: Team[] = [
  { id: "t1", name: "Sarı Baretler", depot: "Ana Depo", members: ["Ayşe", "Mert", "Deniz"], score: 6420, trend: "up" },
  { id: "t2", name: "Güvenli Adım", depot: "Soğuk Depo", members: ["Ece", "Burak", "Can"], score: 6180, trend: "same" },
  { id: "t3", name: "Forklift Kartalları", depot: "Sevkiyat", members: ["Selin", "Ozan", "Bora"], score: 5900, trend: "up" },
  { id: "t4", name: "Risk Avcıları", depot: "Hammadde", members: ["Elif", "Kerem", "Naz"], score: 5520, trend: "down" },
  { id: "t5", name: "Tahliye Ekibi", depot: "Paketleme", members: ["İrem", "Ali", "Seda"], score: 5100, trend: "same" },
];

export const activeQuestion = questions[4];
