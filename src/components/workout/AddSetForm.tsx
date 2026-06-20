'use client';

import ExercisePicker from '@/components/workout/ExercisePicker';
import { interpolate } from '@/i18n/format';
import type { Dictionary } from '@/i18n/getDictionary';
import { createSet, type CreateSetFormState } from '@/lib/workout/actions';
import { useActionState, useRef, useState } from 'react';
import type { components } from '../../../gen/exercise/v1/exercise.schema';

type Exercise = components['schemas']['v1Exercise'];

const initialState: CreateSetFormState = {};

function toDatetimeLocalInputValue(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export default function AddSetForm({
  workoutId,
  exercises,
  disabled,
  dict,
  kgUnit,
  prLabels,
}: {
  workoutId: string;
  exercises: Exercise[];
  disabled: boolean;
  dict: Dictionary['addSet'];
  kgUnit: string;
  prLabels: { weight: string; volume: string };
}) {
  const [selectedExerciseId, setSelectedExerciseId] = useState(exercises[0]?.exerciseId ?? '');
  const [showPr, setShowPr] = useState(false);
  const trainedAtRef = useRef<HTMLInputElement>(null);
  const effectiveExerciseId =
    selectedExerciseId && exercises.some((exercise) => exercise.exerciseId === selectedExerciseId)
      ? selectedExerciseId
      : (exercises[0]?.exerciseId ?? '');

  const boundAction = createSet.bind(null, workoutId);
  const wrappedAction = async (prev: CreateSetFormState, formData: FormData) => {
    const raw = String(formData.get('trainedAt') ?? '');
    if (raw) {
      const local = new Date(raw);
      if (!Number.isNaN(local.getTime())) {
        formData.set('trainedAt', local.toISOString());
      }
    }
    const result = await boundAction(prev, formData);
    setShowPr(!!result.pr && (result.pr.weight || result.pr.volume));
    return result;
  };
  const [state, formAction, isPending] = useActionState(wrappedAction, initialState);

  return (
    <form action={formAction} onChange={() => setShowPr(false)} className="flex flex-col gap-3">
      <fieldset disabled={disabled}>
        <legend className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {dict.exercise}
        </legend>
        <input type="hidden" name="exerciseId" value={effectiveExerciseId} />
        {exercises.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{dict.noExercises}</p>
        ) : (
          <ExercisePicker
            exercises={exercises}
            value={effectiveExerciseId}
            onChange={(exerciseId) => {
              setSelectedExerciseId(exerciseId);
              setShowPr(false);
            }}
            disabled={disabled}
            dict={dict}
          />
        )}
        {state.fieldErrorKeys?.exerciseId && (
          <p className="mt-1 text-sm text-rose-500">
            {dict.errors[state.fieldErrorKeys.exerciseId]}
          </p>
        )}
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="rep"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {dict.reps}
          </label>
          <input
            id="rep"
            name="rep"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            required
            disabled={disabled}
            defaultValue={state.values?.rep}
            className="w-full rounded-lg border border-black/[.08] bg-white px-3 py-2 text-base text-zinc-900 outline-none focus:border-zinc-400 disabled:opacity-50 sm:text-sm dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50"
          />
          {state.fieldErrorKeys?.rep && (
            <p className="mt-1 text-sm text-rose-500">{dict.errors[state.fieldErrorKeys.rep]}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="weight"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {interpolate(dict.weight, { unit: kgUnit })}
          </label>
          <input
            id="weight"
            name="weight"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            required
            disabled={disabled}
            defaultValue={state.values?.weight}
            className="w-full rounded-lg border border-black/[.08] bg-white px-3 py-2 text-base text-zinc-900 outline-none focus:border-zinc-400 disabled:opacity-50 sm:text-sm dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50"
          />
          {state.fieldErrorKeys?.weight && (
            <p className="mt-1 text-sm text-rose-500">{dict.errors[state.fieldErrorKeys.weight]}</p>
          )}
        </div>
      </div>

      <details
        {...(state.fieldErrorKeys?.trainedAt ? { open: true } : {})}
        onToggle={(event) => {
          if (!event.currentTarget.open) return;
          const input = trainedAtRef.current;
          if (input && !input.value) {
            input.value = toDatetimeLocalInputValue(new Date());
          }
        }}
      >
        <summary className="cursor-pointer list-none text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
          {dict.trainedAtToggle}
        </summary>
        <div className="mt-2">
          <label
            htmlFor="trainedAt"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {dict.trainedAt}
          </label>
          <input
            ref={trainedAtRef}
            id="trainedAt"
            name="trainedAt"
            type="datetime-local"
            disabled={disabled}
            className="w-full rounded-lg border border-black/[.08] bg-white px-3 py-2 text-base text-zinc-900 outline-none focus:border-zinc-400 disabled:opacity-50 sm:text-sm dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50"
          />
          {state.fieldErrorKeys?.trainedAt && (
            <p className="mt-1 text-sm text-rose-500">
              {dict.errors[state.fieldErrorKeys.trainedAt]}
            </p>
          )}
        </div>
      </details>

      <button
        type="submit"
        disabled={disabled || isPending || !effectiveExerciseId}
        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 sm:w-auto sm:self-start dark:hover:bg-[#ccc]"
      >
        {isPending ? dict.submitting : dict.submit}
      </button>

      {state.errorKey && <p className="text-sm text-rose-500">{dict.errors[state.errorKey]}</p>}

      {showPr && state.pr && (state.pr.weight || state.pr.volume) && (
        <p
          role="status"
          aria-live="polite"
          className="flex flex-wrap items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
        >
          <span>{dict.prBanner}</span>
          {state.pr.weight && (
            <span role="img" aria-label={prLabels.weight} title={prLabels.weight}>
              👑
            </span>
          )}
          {state.pr.volume && (
            <span role="img" aria-label={prLabels.volume} title={prLabels.volume}>
              💪
            </span>
          )}
        </p>
      )}
    </form>
  );
}
