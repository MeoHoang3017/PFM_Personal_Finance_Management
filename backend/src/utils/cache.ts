/**
 * Cache Utility
 * @description Provides caching functionality using Redis
 */

import { getRedisClient } from '../config/redis';

const DEFAULT_TTL = 3600; // 1 hour in seconds
const USER_CACHE_TTL = 1800; // 30 minutes for user data
const MATCH_CACHE_TTL = 600; // 10 minutes for match data

/**
 * Cache key prefixes
 */
const CACHE_KEYS = {
  USER_BY_ID: 'user:id:',
  USER_BY_EMAIL: 'user:email:',
  USER_BY_USERNAME: 'user:username:',
  MATCH_BY_ID: 'match:id:',
  USER_MATCHES: 'user:matches:',
} as const;

/**
 * Get value from cache
 */
export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    const client = getRedisClient();
    if (!client || !client.isOpen) {
      return null;
    }

    const value = await client.get(key);
    if (!value) {
      return null;
    }

    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Cache get error for key ${key}:`, error);
    return null;
  }
};

/**
 * Set value in cache
 */
export const setCache = async (
  key: string,
  value: any,
  ttl: number = DEFAULT_TTL
): Promise<boolean> => {
  try {
    const client = getRedisClient();
    if (!client || !client.isOpen) {
      return false;
    }

    const serialized = JSON.stringify(value);
    await client.setEx(key, ttl, serialized);
    return true;
  } catch (error) {
    console.error(`Cache set error for key ${key}:`, error);
    return false;
  }
};

/**
 * Delete value from cache
 */
export const deleteCache = async (key: string): Promise<boolean> => {
  try {
    const client = getRedisClient();
    if (!client || !client.isOpen) {
      return false;
    }

    await client.del(key);
    return true;
  } catch (error) {
    console.error(`Cache delete error for key ${key}:`, error);
    return false;
  }
};

/**
 * Delete multiple keys matching a pattern
 */
export const deleteCachePattern = async (pattern: string): Promise<number> => {
  try {
    const client = getRedisClient();
    if (!client || !client.isOpen) {
      return 0;
    }

    const keys = await client.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }

    return await client.del(keys);
  } catch (error) {
    console.error(`Cache delete pattern error for ${pattern}:`, error);
    return 0;
  }
};

/**
 * User cache operations
 */
export const userCache = {
  /**
   * Get user by ID from cache
   */
  getById: async <T>(userId: string): Promise<T | null> => {
    return getCache<T>(`${CACHE_KEYS.USER_BY_ID}${userId}`);
  },

  /**
   * Set user by ID in cache
   */
  setById: async (userId: string, user: any): Promise<boolean> => {
    return setCache(`${CACHE_KEYS.USER_BY_ID}${userId}`, user, USER_CACHE_TTL);
  },

  /**
   * Get user by email from cache
   */
  getByEmail: async <T>(email: string): Promise<T | null> => {
    return getCache<T>(`${CACHE_KEYS.USER_BY_EMAIL}${email}`);
  },

  /**
   * Set user by email in cache
   */
  setByEmail: async (email: string, user: any): Promise<boolean> => {
    return setCache(`${CACHE_KEYS.USER_BY_EMAIL}${email}`, user, USER_CACHE_TTL);
  },

  /**
   * Get user by username from cache
   */
  getByUsername: async <T>(username: string): Promise<T | null> => {
    return getCache<T>(`${CACHE_KEYS.USER_BY_USERNAME}${username}`);
  },

  /**
   * Set user by username in cache
   */
  setByUsername: async (username: string, user: any): Promise<boolean> => {
    return setCache(`${CACHE_KEYS.USER_BY_USERNAME}${username}`, user, USER_CACHE_TTL);
  },

  /**
   * Invalidate all cache entries for a user
   */
  invalidate: async (userId: string, email?: string, username?: string): Promise<void> => {
    const promises: Promise<boolean | number>[] = [
      deleteCache(`${CACHE_KEYS.USER_BY_ID}${userId}`),
    ];

    if (email) {
      promises.push(deleteCache(`${CACHE_KEYS.USER_BY_EMAIL}${email}`));
    }

    if (username) {
      promises.push(deleteCache(`${CACHE_KEYS.USER_BY_USERNAME}${username}`));
    }

    // Also invalidate user matches cache
    promises.push(deleteCachePattern(`${CACHE_KEYS.USER_MATCHES}${userId}:*`));

    await Promise.all(promises);
  },
};

/**
 * Match cache operations
 */
export const matchCache = {
  /**
   * Get match by ID from cache
   */
  getById: async <T>(matchId: string): Promise<T | null> => {
    return getCache<T>(`${CACHE_KEYS.MATCH_BY_ID}${matchId}`);
  },

  /**
   * Set match by ID in cache
   */
  setById: async (matchId: string, match: any): Promise<boolean> => {
    return setCache(`${CACHE_KEYS.MATCH_BY_ID}${matchId}`, match, MATCH_CACHE_TTL);
  },

  /**
   * Get user matches from cache
   */
  getUserMatches: async <T>(userId: string, limit: number, skip: number): Promise<T | null> => {
    const cacheKey = `${CACHE_KEYS.USER_MATCHES}${userId}:${limit}:${skip}`;
    return getCache<T>(cacheKey);
  },

  /**
   * Set user matches in cache
   */
  setUserMatches: async (
    userId: string,
    limit: number,
    skip: number,
    matches: any
  ): Promise<boolean> => {
    const cacheKey = `${CACHE_KEYS.USER_MATCHES}${userId}:${limit}:${skip}`;
    return setCache(cacheKey, matches, MATCH_CACHE_TTL);
  },

  /**
   * Invalidate match cache
   */
  invalidate: async (matchId: string, userIds?: string[]): Promise<void> => {
    const promises: Promise<boolean | number>[] = [
      deleteCache(`${CACHE_KEYS.MATCH_BY_ID}${matchId}`),
    ];

    // Invalidate user matches cache for all players
    if (userIds && userIds.length > 0) {
      userIds.forEach((userId) => {
        promises.push(deleteCachePattern(`${CACHE_KEYS.USER_MATCHES}${userId}:*`));
      });
    }

    await Promise.all(promises);
  },
};

