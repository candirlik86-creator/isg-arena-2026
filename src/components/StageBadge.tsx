type StageBadgeProps = {
  label: string;
  tone?: "amber" | "green" | "red" | "blue";
};

const toneClasses = {
  amber: "border-amber-300/40 bg-amber-300/15 text-amber-200 shadow-amber-400/20",
  green: "border-emerald-300/40 bg-emerald-400/15 text-emerald-200 shadow-emerald-400/20",
  red: "border-red-300/40 bg-red-400/15 text-red-200 shadow-red-400/20",
  blue: "border-sky-300/40 bg-sky-400/15 text-sky-200 shadow-sky-400/20",
};

export function StageBadge({ label, tone = "amber" }: StageBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] shadow-lg ${toneClasses[tone]}`}>
      {label}
    </span>
  );
}
