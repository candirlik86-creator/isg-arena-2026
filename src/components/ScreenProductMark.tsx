type ScreenProductMarkProps = {
  productBrandName: string;
};

export function ScreenProductMark({ productBrandName }: ScreenProductMarkProps) {
  return (
    <p className="pointer-events-none absolute left-3 top-2 z-20 text-[10px] font-black uppercase tracking-[0.28em] text-white/60 md:left-4 md:top-3 md:text-xs">
      {productBrandName}
    </p>
  );
}
