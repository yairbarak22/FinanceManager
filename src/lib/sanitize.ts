import sanitizeHtml from 'sanitize-html';

/**
 * Sanitize HTML for email content — strips dangerous tags/attributes
 * while preserving safe formatting (bold, italic, links, line breaks, lists).
 */
export function sanitizeEmailHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ['b', 'i', 'u', 'strong', 'em', 'br', 'p', 'a', 'ul', 'ol', 'li', 'span', 'div'],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      span: ['style'],
      div: ['style'],
    },
    allowedSchemes: ['https', 'mailto'],
    allowedStyles: {
      span: { color: [/.*/], 'font-weight': [/.*/] },
      div: { color: [/.*/], 'font-weight': [/.*/], 'text-align': [/.*/] },
    },
  });
}

/**
 * Full HTML entity escape — converts ALL HTML to plain text.
 * Use for user-generated strings interpolated into HTML templates
 * (e.g. names, titles) where no formatting is expected.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
