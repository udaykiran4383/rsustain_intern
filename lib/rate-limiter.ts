// Rate limiting utility for API endpoints
// Uses in-memory storage for development, should be Redis in production

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

// In-memory store (use Redis in production)
const requestStore = new Map<string, RequestRecord>();

// Default rate limit configurations
const defaultConfigs: Record<string, RateLimitConfig> = {
  // Critical endpoints - stricter limits
  calculate: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200, // 200 requests per minute (increased for testing)
    message: 'Too many calculation requests. Please try again later.'
  },
  
  // Shopping endpoints - moderate limits
  cart: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    message: 'Too many cart requests. Please slow down.'
  },
  
  // Project endpoints - moderate limits
  projects: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200, // 200 requests per minute (increased for testing)
    message: 'Too many project requests. Please try again later.'
  },
  
  // Authentication endpoints - very strict
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 requests per 15 minutes
    message: 'Too many authentication attempts. Please wait 15 minutes.'
  },
  
  // General API - loose limits
  general: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200, // 200 requests per minute
    message: 'Too many requests. Please slow down.'
  },
  
  // Burst protection - very strict for rapid fire
  burst: {
    windowMs: 10 * 1000, // 10 seconds
    maxRequests: 20, // 20 requests per 10 seconds
    message: 'Request rate too high. Please slow down significantly.'
  }
};

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestStore.entries()) {
    if (now > record.resetTime) {
      requestStore.delete(key);
    }
  }
}, 60 * 1000); // Clean up every minute

function getClientIdentifier(request: Request): string {
  // Get client identifier - IP address, user ID, or session
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  // In production, you might want to include user ID if authenticated
  return ip;
}

export function createRateLimiter(configName: keyof typeof defaultConfigs = 'general') {
  const config = defaultConfigs[configName];
  
  return function rateLimitMiddleware(request: Request): { allowed: boolean; error?: Response } {
    const clientId = getClientIdentifier(request);
    const key = `${configName}:${clientId}`;
    const now = Date.now();
    
    // Get or create request record
    let record = requestStore.get(key);
    
    if (!record || now > record.resetTime) {
      // Create new record or reset expired one
      record = {
        count: 1,
        resetTime: now + config.windowMs
      };
      requestStore.set(key, record);
      return { allowed: true };
    }
    
    // Increment request count
    record.count++;
    
    // Check if limit exceeded
    if (record.count > config.maxRequests) {
      const resetIn = Math.ceil((record.resetTime - now) / 1000);
      
      const errorResponse = new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: config.message,
          retryAfter: resetIn,
          limit: config.maxRequests,
          windowMs: config.windowMs
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': resetIn.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': record.resetTime.toString()
          }
        }
      );
      
      return { allowed: false, error: errorResponse };
    }
    
    // Request allowed
    const remaining = Math.max(0, config.maxRequests - record.count);
    return { 
      allowed: true,
      // Note: In a real middleware, you'd set these headers on the response
      headers: {
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': record.resetTime.toString()
      }
    };
  };
}

// Multi-tier rate limiting - checks multiple limits
export function createMultiTierRateLimiter(configNames: (keyof typeof defaultConfigs)[]) {
  const limiters = configNames.map(name => ({ name, limiter: createRateLimiter(name) }));
  
  return function multiTierRateLimitMiddleware(request: Request): { allowed: boolean; error?: Response } {
    // Check all rate limits - if any fail, reject the request
    for (const { name, limiter } of limiters) {
      const result = limiter(request);
      if (!result.allowed) {
        return result; // Return the first rate limit error
      }
    }
    
    return { allowed: true };
  };
}

// Burst detection - detects rapid-fire requests
export function detectBurst(request: Request, windowMs: number = 1000, maxRequests: number = 10): boolean {
  const clientId = getClientIdentifier(request);
  const key = `burst:${clientId}`;
  const now = Date.now();
  
  let record = requestStore.get(key);
  
  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + windowMs };
    requestStore.set(key, record);
    return false; // No burst detected
  }
  
  record.count++;
  return record.count > maxRequests; // Burst detected if exceeded
}

// Enhanced rate limiter with burst detection
export function createEnhancedRateLimiter(configName: keyof typeof defaultConfigs = 'general') {
  const mainLimiter = createRateLimiter(configName);
  const burstLimiter = createRateLimiter('burst');
  
  return function enhancedRateLimitMiddleware(request: Request): { allowed: boolean; error?: Response } {
    // First check for burst attacks
    const burstResult = burstLimiter(request);
    if (!burstResult.allowed) {
      return burstResult;
    }
    
    // Then check main rate limit
    const mainResult = mainLimiter(request);
    return mainResult;
  };
}

// Export configurations for testing and monitoring
export { defaultConfigs, requestStore }; 