/**
 * Client-side rate limiter for form submissions and API calls.
 * Uses in-memory tracking per browser session.
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
  lockedUntil?: number;
}

const entries = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
  /** Max attempts before lockout */
  maxAttempts: number;
  /** Window in milliseconds */
  windowMs: number;
  /** Lockout duration in milliseconds after exceeding max */
  lockoutMs: number;
}

interface RateLimitCheck {
  allowed: boolean;
  remainingAttempts: number;
  lockoutRemainingMs: number;
}

export function checkClientRateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitCheck {
  const now = Date.now();
  let entry = entries.get(key);

  // Check lockout
  if (entry?.lockedUntil && now < entry.lockedUntil) {
    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutRemainingMs: entry.lockedUntil - now,
    };
  }

  // Reset if window expired or no entry
  if (!entry || now - entry.windowStart > options.windowMs) {
    entry = { count: 0, windowStart: now };
    entries.set(key, entry);
  }

  // Clear expired lockout
  if (entry.lockedUntil && now >= entry.lockedUntil) {
    entry = { count: 0, windowStart: now };
    entries.set(key, entry);
  }

  entry.count++;

  if (entry.count > options.maxAttempts) {
    entry.lockedUntil = now + options.lockoutMs;
    entries.set(key, entry);
    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutRemainingMs: options.lockoutMs,
    };
  }

  return {
    allowed: true,
    remainingAttempts: options.maxAttempts - entry.count,
    lockoutRemainingMs: 0,
  };
}

/** Reset rate limit for a key (e.g., on successful login) */
export function resetClientRateLimit(key: string): void {
  entries.delete(key);
}

// Preset configurations
export const RATE_LIMITS = {
  login: { maxAttempts: 5, windowMs: 5 * 60 * 1000, lockoutMs: 2 * 60 * 1000 },
  signup: { maxAttempts: 3, windowMs: 10 * 60 * 1000, lockoutMs: 5 * 60 * 1000 },
  passwordReset: { maxAttempts: 3, windowMs: 15 * 60 * 1000, lockoutMs: 5 * 60 * 1000 },
  aiGeneration: { maxAttempts: 10, windowMs: 5 * 60 * 1000, lockoutMs: 60 * 1000 },
} as const;
