/**
 * Shared chart color palette – Design System aligned, maximally distinct.
 * Ordered so that adjacent slices in a pie chart contrast well.
 */
export const CHART_PALETTE: readonly string[] = [
  '#0DBACC',  // Turquoise
  '#F18AB5',  // Cotton Candy Pink
  '#69ADFF',  // Dodger Blue
  '#E9A800',  // Gold
  '#22c55e',  // Green
  '#9F7FE0',  // Lavender
  '#ef4444',  // Red
  '#14b8a6',  // Emerald
  '#8b5cf6',  // Violet
  '#74ACEF',  // Baby Blue
  '#f59e0b',  // Amber
  '#ec4899',  // Rose
  '#06b6d4',  // Cyan
  '#6366f1',  // Indigo
  '#a855f7',  // Purple
] as const;

export function getChartColor(index: number): string {
  return CHART_PALETTE[index % CHART_PALETTE.length];
}
