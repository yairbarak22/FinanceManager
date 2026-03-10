/**
 * RTL text utilities for PDF rendering.
 *
 * @react-pdf/renderer 4.x includes a Unicode BiDi engine that handles
 * RTL text layout automatically. We only need to:
 *   - Set the base paragraph direction to RTL via a directional mark
 *   - Let the BiDi algorithm handle word ordering and mixed content
 *
 * No manual word reversal is needed. Hebrew words flow RTL naturally,
 * and LTR sequences (numbers, English) are handled by the BiDi algorithm.
 */

const LTR_MARK = '\u200E';
const RTL_MARK = '\u200F';

/**
 * Prepare a Hebrew string for PDF rendering by setting RTL base direction.
 *
 * Prefixes with RTL_MARK to establish RTL paragraph direction for the
 * renderer's BiDi algorithm. Adds a trailing RTL_MARK to seal the
 * direction of any neutral characters (periods, percent signs) at the
 * end of the text, preventing the BiDi algorithm from misplacing them.
 * Suffixes with LTR_MARK to reset direction for any surrounding content.
 */
export function prepareRtl(text: string): string {
  if (!text) return text;

  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return text;

  return RTL_MARK + normalized + RTL_MARK + LTR_MARK;
}

/**
 * Format a number as ILS currency string suitable for PDF.
 * Uses Non-Breaking Space to keep the symbol bound to the number.
 */
export function formatILS(amount: number): string {
  const formatted = new Intl.NumberFormat('he-IL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));

  const sign = amount < 0 ? '-' : '';
  return `${sign}${formatted}\u00A0\u20AA`;
}

/**
 * Format a percentage string for PDF.
 */
export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${Math.round(value)}%`;
}
