import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
  keyGenerator?: (req: NextRequest) => string; // Custom key generator
  skip?: (req: NextRequest) => boolean; // Skip rate limiting for certain requests
}

interface RateLimitEntry {
  requests: number;
  resetTime: number;
}

// In-memory storage for rate limiting (for production, consider Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Default key generator - uses IP address
const defaultKeyGenerator = (req: NextRequest): string => {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown';
  return `rate_limit:${ip}`;
};

// Rate limiter middleware
export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later.',
    keyGenerator = defaultKeyGenerator,
    skip
  } = config;

  return async (req: NextRequest): Promise<NextResponse | null> => {
    // Skip rate limiting if configured
    if (skip && skip(req)) {
      return null;
    }

    const key = keyGenerator(req);
    const now = Date.now();
    
    // Clean up expired entries periodically
    cleanupExpiredEntries(now);
    
    const entry = rateLimitStore.get(key);
    
    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired entry
      rateLimitStore.set(key, {
        requests: 1,
        resetTime: now + windowMs
      });
      return null; // Allow request
    }
    
    if (entry.requests >= maxRequests) {
      // Rate limit exceeded
      return new NextResponse(
        JSON.stringify({
          error: message,
          retryAfter: Math.ceil((entry.resetTime - now) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((entry.resetTime - now) / 1000).toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetTime.toString()
          }
        }
      );
    }
    
    // Increment request count
    entry.requests += 1;
    
    // Add rate limit headers
    const remaining = Math.max(0, maxRequests - entry.requests);
    
    return new NextResponse(null, {
      headers: {
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': entry.resetTime.toString()
      }
    });
  };
}

// Clean up expired entries to prevent memory leaks
function cleanupExpiredEntries(now: number): void {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Predefined rate limiters for common use cases

// Strict rate limiter for authentication endpoints
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
  keyGenerator: (req) => {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown';
    return `auth_limit:${ip}`;
  }
});

// General API rate limiter
export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
  message: 'Too many API requests. Please try again later.',
  keyGenerator: (req) => {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown';
    const userAgent = req.headers.get('user-agent') || '';
    return `api_limit:${ip}:${userAgent.slice(0, 50)}`;
  }
});

// Strict rate limiter for sensitive operations (admin, payments, etc.)
export const sensitiveRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 10 requests per hour
  message: 'Too many sensitive operations. Please try again in an hour.',
  keyGenerator: (req) => {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown';
    return `sensitive_limit:${ip}`;
  }
});

// File upload rate limiter
export const uploadRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxRequests: 20, // 20 uploads per 10 minutes
  message: 'Too many file uploads. Please try again later.',
  keyGenerator: (req) => {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown';
    return `upload_limit:${ip}`;
  }
});

// Search rate limiter
export const searchRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 50, // 50 searches per 5 minutes
  message: 'Too many search requests. Please try again later.',
  keyGenerator: (req) => {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown';
    return `search_limit:${ip}`;
  }
});

// Utility to apply rate limiting to an API handler
export function withRateLimit<T>(
  rateLimiter: (req: NextRequest) => Promise<NextResponse | null>,
  handler: (req: NextRequest, ...args: T[]) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T[]): Promise<NextResponse> => {
    const rateLimitResponse = await rateLimiter(req);
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    return handler(req, ...args);
  };
}

// Utility to combine multiple rate limiters
export function combineRateLimiters(
  ...rateLimiters: ((req: NextRequest) => Promise<NextResponse | null>)[]
) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    for (const rateLimiter of rateLimiters) {
      const response = await rateLimiter(req);
      if (response) {
        return response; // Return first rate limit hit
      }
    }
    return null; // All rate limiters passed
  };
}

// Get current rate limit status for a key
export function getRateLimitStatus(key: string): {
  requests: number;
  resetTime: number;
  remaining: number;
} | null {
  const entry = rateLimitStore.get(key);
  if (!entry) {
    return null;
  }
  
  return {
    requests: entry.requests,
    resetTime: entry.resetTime,
    remaining: Math.max(0, entry.resetTime - Date.now())
  };
}

// Clear rate limit for a specific key (useful for testing or admin override)
export function clearRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

// Get all active rate limits (useful for monitoring)
export function getAllRateLimits(): Array<{
  key: string;
  requests: number;
  resetTime: number;
}> {
  const now = Date.now();
  const activeLimits: Array<{
    key: string;
    requests: number;
    resetTime: number;
  }> = [];
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now <= entry.resetTime) {
      activeLimits.push({
        key,
        requests: entry.requests,
        resetTime: entry.resetTime
      });
    }
  }
  
  return activeLimits;
}