/**
 * RTL text utilities for PDF rendering.
 *
 * @react-pdf/renderer 4.x includes a Unicode BiDi engine that handles
 * RTL text layout automatically.  We use zero-width directional marks
 * (RTL_MARK U+200F, LTR_MARK U+200E) which are known to be supported
 * by the renderer.
 *
 * IMPORTANT: Unicode Directional Isolates (U+2066 LRI / U+2069 PDI) are
 * NOT supported by react-pdf – they render as visible garbage characters.
 * Only use the marks defined here.
 *
 * Strategy for mixed RTL + numbers:
 *   - Numbers (European Number type) are inherently LTR – no start-mark needed.
 *   - Append RTL_MARK after every LTR sequence (number, currency, %) to
 *     re-establish RTL direction for any following neutral characters
 *     (periods, dashes, spaces), preventing sentence reordering.
 */

const LTR_MARK = '\u200E';
const RTL_MARK = '\u200F';

/**
 * Seal an LTR value (number, percentage, currency) for safe embedding
 * in RTL text by appending RTL_MARK after the content.
 *
 * This prevents neutral characters that follow (periods, dashes, spaces)
 * from being misresolved by the BiDi algorithm, which would cause
 * sentence reordering.
 */
export function wrapLtr(value: string): string {
  return value + RTL_MARK;
}

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
 * Trailing RTL_MARK seals the LTR run for safe embedding in RTL text.
 */
export function formatILS(amount: number): string {
  const formatted = new Intl.NumberFormat('he-IL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));

  const sign = amount < 0 ? '-' : '';
  return `${sign}${formatted}\u00A0\u20AA${RTL_MARK}`;
}

/**
 * Format a percentage string for PDF.
 * Trailing RTL_MARK seals the LTR run for safe embedding in RTL text.
 */
export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${Math.round(value)}%${RTL_MARK}`;
}

/**
 * Format a raw number for safe embedding in RTL text.
 * Trailing RTL_MARK seals the LTR run.
 */
export function formatNumber(value: number, decimals = 0): string {
  const text = decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
  return `${text}${RTL_MARK}`;
}
