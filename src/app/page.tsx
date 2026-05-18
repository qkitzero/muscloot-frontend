import { getCurrentUser } from '@/lib/session';

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Welcome to Muscloot
        </h1>
        {user ? (
          <p className="text-lg text-zinc-700 dark:text-zinc-300">
            Signed in as <span className="font-medium">{user.displayName}</span>.
          </p>
        ) : (
          <>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Sign in to start tracking your workouts.
            </p>
            <a
              href="/api/auth/login"
              className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Login
            </a>
          </>
        )}
      </div>
    </main>
  );
}
