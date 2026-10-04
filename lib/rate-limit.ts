/**
 * Simple in-memory rate limiter for API routes.
 * Tracks requests per user UID (or IP for unauthenticated).
 * Limits reset after the window expires.
 */

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const GEMINI_MAX_PER_MINUTE = 10;
const RESUME_MAX_PER_MINUTE = 3;

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const geminiLimits = new Map<string, RateLimitEntry>();
const resumeLimits = new Map<string, RateLimitEntry>();

function checkLimit(
  store: Map<string, RateLimitEntry>,
  key: string,
  maxRequests: number,
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}

export function checkGeminiRateLimit(uid: string) {
  return checkLimit(geminiLimits, uid, GEMINI_MAX_PER_MINUTE);
}

export function checkResumeRateLimit(uid: string) {
  return checkLimit(resumeLimits, uid, RESUME_MAX_PER_MINUTE);
}
