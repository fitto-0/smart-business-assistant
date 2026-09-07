/**
 * Redis client configuration and utilities
 * Handles caching and session management
 */

const redis = require('redis');

let client = null;

/**
 * Initialize Redis client
 */
const initRedis = () => {
  if (client) {
    return client;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  client = redis.createClient({
    url: redisUrl,
    password: process.env.REDIS_PASSWORD || undefined,
  });

  client.on('error', (err) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Redis connection error (this is expected if Redis is not running):', err.message);
    }
  });

  client.on('connect', () => {
    console.log('Connected to Redis');
  });

  client.connect().catch((err) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Failed to connect to Redis (this is expected if Redis is not running):', err.message);
    }
  });

  return client;
};

/**
 * Get Redis client
 */
const getClient = () => {
  if (!client) {
    return initRedis();
  }
  return client;
};

/**
 * Cache helper functions
 */
const cache = {
  /**
   * Get value from cache
   */
  get: async (key) => {
    try {
      const client = getClient();
      if (!client.isOpen) {
        return null;
      }
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  /**
   * Set value in cache with expiration
   */
  set: async (key, value, ttl = 3600) => {
    try {
      const client = getClient();
      if (!client.isOpen) {
        return false;
      }
      await client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  },

  /**
   * Delete value from cache
   */
  delete: async (key) => {
    try {
      const client = getClient();
      if (!client.isOpen) {
        return false;
      }
      await client.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  },

  /**
   * Delete multiple keys matching a pattern
   */
  deletePattern: async (pattern) => {
    try {
      const client = getClient();
      if (!client.isOpen) {
        return false;
      }
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return false;
    }
  },

  /**
   * Clear all cache
   */
  flush: async () => {
    try {
      const client = getClient();
      if (!client.isOpen) {
        return false;
      }
      await client.flushDb();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  },
};

/**
 * Session management functions
 */
const session = {
  /**
   * Set session data
   */
  set: async (sessionId, data, ttl = 86400) => {
    const key = `session:${sessionId}`;
    return cache.set(key, data, ttl);
  },

  /**
   * Get session data
   */
  get: async (sessionId) => {
    const key = `session:${sessionId}`;
    return cache.get(key);
  },

  /**
   * Delete session
   */
  delete: async (sessionId) => {
    const key = `session:${sessionId}`;
    return cache.delete(key);
  },

  /**
   * Delete all user sessions
   */
  deleteAllUserSessions: async (userId) => {
    const pattern = `session:user:${userId}:*`;
    return cache.deletePattern(pattern);
  },
};

/**
 * Rate limiting with Redis
 */
const rateLimit = {
  /**
   * Check if request is allowed
   */
  check: async (key, limit, window) => {
    try {
      const client = getClient();
      if (!client.isOpen) {
        return { allowed: true, remaining: limit };
      }

      const current = await client.incr(key);
      
      if (current === 1) {
        await client.expire(key, window);
      }

      const allowed = current <= limit;
      const remaining = Math.max(0, limit - current);

      return { allowed, remaining, current };
    } catch (error) {
      console.error('Rate limit check error:', error);
      return { allowed: true, remaining: limit };
    }
  },

  /**
   * Reset rate limit
   */
  reset: async (key) => {
    try {
      const client = getClient();
      if (!client.isOpen) {
        return false;
      }
      await client.del(key);
      return true;
    } catch (error) {
      console.error('Rate limit reset error:', error);
      return false;
    }
  },
};

/**
 * Close Redis connection
 */
const close = async () => {
  if (client && client.isOpen) {
    await client.quit();
    client = null;
  }
};

module.exports = {
  initRedis,
  getClient,
  cache,
  session,
  rateLimit,
  close,
};
