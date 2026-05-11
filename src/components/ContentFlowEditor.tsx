"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import {
  answerIds,
  createFlowItemId,
  getItemCategory,
  getItemDurationSeconds,
  getQuestionLabel,
  getQuizItems,
  getQuizPosition,
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
  message: string;
  options: Record<AnswerId, string>;
  correctOptionId: AnswerId | "";
  explanation: string;
};

type FormErrors = Partial<Record<keyof FlowItemFormState | AnswerId, string>>;

const typeLabels: Record<FlowItemType, string> = {
  quiz: "Quiz",
  infoSlide: "Bilgi",
  mediaSlide: "Medya",
  forkliftChallenge: "Forklift",
};

const typeDescriptions: Record<FlowItemType, string> = {
  quiz: "Puanlanan soru",
  infoSlide: "Eğitim veya açıklama",
  mediaSlide: "Medya bağlantılı içerik",
  forkliftChallenge: "Özel güvenli sürüş etabı",
};

const emptyOptions: Record<AnswerId, string> = {
  A: "",
  B: "",
  C: "",
  D: "",
};

const inputClass =
  "mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-base font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-amber-300 focus:ring-4 focus:ring-amber-300/10";
const labelClass = "text-xs font-black uppercase tracking-[0.22em] text-slate-400";
const subtleButton =
  "rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black uppercase tracking-widest text-slate-200 transition hover:border-amber-300/40 hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-35";
const dangerButton =
  "rounded-xl border border-red-300/30 bg-red-400/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-red-100 transition hover:bg-red-400/15";
const acceptedImageTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const largeImageWarningThresholdBytes = 2 * 1024 * 1024;
const largeImageWarning = "Büyük dosyalar tarayıcı hafızasını zorlayabilir.";

function createEmptyForm(type: FlowItemType): FlowItemFormState {
  return {
    type,
    title: "",
    category: "",
    timeLimitSeconds: type === "forkliftChallenge" ? "60" : type === "quiz" ? "30" : "",
    description: "",
    mediaUrl: "",
    uploadedImageDataUrl: "",
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
    };
  }

  if (item.type === "infoSlide") {
    return {
      ...baseForm,
      title: item.title,
      category: getItemCategory(item),
      timeLimitSeconds: duration ? String(duration) : "",
      description: item.description,
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
  }

  if ((form.type === "infoSlide" || form.type === "mediaSlide") && form.timeLimitSeconds.trim() && !duration) {
    errors.timeLimitSeconds = "Süre girildiyse pozitif sayı olmalı.";
  }

  if (form.type === "infoSlide" && !form.description.trim()) {
    errors.description = "İçerik metni boş olamaz.";
  }

  if (form.type === "mediaSlide") {
    if (!form.mediaUrl.trim() && !form.uploadedImageDataUrl) {
      errors.mediaUrl = "Medya URL yazın veya resim dosyası seçin.";
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

    return {
      id: existingInfoSlide?.id ?? createFlowItemId("infoSlide"),
      type: "infoSlide",
      title,
      category: category || undefined,
      description: form.description.trim(),
      imageUrl: existingInfoSlide?.imageUrl,
      timeLimitSeconds: duration ?? undefined,
    };
  }

  if (form.type === "mediaSlide") {
    const existingMediaSlide = existingItem?.type === "mediaSlide" ? existingItem : null;
    const mediaUrl = form.mediaUrl.trim();

    return {
      id: existingMediaSlide?.id ?? createFlowItemId("mediaSlide"),
      type: "mediaSlide",
      title,
      category: category || undefined,
      description: form.description.trim(),
      mediaUrl,
      mediaType: inferMediaType(mediaUrl),
      timeLimitSeconds: duration ?? undefined,
      uploadedImageDataUrl: form.uploadedImageDataUrl || undefined,
    };
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
  return message ? <p className="mt-2 text-sm font-bold text-red-200">{message}</p> : null;
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
  const [imageWarning, setImageWarning] = useState("");
  const quizCount = useMemo(() => getQuizItems(state).length, [state]);
  const editingItem = editingItemId ? state.flowItems.find((item) => item.id === editingItemId) : undefined;

  const patchForm = (patch: Partial<FlowItemFormState>) => {
    setForm((currentForm) => ({ ...currentForm, ...patch }));
    setErrors({});
    setNotice("");
  };

  const startAdd = (type: FlowItemType) => {
    setMode("add");
    setEditingItemId(null);
    setForm(createEmptyForm(type));
    setErrors({});
    setNotice("");
    setImageWarning("");
  };

  const startEdit = (item: ContentFlowItem) => {
    setMode("edit");
    setEditingItemId(item.id);
    setForm(createFormFromItem(item));
    setErrors({});
    setNotice("");
    setImageWarning("");
  };

  const closeForm = () => {
    setMode("idle");
    setEditingItemId(null);
    setForm(createEmptyForm("quiz"));
    setErrors({});
    setImageWarning("");
  };

  const handleMediaImageFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    if (!acceptedImageTypes.includes(file.type)) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        uploadedImageDataUrl: "Sadece PNG, JPEG, WebP veya GIF resmi seçilebilir.",
      }));
      event.currentTarget.value = "";
      return;
    }

    setImageWarning(file.size > largeImageWarningThresholdBytes ? largeImageWarning : "");

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setErrors((currentErrors) => ({
          ...currentErrors,
          uploadedImageDataUrl: "Resim okunamadı.",
        }));
        return;
      }

      setForm((currentForm) => ({
        ...currentForm,
        uploadedImageDataUrl: reader.result as string,
      }));
      setErrors({});
      setNotice("");
    };
    reader.onerror = () => {
      setErrors((currentErrors) => ({
        ...currentErrors,
        uploadedImageDataUrl: "Resim okunamadı.",
      }));
    };
    reader.readAsDataURL(file);
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
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-2xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-emerald-200">Akış Editörü</p>
          <h2 className="mt-2 text-3xl font-black text-white">Yarışma Akışı</h2>
          <p className="mt-2 text-sm font-semibold text-slate-300">
            {state.flowItems.length} öğe · {quizCount} quiz
          </p>
        </div>
        <p className="rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm font-bold text-amber-100">
          Lider tablosu: admin butonuyla
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(["quiz", "infoSlide", "mediaSlide", "forkliftChallenge"] as FlowItemType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => startAdd(type)}
            className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 p-4 text-left transition hover:border-emerald-200/60 hover:bg-emerald-400/15"
          >
            <span className="text-base font-black text-white">
              {type === "quiz"
                ? "Quiz Ekle"
                : type === "infoSlide"
                  ? "Bilgi Slaytı Ekle"
                  : type === "mediaSlide"
                    ? "Medya Slaytı Ekle"
                    : "Forklift Etabı Ekle"}
            </span>
            <span className="mt-2 block text-sm font-semibold text-slate-300">{typeDescriptions[type]}</span>
          </button>
        ))}
      </div>

      {notice ? (
        <p className="mt-4 rounded-2xl border border-emerald-300/30 bg-emerald-400/10 p-4 text-sm font-black text-emerald-100">
          {notice}
        </p>
      ) : null}

      {mode !== "idle" ? (
        <div className="mt-5 rounded-[1.5rem] border border-amber-300/25 bg-slate-950/70 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">
                {mode === "edit" ? "Düzenle" : "Yeni içerik"}
              </p>
              <h3 className="mt-2 text-2xl font-black text-white">{typeLabels[form.type]}</h3>
            </div>
            <button type="button" onClick={closeForm} className={subtleButton}>
              Vazgeç
            </button>
          </div>

          {hasErrors(errors) ? (
            <div className="mt-4 rounded-2xl border border-red-300/30 bg-red-400/10 p-4">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-red-100">Eksik alanlar</p>
              <div className="mt-2 grid gap-1 text-sm font-bold text-red-100">
                {Object.values(errors).filter(Boolean).map((error) => (
                  <p key={error}>{error}</p>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <label className="block lg:col-span-2">
              <span className={labelClass}>{form.type === "quiz" ? "Soru başlığı" : "Başlık"}</span>
              <input value={form.title} onChange={(event) => patchForm({ title: event.target.value })} className={inputClass} />
              <FieldError message={errors.title} />
            </label>

            <label className="block">
              <span className={labelClass}>Kategori</span>
              <input value={form.category} onChange={(event) => patchForm({ category: event.target.value })} className={inputClass} />
            </label>

            <label className="block">
              <span className={labelClass}>Süre saniye{form.type === "infoSlide" || form.type === "mediaSlide" ? " optional" : ""}</span>
              <input
                value={form.timeLimitSeconds}
                onChange={(event) => patchForm({ timeLimitSeconds: event.target.value })}
                type="number"
                min={1}
                className={inputClass}
              />
              <FieldError message={errors.timeLimitSeconds} />
            </label>

            {form.type === "quiz" ? (
              <>
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
                    />
                    <FieldError message={errors[optionId]} />
                  </label>
                ))}

                <div className="lg:col-span-2">
                  <p className={labelClass}>Doğru cevap</p>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {answerIds.map((optionId) => (
                      <button
                        key={optionId}
                        type="button"
                        onClick={() => patchForm({ correctOptionId: optionId })}
                        className={`rounded-2xl border px-4 py-3 text-lg font-black transition ${
                          form.correctOptionId === optionId
                            ? "border-emerald-200 bg-emerald-300 text-slate-950"
                            : "border-white/10 bg-white/[0.06] text-white hover:border-emerald-300/40"
                        }`}
                      >
                        {optionId}
                      </button>
                    ))}
                  </div>
                  <FieldError message={errors.correctOptionId} />
                </div>

                <label className="block lg:col-span-2">
                  <span className={labelClass}>Açıklama / öğrenme notu optional</span>
                  <textarea
                    value={form.explanation}
                    onChange={(event) => patchForm({ explanation: event.target.value })}
                    className={`${inputClass} min-h-24 resize-none`}
                  />
                </label>
              </>
            ) : null}

            {form.type === "infoSlide" ? (
              <label className="block lg:col-span-2">
                <span className={labelClass}>İçerik metni</span>
                <textarea
                  value={form.description}
                  onChange={(event) => patchForm({ description: event.target.value })}
                  className={`${inputClass} min-h-32 resize-none`}
                />
                <FieldError message={errors.description} />
              </label>
            ) : null}

            {form.type === "mediaSlide" ? (
              <>
                <label className="block lg:col-span-2">
                  <span className={labelClass}>Açıklama</span>
                  <textarea
                    value={form.description}
                    onChange={(event) => patchForm({ description: event.target.value })}
                    className={`${inputClass} min-h-28 resize-none`}
                  />
                </label>
                <label className="block lg:col-span-2">
                  <span className={labelClass}>Medya URL</span>
                  <input value={form.mediaUrl} onChange={(event) => patchForm({ mediaUrl: event.target.value })} className={inputClass} />
                  <FieldError message={errors.mediaUrl} />
                </label>
                <div className="lg:col-span-2">
                  <label className="block">
                    <span className={labelClass}>Dosya Seç</span>
                    <input
                      type="file"
                      accept={acceptedImageTypes.join(",")}
                      onChange={handleMediaImageFile}
                      className={`${inputClass} file:mr-4 file:rounded-xl file:border-0 file:bg-amber-300 file:px-4 file:py-2 file:text-sm file:font-black file:text-slate-950`}
                    />
                  </label>
                  <FieldError message={errors.uploadedImageDataUrl} />
                  {imageWarning ? (
                    <p className="mt-3 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-3 text-sm font-black text-amber-100">
                      {imageWarning}
                    </p>
                  ) : null}
                  {form.uploadedImageDataUrl ? (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Seçilen resim önizleme</p>
                      <img
                        src={form.uploadedImageDataUrl}
                        alt=""
                        className="mt-3 max-h-48 w-full rounded-xl object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          patchForm({ uploadedImageDataUrl: "" });
                          setImageWarning("");
                        }}
                        className={`${subtleButton} mt-3`}
                      >
                        Resmi Kaldır
                      </button>
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}

            {form.type === "forkliftChallenge" ? (
              <>
                <label className="block lg:col-span-2">
                  <span className={labelClass}>Açıklama</span>
                  <textarea
                    value={form.description}
                    onChange={(event) => patchForm({ description: event.target.value })}
                    className={`${inputClass} min-h-28 resize-none`}
                  />
                  <FieldError message={errors.description} />
                </label>
                <label className="block lg:col-span-2">
                  <span className={labelClass}>Ekran mesajı</span>
                  <input value={form.message} onChange={(event) => patchForm({ message: event.target.value })} className={inputClass} />
                </label>
              </>
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button type="button" onClick={closeForm} className={subtleButton}>
              İptal
            </button>
            <button
              type="button"
              onClick={submitForm}
              className="rounded-2xl bg-amber-300 px-5 py-3 text-sm font-black uppercase tracking-widest text-slate-950 shadow-xl shadow-amber-500/20 transition hover:-translate-y-0.5"
            >
              {mode === "edit" ? "Güncelle" : "Ekle"}
            </button>
          </div>
        </div>
      ) : null}

      {!state.flowItems.length ? (
        <div className="mt-5 rounded-[1.5rem] border border-red-300/30 bg-red-400/10 p-5">
          <p className="text-lg font-black text-red-100">Akışta öğe yok.</p>
          <p className="mt-2 text-sm font-semibold text-slate-200">
            Yeni bir içerik ekleyebilir veya varsayılan akışı geri yükleyebilirsiniz.
          </p>
          <button type="button" onClick={onRestoreDefaultFlow} className="mt-4 rounded-2xl bg-amber-300 px-5 py-3 text-sm font-black text-slate-950">
            Varsayılan Akışı Geri Yükle
          </button>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3">
        {state.flowItems.map((item, index) => {
          const isActive = index === state.activeItemIndex;
          const duration = getItemDurationSeconds(item);
          const category = getItemCategory(item) || "Kategori yok";
          const quizPosition = item.type === "quiz" ? getQuizPosition(state, item) : null;
          const correctOption = item.type === "quiz" ? item.options.find((option) => option.id === item.correctOptionId) : undefined;

          return (
            <article
              key={item.id}
              className={`rounded-2xl border p-4 transition ${
                isActive
                  ? "border-amber-300 bg-amber-300/15 ring-4 ring-amber-300/20"
                  : "border-white/10 bg-slate-950/60 hover:border-amber-300/30"
              }`}
            >
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-xl border border-white/10 bg-white/[0.08] px-3 py-2 text-xs font-black uppercase tracking-widest text-slate-200">
                      Sıra {index + 1}
                    </span>
                    <span className="rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-emerald-100">
                      {typeLabels[item.type]}
                    </span>
                    {quizPosition ? (
                      <span className="rounded-xl border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-amber-100">
                        Soru {quizPosition.current} / {quizPosition.total}
                      </span>
                    ) : (
                      <span className="rounded-xl border border-sky-300/25 bg-sky-400/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-sky-100">
                        {getQuestionLabel(item, state)}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 text-xl font-black leading-tight text-white">{item.title}</h3>
                  <div className="mt-3 grid gap-2 text-sm font-bold text-slate-300 sm:grid-cols-3">
                    <p>Kategori: {category}</p>
                    <p>Süre: {duration ? `${duration} sn` : "Yok"}</p>
                    <p>ID: {item.id}</p>
                  </div>
                  {item.type === "quiz" ? (
                    <p className="mt-3 rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm font-black text-emerald-100">
                      Doğru cevap: {item.correctOptionId}
                      {correctOption ? ` - ${correctOption.text}` : ""}
                    </p>
                  ) : null}
                  {item.type === "mediaSlide" ? (
                    <p className="mt-3 break-all rounded-xl border border-sky-300/20 bg-sky-400/10 p-3 text-sm font-bold text-sky-100">
                      Medya URL: {item.mediaUrl || "Yok"}
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
