export type RecordableSet = {
  setId?: string;
  exerciseId?: string;
  rep?: number;
  weight?: number;
  trainedAt?: string;
  createdAt?: string;
};

export type PrFlags = {
  weight: boolean;
  volume: boolean;
};

function volumeOf(set: RecordableSet): number {
  return (set.rep ?? 0) * (set.weight ?? 0);
}

function chronological(a: RecordableSet, b: RecordableSet): number {
  const t = (a.trainedAt ?? '').localeCompare(b.trainedAt ?? '');
  if (t !== 0) return t;
  const c = (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
  if (c !== 0) return c;
  return (a.setId ?? '').localeCompare(b.setId ?? '');
}

export function computePrFlags(sets: RecordableSet[]): Map<string, PrFlags> {
  const byExercise = new Map<string, RecordableSet[]>();
  for (const set of sets) {
    if (!set.setId || !set.exerciseId || !set.trainedAt) continue;
    const bucket = byExercise.get(set.exerciseId);
    if (bucket) bucket.push(set);
    else byExercise.set(set.exerciseId, [set]);
  }

  const flags = new Map<string, PrFlags>();
  for (const bucket of byExercise.values()) {
    bucket.sort(chronological);
    let maxWeight = -Infinity;
    let maxVolume = -Infinity;
    for (const set of bucket) {
      const weight = set.weight ?? 0;
      const volume = volumeOf(set);
      const weightPr = weight > maxWeight;
      const volumePr = volume > maxVolume;
      if (weightPr) maxWeight = weight;
      if (volumePr) maxVolume = volume;
      if (weightPr || volumePr) {
        flags.set(set.setId!, { weight: weightPr, volume: volumePr });
      }
    }
  }
  return flags;
}
