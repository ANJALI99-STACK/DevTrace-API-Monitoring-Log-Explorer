import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
});

redisClient.on('connect', () => console.log('[redis] connected'));
redisClient.on('error', (err) => console.error('[redis] error', err));

/**
 * Cache helpers used by the dashboard controller.
 * Key convention: dashboard:<userId>
 */
export const cacheGet = async <T>(key: string): Promise<T | null> => {
  const raw = await redisClient.get(key);
  return raw ? (JSON.parse(raw) as T) : null;
};

export const cacheSet = async (key: string, value: unknown, ttlSeconds = 60): Promise<void> => {
  await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
};

export const cacheDel = async (key: string): Promise<void> => {
  await redisClient.del(key);
};
