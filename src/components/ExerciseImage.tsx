import Image from 'next/image';

const EXERCISE_IMAGE_CODES = new Set([
  'bench_press',
  'squat',
  'deadlift',
  'overhead_press',
  'bent_over_row',
  'pull_up',
  'lat_pulldown',
  'leg_press',
  'dumbbell_curl',
  'tricep_pushdown',
  'incline_bench_press',
  'dumbbell_fly',
  'push_up',
  'close_grip_bench_press',
  'seated_cable_row',
  't_bar_row',
  'romanian_deadlift',
  'face_pull',
  'lateral_raise',
  'rear_delt_fly',
  'arnold_press',
  'barbell_curl',
  'hammer_curl',
  'skull_crusher',
  'front_squat',
  'lunge',
  'leg_extension',
  'leg_curl',
  'calf_raise',
  'plank',
  'crunch',
  'hanging_leg_raise',
]);

export default function ExerciseImage({
  code,
  name,
  className,
}: {
  code?: string;
  name?: string;
  className?: string;
}) {
  const baseClass =
    'shrink-0 rounded-lg bg-zinc-100 object-contain dark:bg-zinc-800 ' + (className ?? '');

  if (code && EXERCISE_IMAGE_CODES.has(code)) {
    return (
      <Image
        src={`/exercises/${code}.svg`}
        alt={name ?? code}
        width={64}
        height={64}
        className={baseClass}
        unoptimized
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={name ?? 'Exercise'}
      className={`flex items-center justify-center text-zinc-400 dark:text-zinc-500 ${baseClass}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-1/2 w-1/2"
      >
        <circle cx="6" cy="12" r="2" />
        <rect x="9" y="9" width="6" height="6" rx="1" />
        <circle cx="18" cy="12" r="2" />
      </svg>
    </div>
  );
}
