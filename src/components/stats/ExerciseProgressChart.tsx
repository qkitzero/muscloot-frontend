'use client';

import FormattedDateTime from '@/components/FormattedDateTime';
import type { Locale } from '@/i18n/config';
import { translate } from '@/i18n/format';
import type { Dictionary } from '@/i18n/getDictionary';
import Link from 'next/link';
import { useState } from 'react';
import {
  type ExerciseProgression,
  PROGRESSION_METRICS,
  type ProgressionMetric,
  type ProgressionPoint,
} from '@/lib/workout/aggregate';

type Dict = Dictionary['stats']['progression'];

type Props = {
  series: ExerciseProgression[];
  lang: Locale;
  dict: Dict;
};

const CHART_HEIGHT = 180;
const PADDING_LEFT = 40;
const PADDING_TOP = 12;
const PADDING_BOTTOM = 28;
const PADDING_INNER = 20;
const POINT_GAP = 56;
const POINT_RADIUS = 3.5;

function metricValue(point: ProgressionPoint, metric: ProgressionMetric): number {
  return metric === 'maxWeight' ? point.maxWeight : point.volume;
}

function formatValue(value: number, metric: ProgressionMetric): string {
  if (metric === 'volume') {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return String(Math.round(value));
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export default function ExerciseProgressChart({ series, lang, dict }: Props) {
  const [selectedExerciseId, setSelectedExerciseId] = useState(series[0]?.exerciseId ?? '');
  const [metric, setMetric] = useState<ProgressionMetric>('maxWeight');

  if (series.length === 0) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">{dict.empty}</p>;
  }

  const selected = series.find((s) => s.exerciseId === selectedExerciseId) ?? series[0];
  const points = selected.points;
  const unit = dict.units[metric];

  const max = points.reduce((acc, p) => Math.max(acc, metricValue(p, metric)), 0);
  const safeMax = max === 0 ? 1 : max;
  const chartWidth = PADDING_LEFT + PADDING_INNER * 2 + Math.max(points.length - 1, 0) * POINT_GAP;
  const totalHeight = PADDING_TOP + CHART_HEIGHT + PADDING_BOTTOM;
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  const x = (index: number) => PADDING_LEFT + PADDING_INNER + index * POINT_GAP;
  const y = (value: number) => PADDING_TOP + CHART_HEIGHT * (1 - value / safeMax);

  const dateFormatter = new Intl.DateTimeFormat(lang, { month: 'numeric', day: 'numeric' });
  const polylinePoints = points.map((p, i) => `${x(i)},${y(metricValue(p, metric))}`).join(' ');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <span className="sr-only">{dict.selectLabel}</span>
          <select
            value={selected.exerciseId}
            onChange={(e) => setSelectedExerciseId(e.target.value)}
            aria-label={dict.selectLabel}
            className="rounded-lg border border-black/[.08] bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-white/[.145] dark:bg-zinc-800 dark:text-zinc-50"
          >
            {series.map((s) => (
              <option key={s.exerciseId} value={s.exerciseId}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <div
          role="tablist"
          aria-label={dict.metricLabel}
          className="flex gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-800"
        >
          {PROGRESSION_METRICS.map((value) => {
            const active = value === metric;
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMetric(value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
                }`}
              >
                {dict.metrics[value]}
              </button>
            );
          })}
        </div>
      </div>

      {points.length < 2 && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{dict.sparse}</p>
      )}

      <div className="overflow-x-auto">
        <svg
          width={chartWidth}
          height={totalHeight}
          viewBox={`0 0 ${chartWidth} ${totalHeight}`}
          role="img"
          aria-label={translate(lang, dict.ariaLabel, {
            exercise: selected.name,
            metric: dict.metrics[metric],
          })}
        >
          {gridLines.map((ratio) => {
            const gy = PADDING_TOP + CHART_HEIGHT * (1 - ratio);
            return (
              <g key={ratio}>
                <line
                  x1={PADDING_LEFT}
                  x2={chartWidth}
                  y1={gy}
                  y2={gy}
                  className="stroke-zinc-200 dark:stroke-zinc-800"
                  strokeDasharray={ratio === 0 ? undefined : '2 3'}
                />
                <text
                  x={PADDING_LEFT - 6}
                  y={gy + 3}
                  textAnchor="end"
                  className="fill-zinc-500 text-[10px] dark:fill-zinc-400"
                >
                  {formatValue(safeMax * ratio, metric)}
                </text>
              </g>
            );
          })}

          {points.length >= 2 && (
            <polyline
              points={polylinePoints}
              fill="none"
              className="stroke-emerald-500 dark:stroke-emerald-500"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {points.map((point, index) => {
            const value = metricValue(point, metric);
            return (
              <g key={point.workoutId}>
                <circle
                  cx={x(index)}
                  cy={y(value)}
                  r={POINT_RADIUS}
                  className="fill-emerald-500 dark:fill-emerald-500"
                >
                  <title>
                    {translate(lang, dict.tooltip, {
                      date: dateFormatter.format(new Date(point.date)),
                      value: formatValue(value, metric),
                      unit,
                    })}
                  </title>
                </circle>
                <text
                  x={x(index)}
                  y={PADDING_TOP + CHART_HEIGHT + 16}
                  textAnchor="middle"
                  className="fill-zinc-500 text-[10px] dark:fill-zinc-400"
                >
                  {dateFormatter.format(new Date(point.date))}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <ul className="flex flex-col divide-y divide-black/[.06] text-sm dark:divide-white/[.08]">
        {points
          .slice()
          .reverse()
          .map((point) => (
            <li key={point.workoutId} className="flex items-center justify-between gap-3 py-2">
              <Link
                href={`/${lang}/workouts/${point.workoutId}`}
                className="text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
              >
                <FormattedDateTime value={point.date} lang={lang} />
              </Link>
              <span className="text-zinc-900 tabular-nums dark:text-zinc-50">
                {formatValue(metricValue(point, metric), metric)}{' '}
                <span className="text-xs text-zinc-500">{unit}</span>
              </span>
            </li>
          ))}
      </ul>
    </div>
  );
}
