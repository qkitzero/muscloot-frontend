'use client';

import ExerciseImage from '@/components/ExerciseImage';
import { interpolate } from '@/i18n/format';
import type { Dictionary } from '@/i18n/getDictionary';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { components } from '../../../gen/exercise/v1/exercise.schema';

type Exercise = components['schemas']['v1Exercise'];

type Dict = Dictionary['addSet'];

const MUSCLE_GROUP_ORDER = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'] as const;

function exerciseLabel(exercise: Exercise): string {
  return exercise.name ?? exercise.code ?? exercise.exerciseId ?? '';
}

function primaryMuscleCode(exercise: Exercise): string {
  let best: { code: string; ratio: number } | undefined;
  for (const contribution of exercise.muscles ?? []) {
    const code = contribution.muscle?.code;
    if (!code) continue;
    const ratio = contribution.ratio ?? 0;
    if (!best || ratio > best.ratio) best = { code, ratio };
  }
  return best?.code ?? '';
}

function muscleGroupLabel(dict: Dict, code: string): string {
  if (!code) return dict.uncategorized;
  const groups = dict.muscleGroups as Record<string, string | undefined>;
  return groups[code] ?? code;
}

function typeLabel(dict: Dict, category: string | undefined): string | undefined {
  if (!category) return undefined;
  const types = dict.types as Record<string, string | undefined>;
  return types[category] ?? category;
}

type Group = { key: string; label: string; exercises: Exercise[] };

function groupByMuscle(dict: Dict, exercises: Exercise[]): Group[] {
  const byMuscle = new Map<string, Exercise[]>();
  for (const exercise of exercises) {
    const code = primaryMuscleCode(exercise);
    const bucket = byMuscle.get(code);
    if (bucket) bucket.push(exercise);
    else byMuscle.set(code, [exercise]);
  }

  const order = (code: string): number => {
    if (code === '') return MUSCLE_GROUP_ORDER.length + 1;
    const index = (MUSCLE_GROUP_ORDER as readonly string[]).indexOf(code);
    return index === -1 ? MUSCLE_GROUP_ORDER.length : index;
  };

  return [...byMuscle.entries()]
    .sort(([a], [b]) => order(a) - order(b) || (a < b ? -1 : a > b ? 1 : 0))
    .map(([code, items]) => ({
      key: code || 'uncategorized',
      label: muscleGroupLabel(dict, code),
      exercises: items,
    }));
}

export default function ExercisePicker({
  exercises,
  value,
  onChange,
  disabled,
  dict,
}: {
  exercises: Exercise[];
  value: string;
  onChange: (exerciseId: string) => void;
  disabled: boolean;
  dict: Dict;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = exercises.find((exercise) => exercise.exerciseId === value);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return exercises;
    return exercises.filter((exercise) => {
      const haystack = `${exercise.name ?? ''} ${exercise.code ?? ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [exercises, query]);

  const groups = useMemo(() => groupByMuscle(dict, filtered), [dict, filtered]);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const select = (exerciseId: string) => {
    onChange(exerciseId);
    close();
  };

  const submitSearch = () => {
    const first = filtered[0]?.exerciseId;
    if (first) select(first);
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-lg border border-black/[.08] bg-white px-3 py-2 text-left outline-none focus:border-zinc-400 disabled:opacity-50 dark:border-white/[.145] dark:bg-zinc-950"
      >
        <ExerciseImage
          code={selected?.code}
          name={selected?.name ?? selected?.code}
          className="h-12 w-12 shrink-0"
        />
        <span className="min-w-0 flex-1">
          {selected ? (
            <>
              <span className="block truncate text-base text-zinc-900 sm:text-sm dark:text-zinc-50">
                {exerciseLabel(selected)}
              </span>
              <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                {[
                  muscleGroupLabel(dict, primaryMuscleCode(selected)),
                  typeLabel(dict, selected.category),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </>
          ) : (
            <span className="block truncate text-base text-zinc-500 sm:text-sm dark:text-zinc-400">
              {dict.selectPrompt}
            </span>
          )}
        </span>
        <span className="shrink-0 rounded-full border border-black/[.08] px-3 py-1 text-xs font-medium text-zinc-600 dark:border-white/[.145] dark:text-zinc-300">
          {dict.change}
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={dict.selectPrompt}
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={close}
            aria-hidden
          />
          <div className="relative flex max-h-[85vh] w-full flex-col rounded-t-2xl border border-black/[.08] bg-white shadow-xl sm:max-h-[80vh] sm:w-[28rem] sm:rounded-2xl dark:border-white/[.145] dark:bg-zinc-900">
            <div className="flex items-center justify-between gap-3 border-b border-black/[.06] px-4 py-3 dark:border-white/[.1]">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {dict.selectPrompt}
              </h3>
              <button
                type="button"
                onClick={close}
                aria-label={dict.close}
                className="-mr-1 flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-black/[.04] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[.06] dark:hover:text-zinc-50"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                >
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="px-4 py-3">
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    submitSearch();
                  }
                }}
                placeholder={dict.searchPlaceholder}
                aria-label={dict.searchPlaceholder}
                className="w-full rounded-lg border border-black/[.08] bg-white px-3 py-2.5 text-base text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50"
              />
              <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                {interpolate(dict.resultCount, { count: filtered.length })}
              </p>
            </div>

            <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-3">
              {filtered.length === 0 ? (
                <li className="px-3 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  {dict.noResults}
                </li>
              ) : (
                groups.map((group) => (
                  <li key={group.key}>
                    <p className="sticky top-0 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:bg-zinc-900 dark:text-zinc-500">
                      {group.label}
                    </p>
                    <ul>
                      {group.exercises.map((exercise) => {
                        const id = exercise.exerciseId ?? '';
                        const isSelected = id === value;
                        const type = typeLabel(dict, exercise.category);
                        return (
                          <li key={id || exercise.code}>
                            <button
                              type="button"
                              aria-current={isSelected || undefined}
                              disabled={!id}
                              onClick={() => select(id)}
                              className={`flex min-h-[52px] w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800 ${
                                isSelected
                                  ? 'bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                                  : 'text-zinc-700 dark:text-zinc-300'
                              }`}
                            >
                              <ExerciseImage
                                code={exercise.code}
                                name={exercise.name ?? exercise.code}
                                className="h-10 w-10 shrink-0"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate">{exerciseLabel(exercise)}</span>
                                {type && (
                                  <span className="block truncate text-xs text-zinc-400 dark:text-zinc-500">
                                    {type}
                                  </span>
                                )}
                              </span>
                              {isSelected && (
                                <span
                                  aria-hidden
                                  className="shrink-0 text-zinc-500 dark:text-zinc-400"
                                >
                                  ✓
                                </span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
