const CARD_CLASS =
  'rounded-2xl border border-black/[.08] bg-white p-4 sm:p-5 dark:border-white/[.145] dark:bg-zinc-900';

function Bar({ className }: { className: string }) {
  return <div className={`rounded bg-zinc-100 dark:bg-zinc-800 ${className}`} />;
}

export function HeroSkeleton() {
  return (
    <div aria-hidden className="grid w-full animate-pulse grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className={`${CARD_CLASS} flex h-28 flex-col`}>
          <Bar className="h-3 w-20" />
          <Bar className="mt-3 h-7 w-24" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div aria-hidden className={`${CARD_CLASS} flex h-36 animate-pulse flex-col`}>
      <Bar className="h-4 w-32" />
      <Bar className="mt-4 h-3 w-full" />
      <Bar className="mt-2 h-3 w-2/3" />
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div aria-hidden className="flex animate-pulse flex-col gap-6">
      {[0, 1].map((i) => (
        <div key={i} className={`${CARD_CLASS} flex h-48 flex-col`}>
          <Bar className="h-4 w-32" />
          <Bar className="mt-4 h-3 w-full" />
          <Bar className="mt-2 h-3 w-5/6" />
          <Bar className="mt-2 h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}
