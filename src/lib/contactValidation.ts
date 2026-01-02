/**
 * Contact Form Validation & Sanitization Utilities
 * 
 * Security measures:
 * - Input sanitization (XSS prevention)
 * - Spam detection (patterns, excessive links)
 * - Length validation
 * - Category enum validation
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const CONTACT_FORM_LIMITS = {
  subject: { min: 3, max: 200 },
  message: { min: 10, max: 5000 },
} as const;

export const VALID_CATEGORIES = ['bug', 'feature', 'general'] as const;
export type ContactCategory = typeof VALID_CATEGORIES[number];

// Common spam keywords (in Hebrew and English)
const SPAM_KEYWORDS = [
  'casino', 'viagra', 'lottery', 'prize', 'winner',
  'click here', 'free money', 'limited time',
  'הימורים', 'זכית', 'פרס', 'כסף חינם', 'הזדמנות אחרונה',
];

// ============================================================================
// SANITIZATION
// ============================================================================

/**
 * Sanitize text input to prevent XSS attacks
 * - Removes HTML tags
 * - Escapes special characters
 * - Trims whitespace
 * - Normalizes unicode
 */
export function sanitizeInput(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }

  return text
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Escape HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    // Normalize unicode to prevent homograph attacks
    .normalize('NFC')
    // Remove null bytes and other control characters (except newlines and tabs)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Trim whitespace
    .trim();
}

/**
 * Sanitize for display (less aggressive, preserves some formatting)
 */
export function sanitizeForDisplay(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }

  return text
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Normalize unicode
    .normalize('NFC')
    // Remove control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Trim
    .trim();
}

// ============================================================================
// SPAM DETECTION
// ============================================================================

/**
 * Count URLs in text
 */
function countUrls(text: string): number {
  const urlPattern = /https?:\/\/[^\s]+|www\.[^\s]+/gi;
  const matches = text.match(urlPattern);
  return matches ? matches.length : 0;
}

/**
 * Check for repeated characters (e.g., "aaaaaaa")
 */
function hasRepeatedCharacters(text: string, threshold: number = 5): boolean {
  const pattern = /(.)\1{4,}/; // 5+ repeated characters
  return pattern.test(text);
}

/**
 * Check for spam keywords
 */
function containsSpamKeywords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return SPAM_KEYWORDS.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

/**
 * Check if text is mostly uppercase (shouting)
 */
function isMostlyUppercase(text: string): boolean {
  const letters = text.replace(/[^a-zA-Zא-ת]/g, '');
  if (letters.length < 10) return false;
  
  const uppercase = letters.replace(/[^A-Z]/g, '').length;
  return uppercase / letters.length > 0.7;
}

/**
 * Detect if message is likely spam
 * Returns object with spam status and reason
 */
export function detectSpam(
  message: string,
  subject: string
): { isSpam: boolean; reason?: string } {
  const fullText = `${subject} ${message}`;

  // Check for excessive links (>3)
  if (countUrls(fullText) > 3) {
    return { isSpam: true, reason: 'excessive_links' };
  }

  // Check for repeated characters
  if (hasRepeatedCharacters(fullText)) {
    return { isSpam: true, reason: 'repeated_characters' };
  }

  // Check for spam keywords
  if (containsSpamKeywords(fullText)) {
    return { isSpam: true, reason: 'spam_keywords' };
  }

  // Check for excessive uppercase
  if (isMostlyUppercase(fullText)) {
    return { isSpam: true, reason: 'excessive_uppercase' };
  }

  return { isSpam: false };
}

// ============================================================================
// VALIDATION
// ============================================================================

export interface ContactFormData {
  category: string;
  subject: string;
  message: string;
  website?: string; // Honeypot field
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  sanitizedData?: {
    category: ContactCategory;
    subject: string;
    message: string;
  };
}

/**
 * Validate category
 */
export function isValidCategory(category: string): category is ContactCategory {
  return VALID_CATEGORIES.includes(category as ContactCategory);
}

/**
 * Validate and sanitize contact form data
 * Returns validation result with sanitized data if valid
 */
export function validateContactForm(data: unknown): ValidationResult {
  const errors: Record<string, string> = {};

  // Type check
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: { form: 'נתונים לא תקינים' },
    };
  }

  const formData = data as Record<string, unknown>;

  // Honeypot check - if filled, it's a bot
  if (formData.website && typeof formData.website === 'string' && formData.website.trim()) {
    // Return success to not reveal it's a honeypot
    // The API will handle this silently
    return {
      isValid: false,
      errors: { honeypot: 'bot_detected' },
    };
  }

  // Category validation
  const category = typeof formData.category === 'string' ? formData.category.trim() : '';
  if (!isValidCategory(category)) {
    errors.category = 'יש לבחור קטגוריה';
  }

  // Subject validation
  const subject = typeof formData.subject === 'string' ? formData.subject : '';
  const sanitizedSubject = sanitizeInput(subject);
  
  if (sanitizedSubject.length < CONTACT_FORM_LIMITS.subject.min) {
    errors.subject = `נושא חייב להכיל לפחות ${CONTACT_FORM_LIMITS.subject.min} תווים`;
  } else if (sanitizedSubject.length > CONTACT_FORM_LIMITS.subject.max) {
    errors.subject = `נושא יכול להכיל עד ${CONTACT_FORM_LIMITS.subject.max} תווים`;
  }

  // Message validation
  const message = typeof formData.message === 'string' ? formData.message : '';
  const sanitizedMessage = sanitizeInput(message);
  
  if (sanitizedMessage.length < CONTACT_FORM_LIMITS.message.min) {
    errors.message = `הודעה חייבת להכיל לפחות ${CONTACT_FORM_LIMITS.message.min} תווים`;
  } else if (sanitizedMessage.length > CONTACT_FORM_LIMITS.message.max) {
    errors.message = `הודעה יכולה להכיל עד ${CONTACT_FORM_LIMITS.message.max} תווים`;
  }

  // Spam detection
  if (!errors.subject && !errors.message) {
    const spamResult = detectSpam(sanitizedMessage, sanitizedSubject);
    if (spamResult.isSpam) {
      errors.message = 'ההודעה נחסמה עקב תוכן חשוד';
    }
  }

  // Return result
  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: {},
    sanitizedData: {
      category: category as ContactCategory,
      subject: sanitizedSubject,
      message: sanitizedMessage,
    },
  };
}

