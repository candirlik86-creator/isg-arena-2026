"use client";

import {
  DEFAULT_FLOW,
  getQuestionLabel,
  shouldRevealLeaderboardAfter,
  type ContentFlowItem,
  type GameState,
} from "@/lib/game-state";

type ContentFlowEditorProps = {
  state: GameState;
  onSelectItem: (index: number) => void;
};

const typeLabels: Record<ContentFlowItem["type"], string> = {
  quiz: "Quiz",
  infoSlide: "Bilgi",
  mediaSlide: "Medya",
  forkliftChallenge: "Final",
};

export function ContentFlowEditor({ state, onSelectItem }: ContentFlowEditorProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-2xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-emerald-200">Akış Öğeleri</p>
          <h2 className="mt-2 text-3xl font-black text-white">Yarışma Akışı</h2>
        </div>
        <p className="rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm font-bold text-amber-100">
          Tabela: 3, 6 ve 8. quiz sonrası
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {DEFAULT_FLOW.map((item, index) => {
          const isActive = index === state.activeItemIndex;
          const reveal = shouldRevealLeaderboardAfter(item);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectItem(index)}
              className={`min-h-28 rounded-2xl border p-4 text-left transition ${
                isActive
                  ? "border-amber-300 bg-amber-300/15 ring-4 ring-amber-300/20"
                  : "border-white/10 bg-slate-950/60 hover:border-amber-300/40 hover:bg-white/[0.08]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-xl border border-white/10 bg-white/[0.08] px-3 py-2 text-xs font-black uppercase tracking-widest text-slate-200">
                  {typeLabels[item.type]}
                </span>
                <span className="text-sm font-black text-amber-200">{getQuestionLabel(item)}</span>
              </div>
              <h3 className="mt-3 line-clamp-2 text-lg font-black leading-tight text-white">{item.title}</h3>
              {reveal ? <p className="mt-3 text-xs font-bold uppercase tracking-widest text-emerald-200">Sonrasında lider tablosu</p> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
