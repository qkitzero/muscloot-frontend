'use client';

import { useActionState } from 'react';
import { registerUser, type RegisterFormState } from './actions';

const initialState: RegisterFormState = {};

export default function Register() {
  const [state, formAction, isPending] = useActionState(registerUser, initialState);

  return (
    <div className="mx-auto mt-12 max-w-lg rounded-2xl border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-900">
      <h1 className="mb-6 text-center text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Create your account
      </h1>
      <form action={formAction} className="space-y-4">
        <div>
          <label
            htmlFor="displayName"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Display Name
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            required
            className="w-full rounded-lg border border-black/[.08] bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50"
          />
          {state.fieldErrors?.displayName && (
            <p className="mt-1 text-sm text-rose-500">{state.fieldErrors.displayName}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="birthDate"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Birth Date
          </label>
          <input
            id="birthDate"
            name="birthDate"
            type="date"
            required
            className="w-full rounded-lg border border-black/[.08] bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50"
          />
          {state.fieldErrors?.birthDate && (
            <p className="mt-1 text-sm text-rose-500">{state.fieldErrors.birthDate}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-full bg-foreground py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
        >
          {isPending ? 'Registering...' : 'Register'}
        </button>

        {state.error && <p className="text-sm text-rose-500">{state.error}</p>}
      </form>
    </div>
  );
}
