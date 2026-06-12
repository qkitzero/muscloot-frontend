import type { Locale } from '@/i18n/config';
import { formatNumber, translate } from '@/i18n/format';
import type { Dictionary } from '@/i18n/getDictionary';
import type { MilestoneAxis, MilestoneProgress } from '@/lib/workout/aggregate';

const AXIS_ICONS: Record<MilestoneAxis, string> = {
  workoutCount: '🏋️',
  totalSets: '🔁',
  totalVolume: '⚖️',
  maxWeight: '💪',
  streakDays: '🔥',
};

type Props = {
  progress: MilestoneProgress[];
  lang: Locale;
  dict: Dictionary['stats']['badges'];
};

export default function BadgeCollection({ progress, lang, dict }: Props) {
  const unlockedCount = progress.filter((entry) => entry.unlocked).length;

  const templateValues = (entry: MilestoneProgress) => ({
    threshold:
      entry.axis === 'workoutCount' ? entry.threshold : formatNumber(lang, entry.threshold),
    current: formatNumber(lang, Math.round(entry.current)),
  });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {translate(lang, dict.unlockedSummary, {
          unlocked: unlockedCount,
          total: progress.length,
        })}
      </p>

      <ul className="grid max-h-72 grid-cols-3 gap-3 overflow-y-auto pr-1 sm:grid-cols-5">
        {progress.map((entry) => {
          const values = templateValues(entry);
          const name = translate(lang, dict.axes[entry.axis].name, values);
          const description = translate(lang, dict.axes[entry.axis].description, values);
          return (
            <li
              key={`${entry.axis}-${entry.threshold}`}
              title={description}
              className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center ${
                entry.unlocked
                  ? 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30'
                  : 'border-black/[.08] bg-zinc-50 opacity-60 grayscale dark:border-white/[.145] dark:bg-zinc-950'
              }`}
            >
              <span className="text-2xl" aria-hidden>
                {entry.unlocked ? AXIS_ICONS[entry.axis] : '🔒'}
              </span>
              <span className="text-xs font-medium text-zinc-900 dark:text-zinc-50">
                {!entry.unlocked && <span className="sr-only">{dict.lockedLabel}: </span>}
                {name}
              </span>
              {!entry.unlocked && (
                <span className="text-[10px] tabular-nums text-zinc-500 dark:text-zinc-400">
                  {translate(lang, dict.axes[entry.axis].progress, values)}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
