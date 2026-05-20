// ============================================================
// In-Memory Rate Limiter — Sliding Window Counter
// ============================================================
// Simple rate limiter using Map. Suitable for single-instance
// deployments (Vercel serverless, single VPS).
// For multi-instance, use Redis-based rate limiting.
// ============================================================

import { NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now

  rateLimitStore.forEach((entry, key) => {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key)
    }
  })
}

/**
 * Extract client identifier from request.
 * Uses x-forwarded-for header (proxy), then x-real-ip, then falls back to 'anonymous'.
 */
function getClientId(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()

  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp

  return 'anonymous'
}

interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests?: number
  /** Time window in milliseconds */
  windowMs?: number
}

/**
 * Check rate limit for a request.
 * Returns null if allowed, or a 429 NextResponse if rate limited.
 *
 * @param req - The incoming request
 * @param config - Rate limit configuration
 * @returns null if allowed, NextResponse with 429 if rate limited
 */
export function checkRateLimit(
  req: Request,
  config: RateLimitConfig = {}
): NextResponse | null {
  const { maxRequests = 30, windowMs = 60_000 } = config

  cleanup()

  const clientId = getClientId(req)
  const url = new URL(req.url)
  const key = `${clientId}:${url.pathname}`
  const now = Date.now()

  const existing = rateLimitStore.get(key)

  if (!existing || now > existing.resetAt) {
    // New window
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return null
  }

  existing.count++

  if (existing.count > maxRequests) {
    const retryAfter = Math.ceil((existing.resetAt - now) / 1000)
    return NextResponse.json(
      {
        error: 'Terlalu banyak request. Coba lagi nanti.',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(existing.resetAt / 1000)),
        },
      }
    )
  }

  return null
}
