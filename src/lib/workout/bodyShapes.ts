import type { MuscleCode } from './aggregate';

export type Muscle = { cx: number; cy: number; rx: number; ry: number };

export const VIEWBOX_WIDTH = 120;
export const VIEWBOX_HEIGHT = 220;

export const MIN_SCALE = 0.7;
export const MAX_SCALE = 1.45;

export type BodyView = 'front' | 'back';

export const FRONT_MUSCLES: Record<MuscleCode, Muscle[]> = {
  shoulders: [
    { cx: 34, cy: 50, rx: 11, ry: 10 },
    { cx: 86, cy: 50, rx: 11, ry: 10 },
  ],
  chest: [
    { cx: 49, cy: 64, rx: 13, ry: 11 },
    { cx: 71, cy: 64, rx: 13, ry: 11 },
  ],
  arms: [
    { cx: 27, cy: 84, rx: 8, ry: 17 },
    { cx: 93, cy: 84, rx: 8, ry: 17 },
  ],
  core: [{ cx: 60, cy: 94, rx: 14, ry: 19 }],
  legs: [
    { cx: 50, cy: 148, rx: 11, ry: 33 },
    { cx: 70, cy: 148, rx: 11, ry: 33 },
  ],
  back: [],
};

export const BACK_MUSCLES: Record<MuscleCode, Muscle[]> = {
  shoulders: [
    { cx: 34, cy: 50, rx: 11, ry: 10 },
    { cx: 86, cy: 50, rx: 11, ry: 10 },
  ],
  back: [
    { cx: 49, cy: 67, rx: 13, ry: 17 },
    { cx: 71, cy: 67, rx: 13, ry: 17 },
  ],
  arms: [
    { cx: 27, cy: 84, rx: 8, ry: 17 },
    { cx: 93, cy: 84, rx: 8, ry: 17 },
  ],
  legs: [
    { cx: 50, cy: 120, rx: 12, ry: 14 },
    { cx: 70, cy: 120, rx: 12, ry: 14 },
    { cx: 50, cy: 158, rx: 11, ry: 28 },
    { cx: 70, cy: 158, rx: 11, ry: 28 },
  ],
  chest: [],
  core: [],
};

export function musclesForView(view: BodyView): Record<MuscleCode, Muscle[]> {
  return view === 'front' ? FRONT_MUSCLES : BACK_MUSCLES;
}
