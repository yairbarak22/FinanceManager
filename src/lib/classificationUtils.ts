/**
 * Classification Utilities
 * Shared helpers for the Global Consensus classification pipeline.
 *
 * - superNormalizeMerchantName: aggressive Hebrew bank string cleanup
 * - isBlacklistedMerchant: runtime blacklist for digital wallets
 * - checkGlobalConsensus: confidence scoring for cross-user stats
 */

// ============================================
// BLACKLIST - Digital wallets that are always ambiguous
// ============================================

const BLACKLISTED_MERCHANTS = [
  // Digital wallets
  'bit',
  'ביט',
  'paybox',
  'פייבוקס',
  'paypal',
  'פייפאל',
  'apple pay',
  'אפל פיי',
  'google pay',
  'גוגל פיי',
  'pepper',
  'פפר',
  'פיי',
  'pay',
  // Ambiguous generic terms that always need manual review
  'קניות',
  'משנת יוסף',
];

/**
 * Check if a merchant name matches a digital-wallet blacklist.
 * Blacklisted merchants always require manual review and bypass both
 * Global Consensus and AI classification.
 *
 * Uses the *super-normalized* name so callers should normalize first,
 * but also accepts raw names and normalizes internally for safety.
 */
export function isBlacklistedMerchant(name: string): boolean {
  const normalized = superNormalizeMerchantName(name);
  if (!normalized) return false;

  // Exact match or the normalized name starts/ends with the keyword
  // (handles "העברת ביט", "ביט העברה", etc.)
  for (const keyword of BLACKLISTED_MERCHANTS) {
    if (normalized === keyword) return true;
    // Whole-word boundary check: keyword surrounded by spaces or at edges
    const regex = new RegExp(`(?:^|\\s)${escapeRegex(keyword)}(?:\\s|$)`);
    if (regex.test(normalized)) return true;
  }

  return false;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================
// SUPER NORMALIZATION
// ============================================

/**
 * Bank prefixes commonly prepended by Israeli banks to transaction descriptions.
 * Order matters: longer/more-specific patterns first to avoid partial matches.
 */
const BANK_PREFIXES = [
  // Standing orders / direct debits
  'הו"ק ל',
  'הו"ק',
  'הוק',
  'הוראת קבע',
  // Card charges
  'חיוב כרטיס',
  'חיוב אשראי',
  'חיוב מ-',
  'חיוב מ ',
  // Credits / refunds
  'זיכוי מ-',
  'זיכוי מ ',
  'זיכוי',
  // Transfers
  'העברת ביט',
  'העברה ל',
  'העברה מ',
  'העברת',
  'העברה',
  // Checks
  'הפקדת שיק',
  'שיק',
  'צ\'ק',
  // Misc
  'תשלום ל',
  'תשלום עבור',
  'משיכת מזומן',
  'משיכה',
  'הפקדה',
];

/**
 * Aggressively normalize an Israeli bank merchant name for global lookups.
 *
 * Steps:
 * 1. Trim + collapse whitespace
 * 2. Remove known bank prefixes
 * 3. Strip branch/store numbers  ("שופרסל שלי 154" -> "שופרסל שלי")
 * 4. Strip trailing dates/times   ("15/03/24", "15.03", "12:30")
 * 5. Remove card-last-4 suffixes  ("*1234", "xxxx1234")
 * 6. Remove special characters    (quotes, dashes used as separators)
 * 7. English to lowercase
 * 8. Final trim + collapse
 */
export function superNormalizeMerchantName(name: string): string {
  if (!name) return '';

  let s = name.trim();

  // Collapse multiple spaces / non-breaking spaces
  s = s.replace(/[\s\u00A0]+/g, ' ');

  // Lowercase English characters (keep Hebrew as-is)
  s = s.replace(/[A-Z]/g, c => c.toLowerCase());

  // Strip bank prefixes (case-insensitive for Hebrew equality)
  for (const prefix of BANK_PREFIXES) {
    if (s.startsWith(prefix)) {
      s = s.slice(prefix.length).trim();
      break; // Only strip one prefix
    }
  }

  // Replace punctuation separators (hyphens, underscores, dots, commas) with space
  // This merges variants like "רב-קו" and "רב קו" into the same normalized form
  s = s.replace(/[-_.,]/g, ' ');

  // Collapse whitespace after punctuation replacement
  s = s.replace(/\s+/g, ' ').trim();

  // Remove card-last-4 patterns: "*1234", "xxxx1234", "****1234"
  s = s.replace(/[*x]{1,4}\d{4}\b/gi, '');

  // Remove trailing date patterns: DD/MM/YYYY, DD/MM/YY, DD.MM.YYYY, DD.MM.YY, DD/MM, DD.MM
  s = s.replace(/\s+\d{1,2}[\/\.]\d{1,2}([\/\.]\d{2,4})?\s*$/g, '');

  // Remove trailing time patterns: HH:MM, HH:MM:SS
  s = s.replace(/\s+\d{1,2}:\d{2}(:\d{2})?\s*$/g, '');

  // Remove trailing branch/store numbers: "שופרסל שלי 154" -> "שופרסל שלי"
  // Only strip if the number is at the very end and preceded by a space
  s = s.replace(/\s+\d{1,5}\s*$/g, '');

  // Remove parenthesized trailing content that looks like metadata: "(סניף 12)", "(מס' 4567)"
  s = s.replace(/\s*\([^)]*\)\s*$/g, '');

  // Normalize remaining Unicode dashes (en-dash, em-dash) that weren't caught above
  s = s.replace(/[–—]/g, ' ');

  // Remove quotation marks and apostrophes (common in Hebrew: בע"מ, ע"ש)
  s = s.replace(/["'`״׳]/g, '');

  // Collapse whitespace again and trim
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}

// ============================================
// GLOBAL CONSENSUS SCORING
// ============================================

interface GlobalStatRow {
  category: string;
  count: number;
}

/**
 * Determine if there is a strong consensus among cross-user classifications.
 *
 * Rules:
 * - `uniqueUserCount` must be >= 3 (enforced by the caller who counts
 *   distinct users from `GlobalMerchantVote`).
 * - The top category must hold >= 75 % of total votes.
 *
 * Returns the winning category string, or null if consensus is not met.
 */
export function checkGlobalConsensus(
  stats: GlobalStatRow[],
  uniqueUserCount: number,
): string | null {
  if (stats.length === 0) return null;
  if (uniqueUserCount < 3) return null;

  const totalCount = stats.reduce((sum, s) => sum + s.count, 0);
  if (totalCount < 3) return null;

  // Find category with highest count
  let topCategory = stats[0].category;
  let topCount = stats[0].count;
  for (let i = 1; i < stats.length; i++) {
    if (stats[i].count > topCount) {
      topCount = stats[i].count;
      topCategory = stats[i].category;
    }
  }

  const confidence = topCount / totalCount;
  if (confidence >= 0.75) {
    return topCategory;
  }

  return null;
}
