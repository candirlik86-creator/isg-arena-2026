"use client";

import type { AnswerId, AnswerOption } from "@/lib/game-state";

type AnswerButtonsProps = {
  options: AnswerOption[];
  selectedOptionId?: AnswerId;
  correctOptionId?: AnswerId;
  onSelect?: (optionId: AnswerId) => void;
  disabled?: boolean;
};

const optionColors = {
  A: "from-amber-400 to-yellow-600",
  B: "from-sky-400 to-blue-600",
  C: "from-emerald-400 to-green-600",
  D: "from-red-400 to-rose-600",
};

export function AnswerButtons({ options, selectedOptionId, correctOptionId, onSelect, disabled = false }: AnswerButtonsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {options.map((option) => {
        const isSelected = selectedOptionId === option.id;
        const isCorrect = correctOptionId === option.id;
        const isWrongSelection = Boolean(correctOptionId) && isSelected && !isCorrect;

        return (
          <button
            key={option.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect?.(option.id)}
            className={`group min-h-28 rounded-[1.75rem] border p-4 text-left shadow-xl transition duration-200 ${
              isCorrect
                ? "border-emerald-200 bg-emerald-400/20 ring-4 ring-emerald-300/30"
                : isWrongSelection
                ? "border-red-200 bg-red-400/20 ring-4 ring-red-300/30"
                : isSelected
                ? "border-amber-200 bg-amber-300/20 ring-4 ring-amber-300/30"
                : "border-white/10 bg-white/[0.07] hover:-translate-y-1 hover:border-amber-300/50 hover:bg-white/[0.1]"
            } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
          >
            <span className="flex items-center gap-4">
              <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${optionColors[option.id]} text-2xl font-black text-slate-950 shadow-lg`}>
                {option.id}
              </span>
              <span className="text-xl font-extrabold leading-tight text-white md:text-2xl">{option.text}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
