'use client';

import ExerciseImage from '@/components/ExerciseImage';
import { interpolate } from '@/i18n/format';
import type { Dictionary } from '@/i18n/getDictionary';
import { useActionState, useState, useSyncExternalStore } from 'react';
import type { components } from '../../../../../../gen/exercise/v1/exercise.schema';
import { createSet, type CreateSetFormState } from './actions';

type Exercise = components['schemas']['v1Exercise'];

const initialState: CreateSetFormState = {};
const noopSubscribe = () => () => {};
const emptyDefault = () => '';

function toDatetimeLocalInputValue(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

let cachedClientNow: string | undefined;
const getClientNow = () => {
  if (cachedClientNow === undefined) {
    cachedClientNow = toDatetimeLocalInputValue(new Date());
  }
  return cachedClientNow;
};

export default function AddSetForm({
  workoutId,
  exercises,
  disabled,
  dict,
  kgUnit,
}: {
  workoutId: string;
  exercises: Exercise[];
  disabled: boolean;
  dict: Dictionary['addSet'];
  kgUnit: string;
}) {
  const [selectedExerciseId, setSelectedExerciseId] = useState('');

  const boundAction = createSet.bind(null, workoutId);
  const wrappedAction = (prev: CreateSetFormState, formData: FormData) => {
    const raw = String(formData.get('trainedAt') ?? '');
    if (raw) {
      const local = new Date(raw);
      if (!Number.isNaN(local.getTime())) {
        formData.set('trainedAt', local.toISOString());
      }
    }
    return boundAction(prev, formData);
  };
  const [state, formAction, isPending] = useActionState(wrappedAction, initialState);

  const defaultTrainedAt = useSyncExternalStore(noopSubscribe, getClientNow, emptyDefault);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <fieldset disabled={disabled}>
        <legend className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {dict.exercise}
        </legend>
        <input type="hidden" name="exerciseId" value={selectedExerciseId} />
        {exercises.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{dict.noExercises}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {exercises.map((exercise) => {
              const id = exercise.exerciseId ?? '';
              const isSelected = id !== '' && selectedExerciseId === id;
              return (
                <li key={id || exercise.code}>
                  <button
                    type="button"
                    onClick={() => setSelectedExerciseId(id)}
                    disabled={!id}
                    aria-pressed={isSelected}
                    className={`flex w-full flex-col items-center gap-1 rounded-xl border p-2 text-center transition-colors disabled:opacity-50 ${
                      isSelected
                        ? 'border-foreground bg-zinc-100 dark:border-zinc-200 dark:bg-zinc-800'
                        : 'border-black/[.08] bg-white hover:bg-zinc-50 dark:border-white/[.145] dark:bg-zinc-950 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <ExerciseImage
                      code={exercise.code}
                      name={exercise.name ?? exercise.code}
                      className="h-14 w-14 sm:h-16 sm:w-16"
                    />
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {exercise.name ?? exercise.code ?? id}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
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
            step="0.5"
            required
            disabled={disabled}
            className="w-full rounded-lg border border-black/[.08] bg-white px-3 py-2 text-base text-zinc-900 outline-none focus:border-zinc-400 disabled:opacity-50 sm:text-sm dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50"
          />
          {state.fieldErrorKeys?.weight && (
            <p className="mt-1 text-sm text-rose-500">
              {dict.errors[state.fieldErrorKeys.weight]}
            </p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="trainedAt"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {dict.trainedAt}
        </label>
        <input
          key={defaultTrainedAt}
          id="trainedAt"
          name="trainedAt"
          type="datetime-local"
          required
          disabled={disabled}
          defaultValue={defaultTrainedAt}
          className="w-full rounded-lg border border-black/[.08] bg-white px-3 py-2 text-base text-zinc-900 outline-none focus:border-zinc-400 disabled:opacity-50 sm:text-sm dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50"
        />
        {state.fieldErrorKeys?.trainedAt && (
          <p className="mt-1 text-sm text-rose-500">
            {dict.errors[state.fieldErrorKeys.trainedAt]}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={disabled || isPending || !selectedExerciseId}
        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 sm:w-auto sm:self-start dark:hover:bg-[#ccc]"
      >
        {isPending ? dict.submitting : dict.submit}
      </button>

      {state.errorKey && <p className="text-sm text-rose-500">{dict.errors[state.errorKey]}</p>}
    </form>
  );
}
