import FormattedDateTime from '@/components/FormattedDateTime';
import Link from 'next/link';
import type { WorkoutVolume } from './aggregate';

type Props = {
  data: WorkoutVolume[];
};

const CHART_HEIGHT = 180;
const BAR_WIDTH = 18;
const BAR_GAP = 8;
const PADDING_LEFT = 40;
const PADDING_TOP = 12;
const PADDING_BOTTOM = 20;

function formatVolume(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return String(Math.round(value));
}

export default function VolumeChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No sets recorded yet — once you log sets, your volume will show up here.
      </p>
    );
  }

  const max = data.reduce((acc, d) => Math.max(acc, d.volume), 0);
  const safeMax = max === 0 ? 1 : max;
  const chartWidth = PADDING_LEFT + data.length * (BAR_WIDTH + BAR_GAP);
  const totalHeight = PADDING_TOP + CHART_HEIGHT + PADDING_BOTTOM;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto">
        <svg
          width={chartWidth}
          height={totalHeight}
          viewBox={`0 0 ${chartWidth} ${totalHeight}`}
          role="img"
          aria-label="Volume per workout"
        >
          {gridLines.map((ratio) => {
            const y = PADDING_TOP + CHART_HEIGHT * (1 - ratio);
            const value = safeMax * ratio;
            return (
              <g key={ratio}>
                <line
                  x1={PADDING_LEFT}
                  x2={chartWidth}
                  y1={y}
                  y2={y}
                  className="stroke-zinc-200 dark:stroke-zinc-800"
                  strokeDasharray={ratio === 0 ? undefined : '2 3'}
                />
                <text
                  x={PADDING_LEFT - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-zinc-500 text-[10px] dark:fill-zinc-400"
                >
                  {formatVolume(value)}
                </text>
              </g>
            );
          })}
          {data.map((entry, index) => {
            const ratio = entry.volume / safeMax;
            const barHeight = CHART_HEIGHT * ratio;
            const x = PADDING_LEFT + index * (BAR_WIDTH + BAR_GAP);
            const y = PADDING_TOP + CHART_HEIGHT - barHeight;
            return (
              <rect
                key={entry.workoutId}
                x={x}
                y={y}
                width={BAR_WIDTH}
                height={Math.max(barHeight, entry.volume > 0 ? 2 : 0)}
                rx={2}
                ry={2}
                className="fill-emerald-500 dark:fill-emerald-500"
              >
                <title>{`${entry.startedAt} — ${formatVolume(entry.volume)} (rep × kg)`}</title>
              </rect>
            );
          })}
        </svg>
      </div>
      <ul className="flex flex-col divide-y divide-black/[.06] text-sm dark:divide-white/[.08]">
        {data
          .slice()
          .reverse()
          .map((entry) => (
            <li key={entry.workoutId} className="flex items-center justify-between gap-3 py-2">
              <Link
                href={`/workouts/${entry.workoutId}`}
                className="text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
              >
                <FormattedDateTime value={entry.startedAt} />
              </Link>
              <span className="text-zinc-900 dark:text-zinc-50">
                {formatVolume(entry.volume)} <span className="text-xs text-zinc-500">rep × kg</span>
              </span>
            </li>
          ))}
      </ul>
    </div>
  );
}
