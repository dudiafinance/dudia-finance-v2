/**
 * XSS sanitization utilities for user-supplied text fields.
 * Strips HTML tags and encodes dangerous characters.
 */

/**
 * Strips HTML tags and trims the string.
 * Use for description, notes, and other free-text fields.
 */
export function sanitizeText(value: string): string {
  return value
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
}

/**
 * Sanitize an optional text field — returns null if falsy.
 */
export function sanitizeOptionalText(value: string | null | undefined): string | null {
  if (!value) return null;
  return sanitizeText(value);
}
