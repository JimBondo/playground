/**
 * Parse a length string in common formats:
 *   "12'"        → 144
 *   "12' 4\""    → 148
 *   "12'4\""     → 148
 *   `12 ft 4 in` → 148
 *   "148\""      → 148
 *   "148"         → 148  (bare number treated as inches)
 *   "10m"        → null  (unsupported unit)
 *
 * Returns the total length in inches, or null if unparseable.
 */
export function parseLengthToInches(raw: string): number | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  if (!s) return null;

  // Reject if it contains obviously unsupported units
  if (/[a-z]/.test(s) && !/['"]|ft|in|feet|foot|inch|inches/.test(s)) {
    return null;
  }

  const ftMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:'|ft|feet|foot)/);
  const inMatch = s.match(
    /(\d+(?:\.\d+)?)\s*(?:"|(?:in(?:ch(?:es)?)?)\b)/,
  );

  if (ftMatch || inMatch) {
    const feet = ftMatch ? parseFloat(ftMatch[1]) : 0;
    const inches = inMatch ? parseFloat(inMatch[1]) : 0;
    const total = feet * 12 + inches;
    return total > 0 ? total : null;
  }

  // Fallback: a bare number is inches.
  const n = parseFloat(s);
  if (!isNaN(n) && n > 0) return n;
  return null;
}
