import type { DailyCount } from './aggregate';

type Props = {
  data: DailyCount[];
};

const CELL_SIZE = 12;
const CELL_GAP = 3;
const PADDING_LEFT = 28;
const PADDING_TOP = 18;

function colorForCount(count: number, max: number): string {
  if (count === 0 || max === 0) {
    return 'fill-zinc-200 dark:fill-zinc-800';
  }
  const ratio = count / max;
  if (ratio < 0.34) return 'fill-emerald-300 dark:fill-emerald-900';
  if (ratio < 0.67) return 'fill-emerald-500 dark:fill-emerald-700';
  return 'fill-emerald-600 dark:fill-emerald-500';
}

export default function ActivityHeatmap({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">No workout activity yet.</p>
    );
  }

  const weeks: DailyCount[][] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  const max = data.reduce((acc, d) => Math.max(acc, d.count), 0);
  const width = PADDING_LEFT + weeks.length * (CELL_SIZE + CELL_GAP);
  const height = PADDING_TOP + 7 * (CELL_SIZE + CELL_GAP);

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  // Month labels: show the month name above the first column of each new month.
  type MonthLabel = { x: number; label: string };
  const monthLabels: MonthLabel[] = [];
  let lastMonth = -1;
  weeks.forEach((week, weekIndex) => {
    const firstDay = week[0];
    if (!firstDay) return;
    const monthIndex = new Date(firstDay.date).getMonth();
    if (monthIndex !== lastMonth) {
      monthLabels.push({
        x: PADDING_LEFT + weekIndex * (CELL_SIZE + CELL_GAP),
        label: new Date(firstDay.date).toLocaleString(undefined, { month: 'short' }),
      });
      lastMonth = monthIndex;
    }
  });

  const totalWorkouts = data.reduce((acc, d) => acc + d.count, 0);
  const activeDays = data.reduce((acc, d) => (d.count > 0 ? acc + 1 : acc), 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-sm">
        <p className="text-zinc-700 dark:text-zinc-300">
          {totalWorkouts} workouts on {activeDays} days (last {weeks.length} weeks)
        </p>
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>Less</span>
          <span className="block size-3 rounded-sm bg-zinc-200 dark:bg-zinc-800" />
          <span className="block size-3 rounded-sm bg-emerald-300 dark:bg-emerald-900" />
          <span className="block size-3 rounded-sm bg-emerald-500 dark:bg-emerald-700" />
          <span className="block size-3 rounded-sm bg-emerald-600 dark:bg-emerald-500" />
          <span>More</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Workout activity heatmap"
        >
          {monthLabels.map((m) => (
            <text
              key={`${m.label}-${m.x}`}
              x={m.x}
              y={12}
              className="fill-zinc-500 text-[10px] dark:fill-zinc-400"
            >
              {m.label}
            </text>
          ))}
          {dayLabels.map((label, index) =>
            label ? (
              <text
                key={label}
                x={0}
                y={PADDING_TOP + index * (CELL_SIZE + CELL_GAP) + CELL_SIZE - 2}
                className="fill-zinc-500 text-[10px] dark:fill-zinc-400"
              >
                {label}
              </text>
            ) : null,
          )}
          {weeks.map((week, weekIndex) =>
            week.map((day, dayIndex) => (
              <rect
                key={day.date}
                x={PADDING_LEFT + weekIndex * (CELL_SIZE + CELL_GAP)}
                y={PADDING_TOP + dayIndex * (CELL_SIZE + CELL_GAP)}
                width={CELL_SIZE}
                height={CELL_SIZE}
                rx={2}
                ry={2}
                className={colorForCount(day.count, max)}
              >
                <title>{`${day.date}: ${day.count} workout${day.count === 1 ? '' : 's'}`}</title>
              </rect>
            )),
          )}
        </svg>
      </div>
    </div>
  );
}
