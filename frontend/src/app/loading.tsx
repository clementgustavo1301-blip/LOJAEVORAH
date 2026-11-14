export default function Loading() {
  return (
    <div
      className="min-h-[55vh] sm:min-h-[60vh] w-full bg-brand-background"
      aria-busy="true"
      aria-label="Carregando página"
    >
      <div className="max-w-[1380px] mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-10 animate-pulse">
        <div className="h-2.5 w-24 sm:h-3 sm:w-28 bg-brand-border/60 rounded-xs mb-3 sm:mb-4" />
        <div className="h-7 w-48 sm:h-9 sm:w-64 bg-brand-border/50 rounded-xs mb-6 sm:mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
          <div className="aspect-[4/5] bg-white border border-brand-border/60" />
          <div className="aspect-[4/5] bg-white border border-brand-border/60" />
          <div className="hidden md:block aspect-[4/5] bg-white border border-brand-border/60" />
          <div className="hidden md:block aspect-[4/5] bg-white border border-brand-border/60" />
        </div>
      </div>
    </div>
  );
}
