import type { Locale } from '@/i18n/config';
import { formatNumber, translate } from '@/i18n/format';
import type { Dictionary } from '@/i18n/getDictionary';
import type { MilestoneAxis, MilestoneProgress } from './aggregate';

const AXIS_ICONS: Record<MilestoneAxis, string> = {
  workoutCount: '🏋️',
  totalSets: '🔁',
  totalVolume: '⚖️',
  maxWeight: '💪',
  streakDays: '🔥',
};

type Props = {
  progress: MilestoneProgress[];
  next: MilestoneProgress | null;
  lang: Locale;
  dict: Dictionary['stats']['badges'];
};

export default function BadgeCollection({ progress, next, lang, dict }: Props) {
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

      {next ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {dict.nextHeading}: {translate(lang, dict.axes[next.axis].name, templateValues(next))}
            </p>
            <p className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
              {translate(lang, dict.axes[next.axis].progress, templateValues(next))}
            </p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${Math.round(next.ratio * 100)}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">{dict.allUnlocked}</p>
      )}

      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
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
              <span className="text-xs font-medium text-zinc-900 dark:text-zinc-50">{name}</span>
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
