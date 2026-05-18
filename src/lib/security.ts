/**
 * Security Utility for Sanitization and Validation
 */

/**
 * Sanitize a string to prevent basic XSS when rendering user-generated content.
 * Note: react-markdown or DOMPurify are preferred for complex HTML, but this handles simple strings.
 */
export const sanitizeString = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Validates a URL to ensure it's a safe protocol (http/https/data).
 */
export const isSafeUrl = (url: string): boolean => {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:', 'data:'].includes(parsed.protocol);
  } catch {
    // If it's a data URL or relative path, it might fail URL parsing but still be OK
    return url.startsWith('data:') || url.startsWith('/');
  }
};

/**
 * Truncates and cleans string for storage based on blueprint limits.
 */
export const prepareForStorage = (str: string, maxLength: number = 1000): string => {
  const trimmed = str.trim();
  return trimmed.length > maxLength ? trimmed.substring(0, maxLength) : trimmed;
};
