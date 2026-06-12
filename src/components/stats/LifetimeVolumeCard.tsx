import type { Locale } from '@/i18n/config';
import { formatNumber, translate } from '@/i18n/format';
import type { Dictionary } from '@/i18n/getDictionary';
import { pickComparison } from '@/lib/workout/comparisons';

type Props = {
  total: number;
  lang: Locale;
  dict: Dictionary['stats']['lifetimeVolume'];
};

export default function LifetimeVolumeCard({ total, lang, dict }: Props) {
  const rounded = Math.round(total);
  const comparison = pickComparison(rounded);
  const comparisonText = comparison
    ? translate(lang, dict.comparisons[comparison.key], { count: comparison.count })
    : null;

  return (
    <section className="rounded-2xl border border-black/[.08] bg-white p-5 sm:p-6 dark:border-white/[.145] dark:bg-zinc-900">
      <h2 className="text-base font-semibold text-zinc-900 sm:text-lg dark:text-zinc-50">
        {dict.heading}
      </h2>
      <p className="mt-3 flex items-baseline gap-1.5">
        <span className="text-3xl font-bold tabular-nums text-zinc-900 sm:text-4xl dark:text-zinc-50">
          {formatNumber(lang, rounded)}
        </span>
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{dict.unit}</span>
      </p>
      {comparisonText && (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {translate(lang, dict.comparison, { value: comparisonText })}
        </p>
      )}
    </section>
  );
}
