'use client';

import type { Locale } from '@/i18n/config';
import { translate } from '@/i18n/format';
import type { Dictionary } from '@/i18n/getDictionary';
import { useState } from 'react';
import {
  MUSCLE_BALANCE_PERIODS,
  MUSCLE_CODES,
  type MuscleBalanceByPeriod,
  type MuscleBalancePeriod,
  type MuscleCode,
  type MuscleVolume,
} from './aggregate';
import {
  type BodyView,
  MAX_SCALE,
  MIN_SCALE,
  VIEWBOX_HEIGHT,
  VIEWBOX_WIDTH,
  musclesForView,
} from './bodyShapes';

type Dict = Dictionary['stats']['muscleBalance'];

type Props = {
  byPeriod: MuscleBalanceByPeriod;
  lang: Locale;
  dict: Dict;
};

function formatVolume(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return String(Math.round(value));
}

function BaseFigure({ view }: { view: BodyView }) {
  return (
    <g className="fill-zinc-200 dark:fill-zinc-800">
      <circle cx={60} cy={20} r={12} />
      {view === 'front' && (
        <g className="fill-zinc-400 dark:fill-zinc-500">
          <circle cx={56} cy={18} r={1.6} />
          <circle cx={64} cy={18} r={1.6} />
        </g>
      )}
      <rect x={55} y={29} width={10} height={9} rx={3} />
      <path d="M40 42 Q60 36 80 42 L74 110 Q60 116 46 110 Z" />
      <rect x={20} y={46} width={14} height={68} rx={7} />
      <rect x={86} y={46} width={14} height={68} rx={7} />
      <rect x={44} y={108} width={14} height={100} rx={7} />
      <rect x={62} y={108} width={14} height={100} rx={7} />
    </g>
  );
}

function BodyFigure({
  view,
  label,
  intensityByCode,
  volumeByCode,
  dict,
  lang,
}: {
  view: BodyView;
  label: string;
  intensityByCode: Map<MuscleCode, number>;
  volumeByCode: Map<MuscleCode, number>;
  dict: Dict;
  lang: Locale;
}) {
  const muscles = musclesForView(view);

  return (
    <figure className="flex flex-col items-center gap-2">
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        className="h-auto w-full max-w-[180px]"
        role="img"
        aria-label={label}
      >
        <BaseFigure view={view} />
        {MUSCLE_CODES.map((code) => {
          const shapes = muscles[code];
          if (shapes.length === 0) return null;
          const intensity = intensityByCode.get(code) ?? 0;
          const volume = volumeByCode.get(code) ?? 0;
          const trained = volume > 0;
          const scale = MIN_SCALE + intensity * (MAX_SCALE - MIN_SCALE);
          const muscleName = dict.muscles[code];
          const tooltip = trained
            ? translate(lang, dict.tooltip, {
                muscle: muscleName,
                value: formatVolume(volume),
                unit: dict.unit,
              })
            : translate(lang, dict.untrainedTooltip, { muscle: muscleName });
          return (
            <g
              key={code}
              className={
                trained
                  ? 'fill-emerald-500 dark:fill-emerald-500'
                  : 'fill-zinc-300 stroke-zinc-400 dark:fill-zinc-700 dark:stroke-zinc-600'
              }
              style={trained ? { opacity: 0.45 + intensity * 0.55 } : { opacity: 0.6 }}
            >
              <title>{tooltip}</title>
              {shapes.map((shape, index) => (
                <ellipse
                  key={index}
                  cx={shape.cx}
                  cy={shape.cy}
                  rx={shape.rx}
                  ry={shape.ry}
                  strokeDasharray={trained ? undefined : '2 2'}
                  strokeWidth={trained ? 0 : 1}
                  transform={`translate(${shape.cx} ${shape.cy}) scale(${scale}) translate(${-shape.cx} ${-shape.cy})`}
                />
              ))}
            </g>
          );
        })}
      </svg>
      <figcaption className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </figcaption>
    </figure>
  );
}

function BalanceView({ data, lang, dict }: { data: MuscleVolume[]; lang: Locale; dict: Dict }) {
  const max = data.reduce((acc, d) => Math.max(acc, d.volume), 0);

  if (max === 0) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">{dict.empty}</p>;
  }

  const intensityByCode = new Map<MuscleCode, number>(data.map((d) => [d.code, d.volume / max]));
  const volumeByCode = new Map<MuscleCode, number>(data.map((d) => [d.code, d.volume]));
  const untrained = MUSCLE_CODES.filter((code) => (volumeByCode.get(code) ?? 0) === 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4" role="img" aria-label={dict.ariaLabel}>
        <BodyFigure
          view="front"
          label={dict.frontLabel}
          intensityByCode={intensityByCode}
          volumeByCode={volumeByCode}
          dict={dict}
          lang={lang}
        />
        <BodyFigure
          view="back"
          label={dict.backLabel}
          intensityByCode={intensityByCode}
          volumeByCode={volumeByCode}
          dict={dict}
          lang={lang}
        />
      </div>
      <ul className="flex flex-col divide-y divide-black/[.06] text-sm dark:divide-white/[.08]">
        {MUSCLE_CODES.map((code) => {
          const volume = volumeByCode.get(code) ?? 0;
          return (
            <li key={code} className="flex items-center justify-between gap-3 py-2">
              <span className="text-zinc-700 dark:text-zinc-300">{dict.muscles[code]}</span>
              <span className="text-zinc-900 tabular-nums dark:text-zinc-50">
                {formatVolume(volume)} <span className="text-xs text-zinc-500">{dict.unit}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {untrained.length === 0
          ? dict.allTrained
          : translate(lang, dict.untrainedHint, {
              muscles: untrained
                .map((code) => dict.muscles[code])
                .join(lang === 'ja' ? '、' : ', '),
            })}
      </p>
    </div>
  );
}

export default function BodyMap({ byPeriod, lang, dict }: Props) {
  const [period, setPeriod] = useState<MuscleBalancePeriod>('all');

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label={dict.ariaLabel}
        className="flex gap-1 self-start rounded-full bg-zinc-100 p-1 dark:bg-zinc-800"
      >
        {MUSCLE_BALANCE_PERIODS.map((value) => {
          const selected = value === period;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setPeriod(value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selected
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
              }`}
            >
              {dict.periods[value]}
            </button>
          );
        })}
      </div>
      <BalanceView data={byPeriod[period]} lang={lang} dict={dict} />
    </div>
  );
}
