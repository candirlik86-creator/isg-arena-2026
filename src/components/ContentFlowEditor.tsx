"use client";

import { useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import {
  answerIds,
  createFlowItemId,
  getFlowItemMedia,
  getItemCategory,
  getItemDurationSeconds,
  getQuestionLabel,
  getQuizItems,
  getQuizPosition,
  getYoutubeEmbedUrl,
  inferMediaSource,
  inferMediaType,
  type AnswerId,
  type ContentFlowItem,
  type GameState,
} from "@/lib/game-state";

type ContentFlowEditorProps = {
  state: GameState;
  onSelectItem: (index: number) => void;
  onAddItem: (item: ContentFlowItem) => void;
  onUpdateItem: (item: ContentFlowItem) => void;
  onDeleteItem: (itemId: string) => void;
  onDuplicateItem: (itemId: string) => void;
  onMoveItem: (itemId: string, direction: -1 | 1) => void;
  onRestoreDefaultFlow: () => void;
};

type EditorMode = "idle" | "add" | "edit";
type FlowItemType = ContentFlowItem["type"];

type FlowItemFormState = {
  type: FlowItemType;
  title: string;
  category: string;
  timeLimitSeconds: string;
  description: string;
  mediaUrl: string;
  uploadedImageDataUrl: string;
  uploadedMediaType?: "image" | "video";
  message: string;
  options: Record<AnswerId, string>;
  correctOptionId: AnswerId | "";
  explanation: string;
};

type FormErrors = Partial<Record<keyof FlowItemFormState | AnswerId, string>>;

type AddContentCard = {
  id: string;
  label: string;
  description: string;
  type: FlowItemType;
  badge: string;
  accentClass: string;
  template?: Partial<FlowItemFormState>;
};

const typeLabels: Record<FlowItemType, string> = {
  quiz: "Quiz",
  infoSlide: "Bilgi",
  mediaSlide: "Medya",
  forkliftChallenge: "Forklift",
  finalRound: "Final Round",
};

const typeDescriptions: Record<FlowItemType, string> = {
  quiz: "Puanlanan soru",
  infoSlide: "Eğitim veya açıklama",
  mediaSlide: "Medya bağlantılı içerik",
  forkliftChallenge: "Özel güvenli sürüş etabı",
  finalRound: "Ayrı final modu",
};

const addContentCards: AddContentCard[] = [
  {
    id: "quiz",
    label: "Quiz",
    description: "Dört seçenekli, puanlanan klasik yarışma sorusu.",
    type: "quiz",
    badge: "Soru",
    accentClass: "from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-400",
  },
  {
    id: "visual-quiz",
    label: "Görselli Quiz",
    description: "Soruya görsel, video veya YouTube bağlantısı ekleyin.",
    type: "quiz",
    badge: "Medya",
    accentClass: "from-cyan-50 to-blue-50 border-cyan-200 hover:border-cyan-400",
  },
  {
    id: "info-slide",
    label: "Bilgi Slaytı",
    description: "Katılımcılara kısa eğitim, not veya opsiyonel medya gösterin.",
    type: "infoSlide",
    badge: "İçerik",
    accentClass: "from-emerald-50 to-teal-50 border-emerald-200 hover:border-emerald-400",
  },
  {
    id: "true-false",
    label: "Doğru/Yanlış",
    description: "Hızlı karar gerektiren doğru/yanlış formatlı quiz.",
    type: "quiz",
    badge: "Hızlı",
    accentClass: "from-amber-50 to-orange-50 border-amber-200 hover:border-amber-400",
    template: {
      options: {
        A: "Doğru",
        B: "Yanlış",
        C: "Emin değilim",
        D: "Pas",
      },
      correctOptionId: "A",
    },
  },
  {
    id: "forklift",
    label: "Forklift Etabı",
    description: "Finale özel güvenli sürüş ve saha farkındalığı etabı.",
    type: "forkliftChallenge",
    badge: "Final",
    accentClass: "from-slate-50 to-zinc-50 border-slate-200 hover:border-slate-400",
  },
];

const emptyOptions: Record<AnswerId, string> = {
  A: "",
  B: "",
  C: "",
  D: "",
};

const inputClass =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
const labelClass = "text-xs font-black uppercase tracking-[0.16em] text-slate-500";
const subtleButton =
  "rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-widest text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-35";
const dangerButton =
  "rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black uppercase tracking-widest text-red-700 transition hover:bg-red-100";
const acceptedMediaTypes = "image/*,video/*";

function createEmptyForm(type: FlowItemType): FlowItemFormState {
  return {
    type,
    title: "",
    category: "",
    timeLimitSeconds: type === "forkliftChallenge" ? "60" : type === "quiz" ? "30" : "",
    description: "",
    mediaUrl: "",
    uploadedImageDataUrl: "",
    uploadedMediaType: undefined,
    message: type === "forkliftChallenge" ? "Hızlı olan değil, güvenli süren kazanır." : "",
    options: { ...emptyOptions },
    correctOptionId: "",
    explanation: "",
  };
}

function createFormFromItem(item: ContentFlowItem): FlowItemFormState {
  const baseForm = createEmptyForm(item.type);
  const duration = getItemDurationSeconds(item);

  if (item.type === "quiz") {
    return {
      ...baseForm,
      title: item.title,
      category: item.topic,
      timeLimitSeconds: String(item.timeLimitSeconds),
      options: Object.fromEntries(item.options.map((option) => [option.id, option.text])) as Record<AnswerId, string>,
      correctOptionId: item.correctOptionId,
      explanation: item.explanation ?? "",
      mediaUrl: item.mediaUrl ?? item.imageUrl ?? "",
      uploadedImageDataUrl: item.imageUrl ?? "",
      uploadedMediaType: item.mediaType === "image" || item.mediaType === "video" ? item.mediaType : undefined,
    };
  }

  if (item.type === "infoSlide") {
    return {
      ...baseForm,
      title: item.title,
      category: getItemCategory(item),
      timeLimitSeconds: duration ? String(duration) : "",
      description: item.description,
      mediaUrl: item.mediaUrl ?? item.imageUrl ?? "",
      uploadedImageDataUrl: item.imageUrl ?? "",
      uploadedMediaType: item.mediaType === "image" || item.mediaType === "video" ? item.mediaType : undefined,
    };
  }

  if (item.type === "mediaSlide") {
    return {
      ...baseForm,
      title: item.title,
      category: getItemCategory(item),
      timeLimitSeconds: duration ? String(duration) : "",
      description: item.description,
      mediaUrl: item.mediaUrl,
      uploadedImageDataUrl: item.uploadedImageDataUrl ?? "",
      uploadedMediaType: item.mediaType === "image" || item.mediaType === "video" ? item.mediaType : undefined,
    };
  }

  if (item.type === "finalRound") {
    return {
      ...baseForm,
      title: item.title,
      category: getItemCategory(item),
    };
  }

  return {
    ...baseForm,
    title: item.title,
    category: getItemCategory(item),
    timeLimitSeconds: String(item.timeLimitSeconds),
    description: item.description,
    message: item.message,
  };
}

function getPositiveDuration(value: string) {
  const duration = Number(value);
  return Number.isFinite(duration) && duration > 0 ? Math.round(duration) : null;
}

function validateForm(form: FlowItemFormState) {
  const errors: FormErrors = {};
  const title = form.title.trim();
  const duration = getPositiveDuration(form.timeLimitSeconds);

  if (!title) {
    errors.title = "Başlık boş olamaz.";
  }

  if (form.type === "quiz") {
    if (!duration) {
      errors.timeLimitSeconds = "Süre pozitif sayı olmalı.";
    }

    answerIds.forEach((optionId) => {
      if (!form.options[optionId].trim()) {
        errors[optionId] = `${optionId} seçeneği boş olamaz.`;
      }
    });

    if (!form.correctOptionId) {
      errors.correctOptionId = "Doğru cevap seçili olmalı.";
    }

    if (form.mediaUrl.trim() && inferMediaType(form.mediaUrl) === "none") {
      errors.mediaUrl = "Desteklenen görsel, video veya YouTube bağlantısı girin.";
    }
  }

  if (form.type === "infoSlide" && form.mediaUrl.trim() && inferMediaType(form.mediaUrl) === "none") {
    errors.mediaUrl = "Desteklenen görsel, video veya YouTube bağlantısı girin.";
  }

  if ((form.type === "infoSlide" || form.type === "mediaSlide") && form.timeLimitSeconds.trim() && !duration) {
    errors.timeLimitSeconds = "Süre girildiyse pozitif sayı olmalı.";
  }

  if (form.type === "infoSlide" && !form.description.trim()) {
    errors.description = "İçerik metni boş olamaz.";
  }

  if (form.type === "mediaSlide") {
    if (!form.mediaUrl.trim()) {
      errors.mediaUrl = "Medya URL yazın veya dosya seçin.";
    } else if (inferMediaType(form.mediaUrl) === "none") {
      errors.mediaUrl = "Desteklenen görsel, video veya YouTube bağlantısı girin.";
    }
  }

  if (form.type === "forkliftChallenge") {
    if (!duration) {
      errors.timeLimitSeconds = "Süre pozitif sayı olmalı.";
    }

    if (!form.description.trim()) {
      errors.description = "Açıklama boş olamaz.";
    }
  }

  return errors;
}

function hasErrors(errors: FormErrors) {
  return Object.keys(errors).length > 0;
}

function buildFlowItem(form: FlowItemFormState, state: GameState, existingItem?: ContentFlowItem): ContentFlowItem {
  const title = form.title.trim();
  const category = form.category.trim();
  const duration = getPositiveDuration(form.timeLimitSeconds);

  if (form.type === "quiz") {
    const existingQuiz = existingItem?.type === "quiz" ? existingItem : null;
    const mediaUrl = form.mediaUrl.trim();
    const mediaType = form.uploadedMediaType ?? inferMediaType(mediaUrl);
    const mediaSource = form.uploadedMediaType ? "upload" : inferMediaSource(mediaUrl);

    return {
      id: existingQuiz?.id ?? createFlowItemId("quiz"),
      type: "quiz",
      quizNumber: existingQuiz?.quizNumber ?? getQuizItems(state).length + 1,
      title,
      category: category || undefined,
      topic: category || "Genel",
      stage: existingQuiz?.stage ?? "Admin Eklenen Quiz",
      timeLimitSeconds: duration ?? 30,
      maxScore: existingQuiz?.maxScore ?? 1000,
      imageUrl: mediaType === "image" ? mediaUrl || undefined : undefined,
      mediaUrl: mediaUrl || undefined,
      mediaType,
      mediaSource,
      options: answerIds.map((optionId) => ({
        id: optionId,
        text: form.options[optionId].trim(),
      })),
      correctOptionId: form.correctOptionId as AnswerId,
      explanation: form.explanation.trim() || undefined,
    };
  }

  if (form.type === "infoSlide") {
    const existingInfoSlide = existingItem?.type === "infoSlide" ? existingItem : null;
    const mediaUrl = form.mediaUrl.trim();
    const mediaType = form.uploadedMediaType ?? inferMediaType(mediaUrl);
    const mediaSource = form.uploadedMediaType ? "upload" : inferMediaSource(mediaUrl);

    return {
      id: existingInfoSlide?.id ?? createFlowItemId("infoSlide"),
      type: "infoSlide",
      title,
      category: category || undefined,
      description: form.description.trim(),
      imageUrl: mediaType === "image" ? mediaUrl || undefined : undefined,
      mediaUrl: mediaUrl || undefined,
      mediaType,
      mediaSource,
      timeLimitSeconds: duration ?? undefined,
    };
  }

  if (form.type === "mediaSlide") {
    const existingMediaSlide = existingItem?.type === "mediaSlide" ? existingItem : null;
    const mediaUrl = form.mediaUrl.trim();
    const mediaType = form.uploadedMediaType ?? inferMediaType(mediaUrl);

    return {
      id: existingMediaSlide?.id ?? createFlowItemId("mediaSlide"),
      type: "mediaSlide",
      title,
      category: category || undefined,
      description: form.description.trim(),
      mediaUrl,
      mediaType,
      mediaSource: inferMediaSource(mediaUrl),
      timeLimitSeconds: duration ?? undefined,
      uploadedImageDataUrl: undefined,
    };
  }

  if (form.type === "finalRound" && existingItem?.type === "finalRound") {
    return existingItem;
  }

  const existingForkliftChallenge = existingItem?.type === "forkliftChallenge" ? existingItem : null;

  return {
    id: existingForkliftChallenge?.id ?? createFlowItemId("forkliftChallenge"),
    type: "forkliftChallenge",
    title,
    category: category || "Final",
    description: form.description.trim(),
    timeLimitSeconds: duration ?? 60,
    maxScore: existingForkliftChallenge?.maxScore ?? 1000,
    message: form.message.trim() || existingForkliftChallenge?.message || "Hızlı olan değil, güvenli süren kazanır.",
  };
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-2 text-sm font-bold text-red-600">{message}</p> : null;
}

async function uploadMediaFile(file: File) {
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

function MediaPreview({ mediaUrl }: { mediaUrl: string }) {
  const [imageError, setImageError] = useState(false);
  const cleanUrl = mediaUrl.trim();
  const mediaType = inferMediaType(cleanUrl);

  if (!cleanUrl) {
    return (
      <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-bold text-slate-500">
        Medya seçilmedi.
      </div>
    );
  }

  if (mediaType === "none") {
    return (
      <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
        Bu bağlantı desteklenen görsel, video veya YouTube formatı değil.
      </div>
    );
  }

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm">
      {mediaType === "image" ? (
        imageError ? (
          <div className="flex min-h-44 items-center justify-center p-4 text-center text-sm font-bold text-amber-200">
            Görsel yüklenemedi. URL: {cleanUrl}
          </div>
        ) : (
          <img src={cleanUrl} alt="" className="max-h-52 w-full object-contain" onError={() => setImageError(true)} />
        )
      ) : mediaType === "video" ? (
        <video src={cleanUrl} controls className="max-h-52 w-full" />
      ) : (
        <iframe
          title="Medya önizleme"
          src={getYoutubeEmbedUrl(cleanUrl)}
          className="aspect-video max-h-52 w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h4 className="text-base font-black text-slate-950">{title}</h4>
        {description ? <p className="mt-1 text-sm font-semibold text-slate-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function ContentFlowEditor({
  state,
  onSelectItem,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onDuplicateItem,
  onMoveItem,
  onRestoreDefaultFlow,
}: ContentFlowEditorProps) {
  const [mode, setMode] = useState<EditorMode>("idle");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [form, setForm] = useState<FlowItemFormState>(() => createEmptyForm("quiz"));
  const [errors, setErrors] = useState<FormErrors>({});
  const [notice, setNotice] = useState("");
  const [mediaMessage, setMediaMessage] = useState("");
  const quizCount = useMemo(() => getQuizItems(state).length, [state]);
  const editingItem = editingItemId ? state.flowItems.find((item) => item.id === editingItemId) : undefined;

  const patchForm = (patch: Partial<FlowItemFormState>) => {
    setForm((currentForm) => ({ ...currentForm, ...patch }));
    setErrors({});
    setNotice("");
  };

  const startAdd = (type: FlowItemType, template: Partial<FlowItemFormState> = {}) => {
    setMode("add");
    setEditingItemId(null);
    const nextForm = createEmptyForm(type);
    setForm({
      ...nextForm,
      ...template,
      options: template.options ? { ...nextForm.options, ...template.options } : nextForm.options,
    });
    setErrors({});
    setNotice("");
    setMediaMessage("");
  };

  const startEdit = (item: ContentFlowItem) => {
    setMode("edit");
    setEditingItemId(item.id);
    setForm(createFormFromItem(item));
    setErrors({});
    setNotice("");
    setMediaMessage("");
  };

  const closeForm = () => {
    setMode("idle");
    setEditingItemId(null);
    setForm(createEmptyForm("quiz"));
    setErrors({});
    setMediaMessage("");
  };

  const handleMediaFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        mediaUrl: "Sadece görsel veya video dosyası seçilebilir.",
      }));
      event.currentTarget.value = "";
      return;
    }

    setMediaMessage("Dosya yükleniyor...");
    try {
      const uploaded = await uploadMediaFile(file);
      patchForm({ mediaUrl: uploaded.path, uploadedImageDataUrl: "", uploadedMediaType: uploaded.mediaType });
      setErrors({});
      setMediaMessage("Dosya yüklendi.");
    } catch (error) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        mediaUrl: error instanceof Error ? error.message : "Dosya yüklenemedi.",
      }));
      setMediaMessage("");
    } finally {
      event.currentTarget.value = "";
    }
  };

  const submitForm = () => {
    const nextErrors = validateForm(form);

    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      setNotice("");
      return;
    }

    const nextItem = buildFlowItem(form, state, editingItem);

    if (mode === "edit" && editingItem) {
      onUpdateItem(nextItem);
      setNotice("Akış öğesi güncellendi.");
    } else {
      onAddItem(nextItem);
      setNotice("Yeni akış öğesi eklendi.");
    }

    closeForm();
  };

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">Akış Editörü</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">Yarışma Akışı</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {state.flowItems.length} öğe · {quizCount} quiz
          </p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
          İçerik seç, düzenle, canlı akışa al
        </div>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">İçerik seç</p>
            <h3 className="mt-1 text-lg font-black text-slate-950">Yeni öğe ekle</h3>
          </div>
          <p className="max-w-xl text-sm font-semibold text-slate-500">
            Kartlardan birini seçin; aşağıda düzenlenebilir bir öğe taslağı açılır.
          </p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {addContentCards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => startAdd(card.type, card.template)}
            className={`group rounded-2xl border bg-gradient-to-br p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${card.accentClass}`}
          >
            <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-600 shadow-sm">
              {card.badge}
            </span>
            <span className="mt-3 block text-lg font-black text-slate-950">{card.label}</span>
            <span className="mt-2 block text-sm font-semibold leading-relaxed text-slate-600">{card.description}</span>
          </button>
          ))}
        </div>
      </div>

      {notice ? (
        <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-700">
          {notice}
        </p>
      ) : null}

      {mode !== "idle" ? (
        <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 shadow-inner">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
                {mode === "edit" ? "Düzenle" : "Yeni içerik"}
              </p>
              <h3 className="mt-2 text-2xl font-black text-slate-950">{typeLabels[form.type]}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">{typeDescriptions[form.type]}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={closeForm} className={subtleButton}>
                Vazgeç
              </button>
              <button
                type="button"
                onClick={submitForm}
                className="rounded-xl bg-slate-950 px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-sm transition hover:bg-slate-800"
              >
                {mode === "edit" ? "Kaydet" : "Ekle"}
              </button>
            </div>
          </div>

          {hasErrors(errors) ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-red-700">Eksik alanlar</p>
              <div className="mt-2 grid gap-1 text-sm font-bold text-red-700">
                {Object.values(errors).filter(Boolean).map((error) => (
                  <p key={error}>{error}</p>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-5 grid gap-4">
            <FormSection title="Soru bilgileri" description="Başlık, kategori ve süre bilgilerini düzenleyin.">
              <div className="grid gap-4 lg:grid-cols-2">
                <label className="block lg:col-span-2">
                  <span className={labelClass}>{form.type === "quiz" ? "Soru başlığı" : "Başlık"}</span>
                  <input
                    value={form.title}
                    onChange={(event) => patchForm({ title: event.target.value })}
                    className={inputClass}
                    placeholder={form.type === "quiz" ? "Sorunuzu buraya yazın" : "Öğe başlığı"}
                  />
                  <FieldError message={errors.title} />
                </label>

                <label className="block">
                  <span className={labelClass}>Kategori</span>
                  <input
                    value={form.category}
                    onChange={(event) => patchForm({ category: event.target.value })}
                    className={inputClass}
                    placeholder="Örn. Saha farkındalığı"
                  />
                </label>

                <label className="block">
                  <span className={labelClass}>
                    Süre saniye{form.type === "infoSlide" || form.type === "mediaSlide" ? " opsiyonel" : ""}
                  </span>
                  <input
                    value={form.timeLimitSeconds}
                    onChange={(event) => patchForm({ timeLimitSeconds: event.target.value })}
                    type="number"
                    min={1}
                    className={inputClass}
                  />
                  <FieldError message={errors.timeLimitSeconds} />
                </label>
              </div>
            </FormSection>

            {form.type === "quiz" ? (
              <>
                <FormSection title="Cevaplar" description="A/B/C/D cevaplarını kısa ve okunabilir tutun.">
                  <div className="grid gap-4 lg:grid-cols-2">
                    {answerIds.map((optionId) => (
                      <label key={optionId} className="block">
                        <span className={labelClass}>{optionId} seçeneği</span>
                        <input
                          value={form.options[optionId]}
                          onChange={(event) =>
                            patchForm({
                              options: {
                                ...form.options,
                                [optionId]: event.target.value,
                              },
                            })
                          }
                          className={inputClass}
                          placeholder={`${optionId} cevabı`}
                        />
                        <FieldError message={errors[optionId]} />
                      </label>
                    ))}
                  </div>
                </FormSection>

                <FormSection title="Doğru cevap" description="Skor ve sonuç ekranı bu seçimi kullanır.">
                  <div className="grid grid-cols-4 gap-2">
                    {answerIds.map((optionId) => (
                      <button
                        key={optionId}
                        type="button"
                        onClick={() => patchForm({ correctOptionId: optionId })}
                        className={`rounded-2xl border px-4 py-3 text-lg font-black transition ${
                          form.correctOptionId === optionId
                            ? "border-emerald-300 bg-emerald-500 text-white shadow-md"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                        }`}
                      >
                        {optionId}
                      </button>
                    ))}
                  </div>
                  <FieldError message={errors.correctOptionId} />
                </FormSection>
              </>
            ) : null}

            {form.type === "quiz" || form.type === "infoSlide" || form.type === "mediaSlide" ? (
              <FormSection
                title="Medya"
                description={
                  form.type === "quiz"
                    ? "Quiz için opsiyonel görsel, video veya YouTube bağlantısı ekleyin."
                    : form.type === "infoSlide"
                      ? "Bilgi slaytı için opsiyonel görsel, video veya YouTube bağlantısı ekleyin."
                      : "Medya slaytı için görsel, video veya YouTube bağlantısı seçin."
                }
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="block">
                    <span className={labelClass}>Bilgisayardan Dosya Seç</span>
                    <input
                      type="file"
                      accept={acceptedMediaTypes}
                      onChange={(event) => void handleMediaFile(event)}
                      className={`${inputClass} file:mr-4 file:rounded-xl file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-black file:text-white`}
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Link / YouTube URL</span>
                    <input
                      value={form.mediaUrl}
                      onChange={(event) => patchForm({ mediaUrl: event.target.value, uploadedImageDataUrl: "", uploadedMediaType: undefined })}
                      className={inputClass}
                      placeholder={
                        form.type === "quiz"
                          ? "/images/warehouse-hazards.jpg veya https://youtu.be/..."
                          : "/api/media/uploads/video.mp4 veya https://youtube.com/watch?v=..."
                      }
                    />
                    <FieldError message={errors.mediaUrl} />
                  </label>
                </div>
                {mediaMessage ? (
                  <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-black text-emerald-700">
                    {mediaMessage}
                  </p>
                ) : null}
                <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-slate-500">Önizleme</p>
                <MediaPreview mediaUrl={form.mediaUrl} />
              </FormSection>
            ) : null}

            <FormSection title="Açıklama/not" description="Projeksiyon veya sonuç sonrası hatırlatma metnini düzenleyin.">
              {form.type === "quiz" ? (
                <label className="block">
                  <span className={labelClass}>Öğrenme notu opsiyonel</span>
                  <textarea
                    value={form.explanation}
                    onChange={(event) => patchForm({ explanation: event.target.value })}
                    className={`${inputClass} min-h-24 resize-none`}
                    placeholder="Doğru cevap gösterildiğinde kullanılacak kısa açıklama"
                  />
                </label>
              ) : null}

              {form.type === "infoSlide" || form.type === "mediaSlide" || form.type === "forkliftChallenge" ? (
                <label className="block">
                  <span className={labelClass}>
                    {form.type === "infoSlide" ? "İçerik metni" : form.type === "mediaSlide" ? "Açıklama" : "Açıklama"}
                  </span>
                  <textarea
                    value={form.description}
                    onChange={(event) => patchForm({ description: event.target.value })}
                    className={`${inputClass} min-h-28 resize-none`}
                    placeholder="Kısa ve okunabilir bir açıklama yazın"
                  />
                  <FieldError message={errors.description} />
                </label>
              ) : null}

              {form.type === "forkliftChallenge" ? (
                <label className="mt-4 block">
                  <span className={labelClass}>Ekran mesajı</span>
                  <input
                    value={form.message}
                    onChange={(event) => patchForm({ message: event.target.value })}
                    className={inputClass}
                  />
                </label>
              ) : null}
            </FormSection>
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button type="button" onClick={closeForm} className={subtleButton}>
              Vazgeç
            </button>
            <button
              type="button"
              onClick={submitForm}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black uppercase tracking-widest text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              {mode === "edit" ? "Kaydet" : "Ekle"}
            </button>
          </div>
        </div>
      ) : null}

      {!state.flowItems.length ? (
        <div className="mt-5 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5">
          <p className="text-lg font-black text-slate-900">Akışta öğe yok.</p>
          <p className="mt-2 text-sm font-semibold text-slate-500">Yukarıdaki içerik kartlarından birini seçerek başlayın.</p>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3">
        {state.flowItems.map((item, index) => {
          const isActive = index === state.activeItemIndex;
          const duration = getItemDurationSeconds(item);
          const category = getItemCategory(item) || "Kategori yok";
          const quizPosition = item.type === "quiz" ? getQuizPosition(state, item) : null;
          const correctOption = item.type === "quiz" ? item.options.find((option) => option.id === item.correctOptionId) : undefined;
          const media = getFlowItemMedia(item);

          return (
            <article
              key={item.id}
              className={`rounded-2xl border p-4 transition ${
                isActive
                  ? "border-blue-400 bg-blue-50 ring-4 ring-blue-100"
                  : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
              }`}
            >
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black uppercase tracking-widest text-slate-600">
                      Sıra {index + 1}
                    </span>
                    <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black uppercase tracking-widest text-emerald-700">
                      {typeLabels[item.type]}
                    </span>
                    {quizPosition ? (
                      <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black uppercase tracking-widest text-amber-700">
                        Soru {quizPosition.current} / {quizPosition.total}
                      </span>
                    ) : (
                      <span className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-black uppercase tracking-widest text-sky-700">
                        {getQuestionLabel(item, state)}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 text-xl font-black leading-tight text-slate-950">{item.title}</h3>
                  <div className="mt-3 grid gap-2 text-sm font-bold text-slate-500 sm:grid-cols-3">
                    <p>Kategori: {category}</p>
                    <p>Süre: {duration ? `${duration} sn` : "Yok"}</p>
                    <p>ID: {item.id}</p>
                  </div>
                  {item.type === "quiz" ? (
                    <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-black text-emerald-700">
                      Doğru cevap: {item.correctOptionId}
                      {correctOption ? ` - ${correctOption.text}` : ""}
                    </p>
                  ) : null}
                  {media.mediaType !== "none" ? (
                    <p className="mt-3 break-all rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm font-bold text-sky-700">
                      Medya: {media.mediaType} · {media.mediaUrl}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-2 sm:grid-cols-3 lg:w-[360px]">
                  <button type="button" onClick={() => onSelectItem(index)} className={subtleButton}>
                    Aktifleştir
                  </button>
                  <button type="button" onClick={() => startEdit(item)} className={subtleButton}>
                    Düzenle
                  </button>
                  <button
                    type="button"
                    disabled={item.type === "finalRound"}
                    onClick={() => {
                      onDuplicateItem(item.id);
                      setNotice("Akış öğesi çoğaltıldı.");
                    }}
                    className={subtleButton}
                  >
                    Çoğalt
                  </button>
                  <button type="button" onClick={() => onMoveItem(item.id, -1)} disabled={index === 0} className={subtleButton}>
                    Yukarı taşı
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveItem(item.id, 1)}
                    disabled={index === state.flowItems.length - 1}
                    className={subtleButton}
                  >
                    Aşağı taşı
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Bu akış öğesini silmek istiyor musunuz?")) {
                        onDeleteItem(item.id);
                        setNotice("Akış öğesi silindi.");
                      }
                    }}
                    className={dangerButton}
                  >
                    Sil
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
