'use client';

import { useActionState } from 'react';
import type { components } from '../../../../../gen/exercise/v1/exercise.schema';
import { createSet, type CreateSetFormState } from './actions';

type Exercise = components['schemas']['v1Exercise'];

const initialState: CreateSetFormState = {};

export default function AddSetForm({
  workoutId,
  exercises,
  disabled,
}: {
  workoutId: string;
  exercises: Exercise[];
  disabled: boolean;
}) {
  const boundAction = createSet.bind(null, workoutId);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div>
        <label
          htmlFor="exerciseId"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Exercise
        </label>
        <select
          id="exerciseId"
          name="exerciseId"
          required
          disabled={disabled || exercises.length === 0}
          className="w-full rounded-lg border border-black/[.08] bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-400 disabled:opacity-50 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50"
        >
          <option value="">Select exercise…</option>
          {exercises.map((exercise) => (
            <option key={exercise.exerciseId} value={exercise.exerciseId ?? ''}>
              {exercise.name ?? exercise.code ?? exercise.exerciseId}
            </option>
          ))}
        </select>
        {state.fieldErrors?.exerciseId && (
          <p className="mt-1 text-sm text-rose-500">{state.fieldErrors.exerciseId}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="rep"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Reps
          </label>
          <input
            id="rep"
            name="rep"
            type="number"
            min={1}
            step={1}
            required
            disabled={disabled}
            className="w-full rounded-lg border border-black/[.08] bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-400 disabled:opacity-50 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50"
          />
          {state.fieldErrors?.rep && (
            <p className="mt-1 text-sm text-rose-500">{state.fieldErrors.rep}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="weight"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Weight (kg)
          </label>
          <input
            id="weight"
            name="weight"
            type="number"
            min={0}
            step="0.5"
            required
            disabled={disabled}
            className="w-full rounded-lg border border-black/[.08] bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-400 disabled:opacity-50 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50"
          />
          {state.fieldErrors?.weight && (
            <p className="mt-1 text-sm text-rose-500">{state.fieldErrors.weight}</p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="trainedAt"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Trained at
        </label>
        <input
          id="trainedAt"
          name="trainedAt"
          type="datetime-local"
          required
          disabled={disabled}
          className="w-full rounded-lg border border-black/[.08] bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-400 disabled:opacity-50 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50"
        />
        {state.fieldErrors?.trainedAt && (
          <p className="mt-1 text-sm text-rose-500">{state.fieldErrors.trainedAt}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={disabled || isPending}
        className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
      >
        {isPending ? 'Recording…' : 'Add set'}
      </button>

      {state.error && <p className="text-sm text-rose-500">{state.error}</p>}
    </form>
  );
}
