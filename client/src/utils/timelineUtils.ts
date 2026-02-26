/**
 * Pure helpers for timeline playback boundary logic.
 * Extracted for independent testability (shift-left).
 */

/** Clamp index to [0, length - 1]. Returns 0 when length is 0. */
export function clampIndex(index: number, length: number): number {
  if (length === 0) return 0;
  return Math.min(Math.max(0, index), length - 1);
}

/** True when stepping back is possible. */
export function canStepBack(index: number): boolean {
  return index > 0;
}

/** True when stepping forward is possible. */
export function canStepForward(index: number, length: number): boolean {
  return index < length - 1;
}

/** True when playback should auto-stop (reached last snapshot). */
export function shouldAutoStop(index: number, length: number): boolean {
  return length === 0 || index >= length - 1;
}
