interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const ipRequestMap = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes to prevent memory leaks in warm serverless containers
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipRequestMap.entries()) {
      if (now > record.resetAt) {
        ipRequestMap.delete(ip);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Basic in-memory sliding rate limiter per client IP.
 * Default: maximum 10 planning requests per 60 seconds per IP.
 * Note: In serverless, memory is per-container instance.
 */
export function checkRateLimit(
  clientIp: string = 'unknown',
  maxRequests: number = 10,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const existing = ipRequestMap.get(clientIp);

  if (!existing || now > existing.resetAt) {
    ipRequestMap.set(clientIp, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetInMs: windowMs,
    };
  }

  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetInMs: Math.max(0, existing.resetAt - now),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - existing.count,
    resetInMs: Math.max(0, existing.resetAt - now),
  };
}
