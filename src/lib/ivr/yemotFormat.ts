/**
 * Yemot HaMashiach API response builders.
 *
 * Generates plain-text response strings in the exact format expected by
 * Yemot's IVR API module. Format reference:
 *   https://f2.freeivr.co.il/post/76
 *   https://f2.freeivr.co.il/post/78283
 *
 * Message prefixes:
 *   f-  file in the extension folder (e.g. f-M1000)
 *   t-  text-to-speech (e.g. t-שלום)
 *   m-  built-in system message, 4-digit ID without M (e.g. m-1399)
 *   s-  speech/TTS file (e.g. s-abc)
 *   d-  digits readback (e.g. d-105)
 *   n-  number readback (e.g. n-105)
 *
 * Multiple messages are separated by dots: f-M1000.t-שלום
 *
 * Characters forbidden in TTS text: . - " ' & |
 */

const INVALID_TTS_CHARS = /[.\-"'&|]/g;

export function sanitizeTtsText(text: string): string {
  return text.replace(INVALID_TTS_CHARS, '');
}

// ─── read (tap / DTMF) ────────────────────────────────────────────

export interface ReadTapOptions {
  message: string;
  valName: string;
  reEnter?: boolean;
  maxDigits?: number | '';
  minDigits?: number;
  secWait?: number;
  typingPlayback?: 'No' | 'Number' | 'Digits' | 'Price' | 'File' | 'TTS';
  blockAsterisk?: boolean;
  blockZero?: boolean;
  replaceChar?: string;
  digitsAllowed?: string;
  amountAttempts?: number | '';
  allowEmpty?: boolean;
  emptyVal?: string;
  blockChangeKeyboard?: boolean;
}

/**
 * Build a `read` response for DTMF (tap) input.
 *
 * Format: read=<message>=val,re_enter,max,min,sec,playback,block_*,block_0,
 *         replace,digits_allowed,attempts,allow_empty,empty_val,block_kb
 */
export function buildReadTap(opts: ReadTapOptions): string {
  const parts = [
    opts.valName,
    opts.reEnter ? 'yes' : 'no',
    opts.maxDigits ?? '',
    opts.minDigits ?? 1,
    opts.secWait ?? 7,
    opts.typingPlayback ?? 'No',
    opts.blockAsterisk ? 'yes' : 'no',
    opts.blockZero ? 'yes' : 'no',
    opts.replaceChar ?? '',
    opts.digitsAllowed ?? '',
    opts.amountAttempts ?? '',
    opts.allowEmpty ? 'Ok' : '',
    opts.emptyVal ?? '',
    opts.blockChangeKeyboard ? 'InsertLettersTypeChangeNo' : '',
  ];
  return `read=${opts.message}=${parts.join(',')}`;
}

// ─── id_list_message ───────────────────────────────────────────────

/**
 * Play one or more messages then exit the extension.
 * Messages use the prefix format: f-file, t-text, m-1234, etc.
 * Multiple messages separated by dots.
 */
export function buildIdListMessage(message: string): string {
  return `id_list_message=${message}`;
}

/**
 * Play a message then hang up.
 */
export function buildIdListMessageAndHangup(message: string): string {
  return `${buildIdListMessage(message)}&hangup`;
}

/**
 * Play a TTS text message then hang up.
 * Automatically sanitizes forbidden characters.
 */
export function buildTtsAndHangup(text: string): string {
  return buildIdListMessageAndHangup(`t-${sanitizeTtsText(text)}`);
}

/**
 * Play a file then hang up.
 */
export function buildFileAndHangup(fileName: string): string {
  return buildIdListMessageAndHangup(`f-${fileName}`);
}
