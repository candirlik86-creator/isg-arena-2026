import { ScreenProductMark } from "@/components/ScreenProductMark";
import { StageBadge } from "@/components/StageBadge";
import { getScreenSurfaceAttributes, resolveBrandSettings } from "@/lib/brand-theme";
import {
  getYoutubeEmbedUrl,
  inferMediaType,
  type FinalRoundFlowItem,
  type FinalRoundRuntime,
  type GameSettings,
} from "@/lib/game-state";

type FinalRoundScreenProps = {
  item: FinalRoundFlowItem;
  settings: GameSettings;
  runtime?: FinalRoundRuntime | null;
  now?: number;
};

const optionStyles = {
  A: "border-amber-200/60 bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-500",
  B: "border-sky-200/60 bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600",
  C: "border-emerald-200/60 bg-gradient-to-br from-emerald-400 via-teal-500 to-green-600",
  D: "border-rose-200/60 bg-gradient-to-br from-rose-400 via-red-500 to-pink-600",
} as const;

function FinalRoundMedia({ mediaUrl, title }: { mediaUrl?: string; title: string }) {
  const cleanUrl = mediaUrl?.trim() ?? "";
  const mediaType = inferMediaType(cleanUrl);

  if (mediaType === "image") {
    return <img src={cleanUrl} alt="" className="h-full min-h-0 w-full rounded-2xl object-contain" />;
  }

  if (mediaType === "video") {
    return <video src={cleanUrl} controls className="h-full min-h-0 w-full rounded-2xl object-contain" />;
  }

  if (mediaType === "youtube") {
    return (
      <iframe
        title={title}
        src={getYoutubeEmbedUrl(cleanUrl)}
        className="h-full min-h-0 w-full rounded-2xl"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return null;
}

export function FinalRoundScreen({ item, settings, runtime, now = Date.now() }: FinalRoundScreenProps) {
  const surface = getScreenSurfaceAttributes(settings);
  const brand = resolveBrandSettings(settings);
  const step = runtime?.itemId === item.id ? runtime.step : "intro";
  const questionIndex = runtime?.itemId === item.id ? Math.max(0, Math.min(2, runtime.questionIndex)) : 0;
  const question = item.questions[questionIndex];
  const hasMedia = inferMediaType(question.mediaUrl ?? "") !== "none";
  const stepDurationSeconds = step === "scenario" ? question.scenarioDurationSeconds : step === "question" ? question.timeLimitSeconds : null;
  const remainingSeconds =
    stepDurationSeconds !== null && runtime?.stepStartedAt
      ? Math.max(0, stepDurationSeconds - Math.floor((now - runtime.stepStartedAt) / 1000))
      : stepDurationSeconds;

  return (
    <main
      {...surface}
      className={`${surface.className} relative box-border h-[100dvh] max-h-[100dvh] overflow-hidden p-2 text-white md:p-3`}
    >
      <ScreenProductMark productBrandName={brand.productBrandName} />

      {step === "intro" ? (
        <section className="relative mx-auto flex h-full max-w-[1720px] items-center justify-center overflow-hidden rounded-[clamp(1rem,2.5vw,2.5rem)] border border-amber-200/35 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.34),rgba(127,29,29,0.52)_42%,rgba(15,23,42,0.88)_78%)] p-6 text-center shadow-2xl shadow-red-950/40">
          <div className="relative max-w-7xl rounded-[clamp(1.25rem,3vw,3rem)] border border-white/20 bg-slate-950/30 px-6 py-10 shadow-[0_0_90px_rgba(245,158,11,0.28)] backdrop-blur md:px-12 md:py-14">
            <p className="text-sm font-black uppercase tracking-[0.5em] text-amber-200 md:text-xl">İSG Arena</p>
            <h1 className="mt-5 font-black leading-none text-white drop-shadow-2xl" style={{ fontSize: "clamp(4rem, 12vw, 12rem)" }}>
              {item.introTitle || "FINAL ROUND"}
            </h1>
            <p className="mx-auto mt-7 max-w-5xl text-xl font-black leading-relaxed text-amber-100 md:text-3xl lg:text-4xl">
              {item.introMessage}
            </p>
          </div>
        </section>
      ) : null}

      {step === "scenario" ? (
        <section className="mx-auto flex h-full max-w-[1500px] flex-col items-center justify-center text-center">
          <StageBadge label={`Final Senaryo ${questionIndex + 1} / 3`} tone="red" />
          <h1 className="mt-7 max-w-6xl font-black leading-tight text-white drop-shadow-2xl" style={{ fontSize: "clamp(2.25rem, 5.5vw, 6rem)" }}>
            {question.scenarioText}
          </h1>
          <div className="mt-8 rounded-3xl border border-amber-200/40 bg-amber-300/15 px-8 py-5 shadow-2xl backdrop-blur">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-amber-100">Senaryo süresi</p>
            <p className="mt-2 text-6xl font-black tabular-nums text-white md:text-8xl">{remainingSeconds} sn</p>
          </div>
        </section>
      ) : null}

      {step === "question" ? (
        <section className="mx-auto flex h-full max-w-[1720px] flex-col gap-2 overflow-hidden pt-7">
          <header className="shrink-0 rounded-2xl border border-white/25 bg-white/[0.16] px-4 py-3 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <StageBadge label={`Final Soru ${questionIndex + 1} / 3`} tone="red" />
              <p className="rounded-xl border border-white/20 bg-white/[0.12] px-4 py-2 text-xl font-black tabular-nums text-white">
                {remainingSeconds} sn
              </p>
            </div>
            <h1 className="mt-2 line-clamp-2 font-black leading-tight text-white" style={{ fontSize: "clamp(1.35rem, 2.7vw, 3.25rem)" }}>
              {question.questionText}
            </h1>
          </header>

          {hasMedia ? (
            <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.72fr)] gap-2 overflow-hidden lg:grid-cols-[minmax(0,1.6fr)_minmax(23rem,0.72fr)]">
              <div className="flex min-h-0 overflow-hidden rounded-2xl border border-white/25 bg-slate-950/55 p-2 shadow-2xl shadow-blue-950/30 backdrop-blur">
                <div className="flex min-h-0 w-full overflow-hidden rounded-xl border border-white/10 bg-black/30">
                  <FinalRoundMedia mediaUrl={question.mediaUrl} title={question.questionText} />
                </div>
              </div>

              <div className="grid min-h-0 grid-rows-4 gap-2 overflow-hidden">
                {question.options.map((option) => (
                  <article key={option.id} className={`flex min-h-0 items-center gap-3 overflow-hidden rounded-2xl border p-3 shadow-2xl ${optionStyles[option.id]}`}>
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-xl font-black text-slate-950 shadow-xl lg:h-14 lg:w-14 lg:rounded-2xl lg:text-2xl">
                      {option.id}
                    </span>
                    <p className="line-clamp-3 min-w-0 break-words text-lg font-black leading-tight text-white lg:text-2xl">{option.text}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-3 overflow-hidden">
              {question.options.map((option) => (
                <article key={option.id} className={`flex min-h-0 items-center gap-4 overflow-hidden rounded-2xl border p-4 shadow-2xl ${optionStyles[option.id]}`}>
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl font-black text-slate-950 shadow-xl">
                    {option.id}
                  </span>
                  <p className="line-clamp-3 min-w-0 break-words text-xl font-black leading-tight text-white md:text-2xl lg:text-3xl">{option.text}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {step === "risk" ? (
        <section className="mx-auto flex h-full max-w-6xl flex-col items-center justify-center text-center">
          <StageBadge label={`Final Soru ${questionIndex + 1} tamamlandı`} tone="red" />
          <h1 className="mt-7 text-5xl font-black text-white md:text-7xl">Risk Değerlendirmesi</h1>
          <p className="mt-6 text-3xl font-black text-white md:text-5xl">Mevcut risk seviyesi: %{runtime?.riskLevel ?? 70}</p>
          <p className="mt-7 rounded-3xl border border-amber-200/35 bg-amber-300/15 px-8 py-6 text-2xl font-black leading-relaxed text-amber-100 shadow-2xl backdrop-blur md:text-4xl">
            Cevap değerlendirme sistemi sonraki PR&apos;de bağlanacak
          </p>
        </section>
      ) : null}

      {step === "results" ? (
        <section className="mx-auto flex h-full max-w-6xl flex-col items-center justify-center text-center">
          <StageBadge label="Final Round tamamlandı" tone="red" />
          <h1 className="mt-7 text-5xl font-black text-white md:text-8xl">Final Sonuçları</h1>
          <p className="mt-6 max-w-4xl text-2xl font-black leading-relaxed text-amber-100 md:text-4xl">
            Final sonuçları sonraki PR&apos;de aktif olacak.
          </p>
        </section>
      ) : null}
    </main>
  );
}
