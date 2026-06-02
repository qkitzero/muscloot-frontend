export const COMPARISONS = [
  { key: 'houseCat', weightKg: 4 },
  { key: 'adult', weightKg: 62 },
  { key: 'gorilla', weightKg: 160 },
  { key: 'grandPiano', weightKg: 480 },
  { key: 'smallCar', weightKg: 1200 },
  { key: 'elephant', weightKg: 6000 },
  { key: 'cityBus', weightKg: 12000 },
  { key: 'blueWhale', weightKg: 150000 },
  { key: 'jumboJet', weightKg: 180000 },
] as const;

export type ComparisonKey = (typeof COMPARISONS)[number]['key'];

export type Comparison = {
  key: ComparisonKey;
  count: number;
};

export function pickComparison(totalKg: number): Comparison | null {
  if (!Number.isFinite(totalKg) || totalKg <= 0) return null;

  let chosen: (typeof COMPARISONS)[number] = COMPARISONS[0];
  for (const candidate of COMPARISONS) {
    if (candidate.weightKg <= totalKg) chosen = candidate;
  }

  const count = Math.max(1, Math.round(totalKg / chosen.weightKg));
  return { key: chosen.key, count };
}
