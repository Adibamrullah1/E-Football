// ============================================================
// Input Sanitization — Strip HTML, normalize whitespace
// ============================================================

/**
 * Sanitize a single string value:
 * 1. Trim leading/trailing whitespace
 * 2. Strip HTML tags
 * 3. Normalize multiple whitespace to single space
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/<[^>]*>/g, '')       // strip HTML tags
    .replace(/\s+/g, ' ')          // normalize whitespace
}

/**
 * Recursively sanitize all string values in an object.
 * Returns a new object with sanitized strings.
 * Non-string values are passed through unchanged.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj } as Record<string, unknown>

  for (const key of Object.keys(result)) {
    const value = result[key]
    if (typeof value === 'string') {
      result[key] = sanitizeString(value)
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, unknown>)
    }
  }

  return result as T
}
