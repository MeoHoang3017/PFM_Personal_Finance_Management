/**
 * Redis Configuration
 * @description Manages Redis connection and provides client instance
 */

import { createClient, type RedisClientType } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient: RedisClientType | null = null;

/**
 * Connect to Redis
 */
export const connectRedis = async (): Promise<RedisClientType> => {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  redisClient = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.error('Redis: Too many reconnection attempts, giving up');
          return new Error('Too many reconnection attempts');
        }
        // Exponential backoff: 50ms, 100ms, 200ms, 400ms, etc.
        return Math.min(retries * 50, 1000);
      },
    },
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    console.log('Redis: Connecting...');
  });

  redisClient.on('ready', () => {
    console.log('✅ Redis connected successfully');
  });

  redisClient.on('reconnecting', () => {
    console.log('Redis: Reconnecting...');
  });

  try {
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Redis connection failed:', error);
    throw error;
  }
};

/**
 * Get Redis client instance
 * @returns Redis client or null if not connected
 */
export const getRedisClient = (): RedisClientType | null => {
  return redisClient;
};

/**
 * Disconnect from Redis
 */
export const disconnectRedis = async (): Promise<void> => {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
    console.log('Redis disconnected');
  }
};

/**
 * Check if Redis is connected
 */
export const isRedisConnected = (): boolean => {
  return redisClient !== null && redisClient.isOpen;
};

