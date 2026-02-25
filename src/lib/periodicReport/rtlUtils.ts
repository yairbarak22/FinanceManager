/**
 * RTL text utilities for PDF rendering.
 *
 * PDF renderers (pdfkit, @react-pdf/renderer) lay out ALL text LTR.
 * Hebrew glyphs render correctly via the font, but word order must be
 * reversed so that when the renderer places words left-to-right the
 * result reads correctly right-to-left in the PDF viewer.
 *
 * We reverse the WORD ORDER only -- never the characters within words.
 * Consecutive LTR tokens (numbers, English, symbols) keep their relative
 * internal order after the global reversal.
 *
 * Between Hebrew words we insert an LTR mark (\u200E) alongside the space
 * to prevent the renderer from collapsing inter-word spacing.
 */

const HEBREW_CHAR = /[\u0590-\u05FF]/;
const LTR_MARK = '\u200E';
const WORD_SEP = ` ${LTR_MARK}`;

function containsHebrew(token: string): boolean {
  return HEBREW_CHAR.test(token);
}

/**
 * Prepare a mixed Hebrew/LTR string for PDF rendering.
 *
 * 1. Normalize whitespace (collapse consecutive spaces).
 * 2. Split into word tokens.
 * 3. Reverse the full array (so first Hebrew word ends up on the right in LTR layout).
 * 4. Groups of consecutive LTR tokens get re-reversed to restore their internal order.
 * 5. Join with space + LTR mark to preserve inter-word spacing.
 */
export function prepareRtl(text: string): string {
  if (!text) return text;

  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return text;

  const tokens = normalized.split(' ');
  if (tokens.length <= 1) {
    return containsHebrew(normalized) ? normalized + LTR_MARK : normalized;
  }

  const reversed = [...tokens].reverse();

  const result: string[] = [];
  let ltrGroup: string[] = [];

  for (const token of reversed) {
    if (containsHebrew(token)) {
      if (ltrGroup.length > 0) {
        result.push(...ltrGroup.reverse());
        ltrGroup = [];
      }
      result.push(token);
    } else {
      ltrGroup.push(token);
    }
  }

  if (ltrGroup.length > 0) {
    result.push(...ltrGroup.reverse());
  }

  return result.join(WORD_SEP) + LTR_MARK;
}

/**
 * Format a number as ILS currency string suitable for PDF.
 */
export function formatILS(amount: number): string {
  const formatted = new Intl.NumberFormat('he-IL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));

  const sign = amount < 0 ? '-' : '';
  return `₪${sign}${formatted}`;
}

/**
 * Format a percentage string for PDF.
 */
export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${Math.round(value)}%`;
}
