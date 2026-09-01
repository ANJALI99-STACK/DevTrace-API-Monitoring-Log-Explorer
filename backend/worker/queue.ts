/**
 * Shared Redis connection config for BullMQ queues/workers.
 * Passed as-is to `new Worker(name, processor, { connection })`.
 */
export const connection = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
};
